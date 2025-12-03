'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import axios from 'axios';
import * as cheerio from 'cheerio';

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

    // @ts-ignore
    const userId = session.user.id;

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
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const propertyId = formData.get("propertyId") as string;
    const url = formData.get("url") as string;
    const galleryUrl = formData.get("galleryUrl") as string;
    const iCalUrl = formData.get("iCalUrl") as string;

    if (!url.includes("airbnb")) {
        throw new Error("Invalid Airbnb URL");
    }

    try {
        // Use enhanced scraper
        const { scrapeAirbnbListing } = await import('@/lib/airbnb-scraper');
        const listingData = await scrapeAirbnbListing(url, galleryUrl || undefined);

        // Get the maximum order value for rooms in this property
        const maxOrderRoom = await prisma.room.findFirst({
            where: { propertyId },
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        const newOrder = maxOrderRoom ? maxOrderRoom.order + 1 : 0;

        // Create room with all scraped data
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

        // Create images at room level (they can be moved to property level later if needed)
        if (listingData.images.length > 0) {
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
            
            if (newImageUrls.length > 0) {
                console.log(`Importing ${newImageUrls.length} new images for room ${room.id} (${listingData.images.length - newImageUrls.length} duplicates skipped)`);
                
                // Download and store images locally
                const { downloadAndStoreImage } = await import('@/lib/download-image');
                const batchSize = 10; // Process in smaller batches for downloads
                let totalCreated = 0;
                
                // Download and create images for the room
                for (let i = 0; i < newImageUrls.length; i += batchSize) {
                    const batch = newImageUrls.slice(i, i + batchSize);
                    
                    // Download all images in the batch
                    const storedUrls = await Promise.all(
                        batch.map(url => downloadAndStoreImage(url, 'room-images'))
                    );
                    
                    // Create database records
                    const result = await prisma.image.createMany({
                        data: storedUrls.map(storedUrl => ({
                            url: storedUrl,
                            roomId: room.id
                        }))
                    });
                    
                    totalCreated += result.count;
                    console.log(`Created batch: ${result.count} images (total: ${totalCreated})`);
                }
                console.log(`Successfully imported ${totalCreated} images to room ${room.id}`);
            } else {
                console.log(`All ${listingData.images.length} images already exist for property ${propertyId} or room ${room.id}`);
            }
        }

    } catch (error) {
        console.error("Import failed:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to import listing");
    }

    revalidatePath(`/admin/properties/${propertyId}`);
    redirect(`/admin/properties/${propertyId}`);
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
