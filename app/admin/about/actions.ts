'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// About Page Settings
export async function toggleShowAboutPage(enabled: boolean) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const settings = await prisma.aboutPageSettings.findFirst();

  if (settings) {
    await prisma.aboutPageSettings.update({
      where: { id: settings.id },
      data: { showAboutPage: enabled }
    });
  } else {
    await prisma.aboutPageSettings.create({
      data: { showAboutPage: enabled }
    });
  }

  revalidatePath('/about');
  revalidatePath('/admin/about');
}

// Owner Management
export async function createOwner(formData: FormData) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const bio = formData.get("bio") as string | null;
  const facebookUrl = formData.get("facebookUrl") as string | null;
  const instagramUrl = formData.get("instagramUrl") as string | null;
  const twitterUrl = formData.get("twitterUrl") as string | null;
  const linkedinUrl = formData.get("linkedinUrl") as string | null;
  const airbnbUrl = formData.get("airbnbUrl") as string | null;
  const websiteUrl = formData.get("websiteUrl") as string | null;

  // Get max order
  const maxOrderOwner = await prisma.owner.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true }
  });
  const newOrder = maxOrderOwner ? maxOrderOwner.order + 1 : 0;

  const newOwner = await prisma.owner.create({
    data: {
      name,
      bio: bio || null,
      facebookUrl: facebookUrl || null,
      instagramUrl: instagramUrl || null,
      twitterUrl: twitterUrl || null,
      linkedinUrl: linkedinUrl || null,
      airbnbUrl: airbnbUrl || null,
      websiteUrl: websiteUrl || null,
      order: newOrder
    }
  });

  revalidatePath('/admin/about');
  revalidatePath('/about');

  return newOwner.id;
}

export async function updateOwner(ownerId: string, formData: FormData) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const bio = formData.get("bio") as string | null;
  const profileImage = formData.get("profileImage") as string | null;
  const facebookUrl = formData.get("facebookUrl") as string | null;
  const instagramUrl = formData.get("instagramUrl") as string | null;
  const twitterUrl = formData.get("twitterUrl") as string | null;
  const linkedinUrl = formData.get("linkedinUrl") as string | null;
  const airbnbUrl = formData.get("airbnbUrl") as string | null;
  const websiteUrl = formData.get("websiteUrl") as string | null;

  await prisma.owner.update({
    where: { id: ownerId },
    data: {
      name,
      bio: bio || null,
      profileImage: profileImage || null,
      facebookUrl: facebookUrl || null,
      instagramUrl: instagramUrl || null,
      twitterUrl: twitterUrl || null,
      linkedinUrl: linkedinUrl || null,
      airbnbUrl: airbnbUrl || null,
      websiteUrl: websiteUrl || null
    }
  });

  revalidatePath('/admin/about');
  revalidatePath('/about');
}

export async function deleteOwner(ownerId: string) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  await prisma.owner.delete({
    where: { id: ownerId }
  });

  revalidatePath('/admin/about');
  revalidatePath('/about');
}

export async function updateOwnerOrder(ownerOrders: { ownerId: string; order: number }[]) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  await Promise.all(
    ownerOrders.map(({ ownerId, order }) =>
      prisma.owner.update({
        where: { id: ownerId },
        data: { order }
      })
    )
  );

  revalidatePath('/admin/about');
  revalidatePath('/about');
}

