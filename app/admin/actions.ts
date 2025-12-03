'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateImportProgress, markImportComplete } from '@/lib/import-progress';

export async function toggleSinglePropertyMode(enabled: boolean) {
  const settings = await prisma.siteSettings.findFirst();

  if (settings) {
    await prisma.siteSettings.update({
      where: { id: settings.id },
      data: { singlePropertyMode: enabled }
    });
  } else {
    await prisma.siteSettings.create({
      data: { singlePropertyMode: enabled }
    });
  }

  revalidatePath('/');
  revalidatePath('/admin/properties');
}

export async function createProperty(formData: FormData) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    throw new Error("Unauthorized");
  }

  const userId = (session.user as { id?: string }).id;

  if (!userId) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) throw new Error("User not found");

    await prisma.property.create({
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        address: formData.get("address") as string,
        adminId: user.id,
      }
    });
  } else {
    await prisma.property.create({
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        address: formData.get("address") as string,
        adminId: userId,
      }
    });
  }

  revalidatePath("/admin/properties");
  redirect("/admin/properties");
}

export async function updateProperty(id: string, formData: FormData) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  await prisma.property.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      address: formData.get("address") as string,
    }
  });

  revalidatePath(`/admin/properties/${id}`);
  revalidatePath("/admin/properties");
  redirect("/admin/properties");
}

export async function importListing(formData: FormData) {
  // Wrap everything in try-catch to ensure all errors are caught and logged
  try {
    if (!authOptions) {
      console.error("[IMPORT] Auth options not configured");
      throw new Error("Authentication not configured");
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      console.error("[IMPORT] No session found");
      throw new Error("Unauthorized");
    }

    const propertyId = formData.get("propertyId") as string;
    const url = formData.get("url") as string;
    const galleryUrl = formData.get("galleryUrl") as string;
    const iCalUrl = formData.get("iCalUrl") as string;

    if (!propertyId) {
      console.error("[IMPORT] Missing propertyId");
      throw new Error("Property ID is required");
    }

    if (!url || !url.includes("airbnb")) {
      console.error("[IMPORT] Invalid URL:", url);
      throw new Error("Invalid Airbnb URL");
    }

    // Check if we're on Vercel and warn about Puppeteer limitations
    const isVercel = !!(process.env.VERCEL || process.env.VERCEL_URL);
    if (isVercel) {
      console.log("⚠️ Running on Vercel - Puppeteer may have limitations");
    }

    // Main import logic
    try {
      // Write initial progress - make sure this completes
      try {
        await updateImportProgress(propertyId, 'initializing', 'Starting browser and loading page...', 5, '[IMPORT] Starting import');
      } catch (progressError) {
        console.error('[IMPORT] Failed to write initial progress (non-critical):', progressError);
      }

      console.log(`[IMPORT] Starting import for property ${propertyId}`);
      console.log(`[IMPORT] URL: ${url}`);
      console.log(`[IMPORT] Gallery URL: ${galleryUrl || 'none'}`);
      console.log(`[IMPORT] iCal URL: ${iCalUrl || 'none'}`);

      // Use enhanced scraper
      await updateImportProgress(propertyId, 'initializing', 'Loading scraper module...', 10, '[IMPORT] Loading scraper module...');
      console.log(`[IMPORT] Loading scraper module...`);
      const { scrapeAirbnbListing } = await import('@/lib/airbnb-scraper');

      await updateImportProgress(propertyId, 'scraping', 'Extracting title, description, price, and capacity...', 20, '[IMPORT] Starting scrape...');
      console.log(`[IMPORT] Starting scrape...`);
      const listingData = await scrapeAirbnbListing(url, galleryUrl || undefined, async (stage, message, progress, log) => {
        // Fire and forget - don't block on progress updates
        updateImportProgress(propertyId, stage, message, progress, log).catch(err => {
          console.error('[PROGRESS] Failed to update progress (non-critical):', err);
        });
      });

      await updateImportProgress(propertyId, 'scraping', 'Scrape completed', 40, `[IMPORT] Scrape completed: ${listingData.images.length} images, ${listingData.amenities.length} amenities`);
      console.log(`[IMPORT] Scrape completed:`, {
        title: listingData.title,
        imagesCount: listingData.images.length,
        amenitiesCount: listingData.amenities.length,
        price: listingData.price,
        capacity: listingData.capacity
      });

      // Get the maximum order value for rooms in this property
      await updateImportProgress(propertyId, 'saving', 'Preparing to save room...', 50, '[IMPORT] Getting max order for property');
      console.log(`[IMPORT] Getting max order for property ${propertyId}...`);
      const maxOrderRoom = await prisma.room.findFirst({
        where: { propertyId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });

      const newOrder = maxOrderRoom ? maxOrderRoom.order + 1 : 0;
      console.log(`[IMPORT] New room order: ${newOrder}`);

      // Create room with all scraped data
      await updateImportProgress(propertyId, 'saving', 'Creating room record...', 60, '[IMPORT] Creating room record...');
      console.log(`[IMPORT] Creating room record...`);
      const room = await prisma.room.create({
        data: {
          name: listingData.title,
          description: listingData.description,
          price: listingData.price,
          capacity: listingData.capacity,
          airbnbUrl: url,
          iCalUrl: iCalUrl || null,
          amenities: JSON.stringify(listingData.amenities),
          propertyId: propertyId,
          order: newOrder,
        }
      });
      await updateImportProgress(propertyId, 'saving', `Room created: ${room.id}`, 65, `[IMPORT] Room created with ID: ${room.id}`);
      console.log(`[IMPORT] Room created with ID: ${room.id}`);

      // Create images at room level (they can be moved to property level later if needed)
      if (listingData.images.length > 0) {
        console.log(`[IMPORT] Processing ${listingData.images.length} images...`);

        // Check if room already has images
        const existingRoomImages = await prisma.image.findMany({
          where: { roomId: room.id },
          select: { url: true }
        });

        // Check if property already has these images (to avoid duplicates)
        const existingPropertyImages = await prisma.image.findMany({
          where: { propertyId },
          select: { url: true }
        });

        // Combine existing URLs from both property and room
        const existingUrls = new Set([
          ...existingPropertyImages.map(img => img.url),
          ...existingRoomImages.map(img => img.url)
        ]);

        // Filter out duplicate images
        const newImageUrls = listingData.images.filter(url => !existingUrls.has(url));
        console.log(`[IMPORT] Found ${newImageUrls.length} new images (${listingData.images.length - newImageUrls.length} duplicates skipped)`);

        if (newImageUrls.length > 0) {
          // Download and store images
          const { downloadAndStoreImage } = await import('@/lib/download-image');
          const batchSize = 10; // Process in smaller batches for downloads
          let totalCreated = 0;
          let failedDownloads = 0;

          // Download and create images for the room
          for (let i = 0; i < newImageUrls.length; i += batchSize) {
            const batch = newImageUrls.slice(i, i + batchSize);
            console.log(`[IMPORT] Processing image batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newImageUrls.length / batchSize)}...`);

            try {
              // Download all images in the batch
              const storedUrls = await Promise.allSettled(
                batch.map(async (url, idx) => {
                  try {
                    console.log(`[IMPORT] Downloading image ${i + idx + 1}/${newImageUrls.length}: ${url.substring(0, 80)}...`);
                    return await downloadAndStoreImage(url, 'room-images');
                  } catch (error) {
                    console.error(`[IMPORT] Failed to download image ${i + idx + 1}:`, error);
                    failedDownloads++;
                    throw error;
                  }
                })
              );

              // Filter successful downloads
              const successfulUrls = storedUrls
                .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
                .map(result => result.value);

              if (successfulUrls.length > 0) {
                // Create database records
                const result = await prisma.image.createMany({
                  data: successfulUrls.map(storedUrl => ({
                    url: storedUrl,
                    roomId: room.id
                  }))
                });

                totalCreated += result.count;
                console.log(`[IMPORT] Created batch: ${result.count} images (total: ${totalCreated}, failed: ${failedDownloads})`);
              } else {
                console.warn(`[IMPORT] No images successfully downloaded in this batch`);
              }
            } catch (error) {
              console.error(`[IMPORT] Error processing batch:`, error);
              failedDownloads += batch.length;
            }
          }
          console.log(`[IMPORT] Successfully imported ${totalCreated} images to room ${room.id} (${failedDownloads} failed)`);
        } else {
          console.log(`[IMPORT] All ${listingData.images.length} images already exist for property ${propertyId} or room ${room.id}`);
        }
      } else {
        await updateImportProgress(propertyId, 'saving', 'No images to import, continuing...', 95, '[IMPORT] No images to import - this is OK, you can add images manually later');
        console.log(`[IMPORT] No images to import`);
      }

      console.log(`[IMPORT] Import completed successfully for room ${room.id}`);

      // Always mark as complete and redirect, even if images/amenities are empty
      await updateImportProgress(propertyId, 'complete', 'Import completed successfully!', 100, `[IMPORT] Import completed successfully for room ${room.id}. Images: ${listingData.images.length}, Amenities: ${listingData.amenities.length}`);
      await markImportComplete(propertyId);

      // Revalidate paths before redirect
      revalidatePath(`/admin/properties/${propertyId}`);
      revalidatePath('/admin/properties');

      // Call redirect - it throws a special error that Next.js handles
      redirect(`/admin/properties/${propertyId}`);
    } catch (error) {
      // Check if this is a Next.js redirect (expected behavior, not an error)
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = (error as { digest?: string }).digest;
        if (digest && typeof digest === 'string' && digest.includes('NEXT_REDIRECT')) {
          // This is a redirect, not an error - rethrow it so Next.js handles it
          console.log('[IMPORT] Redirect detected, rethrowing for Next.js to handle');
          throw error;
        }
      }

      // Enhanced error logging
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : 'UnknownError';

      console.error("[IMPORT] ========== IMPORT FAILED ==========");
      console.error("[IMPORT] Error Name:", errorName);
      console.error("[IMPORT] Error Message:", errorMessage);
      console.error("[IMPORT] Error Stack:", errorStack);
      console.error("[IMPORT] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error("[IMPORT] Environment:", {
        isVercel: isVercel,
        nodeEnv: process.env.NODE_ENV,
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        vercelEnv: process.env.VERCEL_ENV,
        functionRegion: process.env.VERCEL_REGION
      });
      console.error("[IMPORT] ====================================");

      // Create a detailed error message that will be visible to the user
      let userFriendlyMessage = `Import failed: ${errorMessage}`;

      // Provide more helpful error messages
      if (errorMessage.includes('puppeteer') || errorMessage.includes('browser') || errorMessage.includes('Chrome') || errorMessage.includes('chromium')) {
        userFriendlyMessage = `Browser automation failed. On Vercel, Puppeteer requires special configuration. Error: ${errorMessage}`;
      } else if (errorMessage.includes('BLOB') || errorMessage.includes('storage') || errorMessage.includes('ENOENT')) {
        userFriendlyMessage = `Image storage failed. Ensure BLOB_READ_WRITE_TOKEN is set in Vercel environment variables. Error: ${errorMessage}`;
      } else if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
        userFriendlyMessage = `Request timed out. The Airbnb page may be slow or blocked. Try again or provide a gallery URL. Error: ${errorMessage}`;
      } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('network')) {
        userFriendlyMessage = `Network error. Unable to connect to Airbnb. Error: ${errorMessage}`;
      } else if (errorMessage.includes('redirect') || errorMessage.includes('redirected')) {
        userFriendlyMessage = `Redirect error. The server action tried to redirect but failed. Error: ${errorMessage}`;
      }

      // Update progress with error status
      await updateImportProgress(propertyId, 'error', `Import failed: ${userFriendlyMessage}`, 0, `[IMPORT] Error: ${errorMessage}`, userFriendlyMessage);
      await markImportComplete(propertyId); // Mark as complete even on error

      // Throw error with detailed message - Next.js server actions will surface this
      const detailedError = new Error(userFriendlyMessage);
      (detailedError as Error & { cause?: unknown }).cause = error; // Preserve original error
      throw detailedError;
    }
  } catch (outerError) {
    // Check if this is a Next.js redirect (expected behavior, not an error)
    if (outerError && typeof outerError === 'object' && 'digest' in outerError) {
      const digest = (outerError as { digest?: string }).digest;
      if (digest && typeof digest === 'string' && digest.includes('NEXT_REDIRECT')) {
        // This is a redirect, not an error - rethrow it so Next.js handles it
        throw outerError;
      }
    }

    // Catch any errors that occur outside the main try block (e.g., during formData parsing, auth checks)
    const errorMessage = outerError instanceof Error ? outerError.message : String(outerError);
    const errorStack = outerError instanceof Error ? outerError.stack : undefined;

    console.error("[IMPORT] ========== OUTER ERROR CAUGHT ==========");
    console.error("[IMPORT] This error occurred outside the main import logic");
    console.error("[IMPORT] Error Message:", errorMessage);
    console.error("[IMPORT] Error Stack:", errorStack);
    console.error("[IMPORT] Full error:", JSON.stringify(outerError, Object.getOwnPropertyNames(outerError)));
    console.error("[IMPORT] ==========================================");

    // Re-throw with a clear message
    throw new Error(`Import setup failed: ${errorMessage}. Check Vercel logs for details.`);
  }
}