// Social Media Scanning
export async function scanSocialMedia(ownerId: string) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    include: { images: true }
  });

  if (!owner) throw new Error("Owner not found");

  // Import scanner dynamically to avoid issues if puppeteer isn't available
  const { scanSocialMediaProfiles } = await import('@/lib/social-media-scanner');

  // Scan social media profiles
  const scannedData = await scanSocialMediaProfiles({
    facebook: owner.facebookUrl,
    instagram: owner.instagramUrl,
    twitter: owner.twitterUrl,
    linkedin: owner.linkedinUrl,
    airbnb: owner.airbnbUrl,
    website: owner.websiteUrl
  });

  // Save scanned data
  const fullScannedData = {
    ...scannedData,
    timestamp: new Date().toISOString()
  };

  await prisma.owner.update({
    where: { id: ownerId },
    data: {
      scannedData: JSON.stringify(fullScannedData),
      bio: scannedData.summary || owner.bio // Update bio if summary found
    }
  });

  // Add scanned images to owner images
  if (scannedData.images && scannedData.images.length > 0) {
    const existingImageUrls = owner.images?.map(img => img.url) || [];
    const { downloadAndStoreImage } = await import('@/lib/download-image');

    // Download and store each image
    const newImages = await Promise.all(
      scannedData.images
        .filter(url => url && !existingImageUrls.includes(url))
        .map(async (url: string) => {
          try {
            const storedUrl = await downloadAndStoreImage(url, 'owner-images');
            return {
              ownerId: owner.id,
              url: storedUrl,
              isProfile: false
            };
          } catch (error) {
            console.error(`Failed to download image ${url}:`, error);
            return null;
          }
        })
    );

    // Filter out null values (failed downloads)
    const validImages = newImages.filter(img => img !== null) as Array<{
      ownerId: string;
      url: string;
      isProfile: boolean;
    }>;

    if (validImages.length > 0) {
      await prisma.ownerImage.createMany({
        data: validImages
      });
    }
  }

  revalidatePath('/admin/about');
  revalidatePath('/about');

  return {
    summary: scannedData.summary || null,
    images: scannedData.images || [],
    bios: scannedData.bios || {},
    concatenatedBios: scannedData.concatenatedBios || null
  };
}

export async function improveBioWithGemini(ownerId: string) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const owner = await prisma.owner.findUnique({
    where: { id: ownerId }
  });

  if (!owner) throw new Error("Owner not found");

  // Get concatenated bios from scannedData
  const scannedData = owner.scannedData ? JSON.parse(owner.scannedData) : null;
  const concatenatedBios = scannedData?.concatenatedBios;

  if (!concatenatedBios) {
    throw new Error("No bios found. Please scan social media first.");
  }

  // Import Gemini utility
  const { improveBioWithGemini: improveBioGemini } = await import('@/lib/gemini');

  // Get improved bio from Gemini
  const improvedBio = await improveBioGemini(concatenatedBios, owner.name);

  // Update owner bio
  await prisma.owner.update({
    where: { id: ownerId },
    data: {
      bio: improvedBio
    }
  });

  revalidatePath('/admin/about');
  revalidatePath('/about');

  return { improvedBio };
}

export async function scanSingleSocialMedia(ownerId: string, platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'airbnb' | 'website', url?: string | null) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    include: { images: true }
  });

  if (!owner) throw new Error("Owner not found");

  // Use provided URL, or fall back to database value
  let profileUrl: string | null = url || null;

  if (!profileUrl) {
    // Get the URL for the specific platform from database
    switch (platform) {
      case 'facebook':
        profileUrl = owner.facebookUrl;
        break;
      case 'instagram':
        profileUrl = owner.instagramUrl;
        break;
      case 'twitter':
        profileUrl = owner.twitterUrl;
        break;
      case 'linkedin':
        profileUrl = owner.linkedinUrl;
        break;
      case 'airbnb':
        profileUrl = owner.airbnbUrl;
        break;
      case 'website':
        profileUrl = owner.websiteUrl;
        break;
    }
  }

  if (!profileUrl) {
    throw new Error(`No ${platform} URL found. Please enter a ${platform} URL first.`);
  }

  // Import scanner dynamically
  const { scanSocialMediaProfiles } = await import('@/lib/social-media-scanner');

  // Scan only the specific platform
  const urlsToScan: any = {};
  urlsToScan[platform] = profileUrl;

  const scannedData = await scanSocialMediaProfiles(urlsToScan);

  // Update owner with scanned data
  const existingScannedData = owner.scannedData ? JSON.parse(owner.scannedData) : {};
  const fullScannedData = {
    ...existingScannedData,
    [platform]: {
      ...scannedData,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };

  // Update bio if summary found and owner doesn't have a bio yet
  const newBio = scannedData.summary && !owner.bio ? scannedData.summary : owner.bio;

  await prisma.owner.update({
    where: { id: ownerId },
    data: {
      scannedData: JSON.stringify(fullScannedData),
      bio: newBio
    }
  });

  // Add scanned images to owner images
  if (scannedData.images && scannedData.images.length > 0) {
    const existingImageUrls = owner.images?.map(img => img.url) || [];
    const { downloadAndStoreImage } = await import('@/lib/download-image');

    // Download and store each image
    const newImages = await Promise.all(
      scannedData.images
        .filter((url: string) => url && !existingImageUrls.includes(url))
        .map(async (url: string) => {
          const storedUrl = await downloadAndStoreImage(url, 'owner-images');
          return {
            url: storedUrl,
            ownerId,
            isProfile: false
          };
        })
    );

    if (newImages.length > 0) {
      await prisma.ownerImage.createMany({
        data: newImages
      });
    }
  }

  revalidatePath('/admin/about');
  revalidatePath('/about');

  return {
    summary: scannedData.summary || null,
    images: scannedData.images || []
  };
}

// Owner Images
export async function addOwnerImage(ownerId: string, imageUrl: string) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // If URL is already a local path (starts with /), use it directly
  // Otherwise, download and store it locally
  let storedUrl: string;
  if (imageUrl.startsWith('/')) {
    storedUrl = imageUrl;
  } else {
    const { downloadAndStoreImage } = await import('@/lib/download-image');
    storedUrl = await downloadAndStoreImage(imageUrl, 'owner-images');
  }

  await prisma.ownerImage.create({
    data: {
      ownerId,
      url: storedUrl
    }
  });

  revalidatePath('/admin/about');
  revalidatePath('/about');
}

export async function setProfileImage(ownerId: string, imageId: string) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Verify the image belongs to this owner
  const image = await prisma.ownerImage.findUnique({
    where: { id: imageId }
  });

  if (!image) {
    throw new Error("Image not found");
  }

  if (image.ownerId !== ownerId) {
    throw new Error("Image does not belong to this owner");
  }

  // Unset all other profile images for this owner
  await prisma.ownerImage.updateMany({
    where: {
      ownerId,
      isProfile: true
    },
    data: {
      isProfile: false
    }
  });

  // Set the new profile image
  await prisma.ownerImage.update({
    where: { id: imageId },
    data: { isProfile: true }
  });

  // Update owner's profileImage field
  await prisma.owner.update({
    where: { id: ownerId },
    data: { profileImage: image.url }
  });

  revalidatePath('/admin/about');
  revalidatePath('/about');
}

export async function deleteOwnerImage(imageId: string, ownerId: string) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Get image to delete the file if it's stored locally
  const image = await prisma.ownerImage.findUnique({
    where: { id: imageId }
  });

  await prisma.ownerImage.delete({
    where: { id: imageId }
  });

  // Delete the file if it's stored locally
  if (image && image.url.startsWith('/owner-images/')) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'public', image.url);
      await fs.unlink(filePath).catch(() => {
        // Ignore errors if file doesn't exist
      });
    } catch (error) {
      console.error('Error deleting image file:', error);
    }
  }

  revalidatePath('/admin/about');
  revalidatePath('/about');
}

export async function deleteOwnerImages(imageIds: string[], ownerId: string) {
  if (!authOptions) throw new Error("Authentication not configured");
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Get images to delete the files if they're stored locally
  const images = await prisma.ownerImage.findMany({
    where: {
      id: { in: imageIds },
      ownerId: ownerId
    }
  });

  await prisma.ownerImage.deleteMany({
    where: {
      id: { in: imageIds },
      ownerId: ownerId
    }
  });

  // Delete the files if they're stored locally
  const fs = await import('fs/promises');
  const path = await import('path');

  for (const image of images) {
    if (image.url.startsWith('/owner-images/')) {
      try {
        const filePath = path.join(process.cwd(), 'public', image.url);
        await fs.unlink(filePath).catch(() => {
          // Ignore errors if file doesn't exist
        });
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }
  }

  revalidatePath('/admin/about');
  revalidatePath('/about');
}