export async function addPropertyImage(propertyId: string, imageUrl: string) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Download and store image locally
  const { downloadAndStoreImage } = await import('@/lib/download-image');
  const storedUrl = await downloadAndStoreImage(imageUrl, 'property-images');

  await prisma.image.create({
    data: {
      url: storedUrl,
      propertyId: propertyId
    }
  });

  revalidatePath(`/admin/properties/${propertyId}`);
}

export async function deletePropertyImage(imageId: string, propertyId: string) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Get image to delete the file if it's stored locally
  const image = await prisma.image.findUnique({
    where: { id: imageId }
  });

  await prisma.image.delete({
    where: { id: imageId }
  });

  // Delete the file using storage abstraction (handles Vercel Blob or local filesystem)
  if (image && (image.url.startsWith('/') || image.url.startsWith('https://'))) {
    try {
      const { deleteFile } = await import('@/lib/storage');
      await deleteFile(image.url);
    } catch (error) {
      console.error('Error deleting image file:', error);
    }
  }

  revalidatePath(`/admin/properties/${propertyId}`);
}

export async function deletePropertyImages(imageIds: string[], propertyId: string) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Get images to delete the files if they're stored locally
  const images = await prisma.image.findMany({
    where: {
      id: { in: imageIds },
      propertyId: propertyId
    }
  });

  await prisma.image.deleteMany({
    where: {
      id: { in: imageIds },
      propertyId: propertyId
    }
  });

  // Delete the files using storage abstraction (handles Vercel Blob or local filesystem)
  const { deleteFile } = await import('@/lib/storage');

  for (const image of images) {
    if (image.url.startsWith('/') || image.url.startsWith('https://')) {
      try {
        await deleteFile(image.url);
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }
  }

  revalidatePath(`/admin/properties/${propertyId}`);
}
