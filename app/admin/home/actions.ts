'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { downloadAndStoreImage } from "@/lib/download-image";
import { promises as fs } from 'fs';
import path from 'path';

// Get or create home page settings
async function getOrCreateHomePageSettings() {
    let settings = await prisma.homePageSettings.findFirst();
    
    if (!settings) {
        settings = await prisma.homePageSettings.create({
            data: {
                heroTitle: "Your Home away from home",
                heroSubtitle: "Enjoy Family hospitality - close to town, airport and beach",
                heroCtaText: "Explore Rooms",
                showHeroSection: true,
                featuresTitle: "Why Choose Us",
                showFeaturesSection: true,
                aboutTitle: "Experience the Perfect Balance",
                aboutDescription: "Discover a unique blend of coastal tranquility and city convenience. Our welcoming home offers comfortable accommodations just minutes from Dublin Airport, the vibrant city center, pristine beaches, and peaceful parks. Whether you're here for business or leisure, experience authentic Irish hospitality in a setting that feels like home.",
                showAboutSection: true,
                roomsTitle: "Rooms & Suites",
                roomsSubtitle: "Our suites provide all the amenities you need for a relaxing beach vacation, including stunning views, modern facilities, and easy beach access.",
                showRoomsSection: true,
                ctaTitle: "Welcome to Ireland's East Coast",
                ctaDescription: "We look forward to welcoming you to our home.",
                showCtaSection: true
            }
        });
        
        // Create default features
        const defaultFeatures = [
            { icon: '✈️', title: 'Close to the airport', description: 'Just minutes away from Dublin Airport, making your arrival and departure convenient and stress-free.', order: 0 },
            { icon: '🏙️', title: 'Close to Dublin city', description: 'Easy access to the vibrant heart of Dublin with its rich culture, history, and entertainment.', order: 1 },
            { icon: '🏖️', title: 'Nearby beach', description: 'Stroll to beautiful local beaches where you can relax, swim, or enjoy scenic coastal walks.', order: 2 },
            { icon: '🌳', title: 'Nearby Park', description: 'Discover Newbridge Park in Donabate, perfect for leisurely walks, picnics, and family outings.', order: 3 }
        ];
        
        await prisma.homePageFeature.createMany({
            data: defaultFeatures.map(f => ({
                ...f,
                homePageSettingsId: settings!.id
            }))
        });
    }
    
    if (!settings) {
        throw new Error("Failed to create or retrieve home page settings");
    }
    
    return settings;
}

// Update home page text content
export async function updateHomePageContent(formData: FormData) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const settings = await getOrCreateHomePageSettings();

    // Only update fields that are present in the form
    const updateData: any = {};

    // Hero Section fields
    if (formData.has("heroTitle")) {
        updateData.heroTitle = (formData.get("heroTitle") as string)?.trim() || null;
    }
    if (formData.has("heroSubtitle")) {
        updateData.heroSubtitle = (formData.get("heroSubtitle") as string)?.trim() || null;
    }
    if (formData.has("heroCtaText")) {
        updateData.heroCtaText = (formData.get("heroCtaText") as string)?.trim() || null;
    }
    if (formData.has("showHeroSection")) {
        updateData.showHeroSection = formData.get("showHeroSection") === "true";
    }

    // Features Section fields
    if (formData.has("featuresTitle")) {
        updateData.featuresTitle = (formData.get("featuresTitle") as string)?.trim() || null;
    }
    if (formData.has("showFeaturesSection")) {
        updateData.showFeaturesSection = formData.get("showFeaturesSection") === "true";
    }

    // About Section fields
    if (formData.has("aboutTitle")) {
        updateData.aboutTitle = (formData.get("aboutTitle") as string)?.trim() || null;
    }
    if (formData.has("aboutDescription")) {
        updateData.aboutDescription = (formData.get("aboutDescription") as string)?.trim() || null;
    }
    if (formData.has("showAboutSection")) {
        updateData.showAboutSection = formData.get("showAboutSection") === "true";
    }

    // Rooms Section fields
    if (formData.has("roomsTitle")) {
        updateData.roomsTitle = (formData.get("roomsTitle") as string)?.trim() || null;
    }
    if (formData.has("roomsSubtitle")) {
        updateData.roomsSubtitle = (formData.get("roomsSubtitle") as string)?.trim() || null;
    }
    if (formData.has("showRoomsSection")) {
        updateData.showRoomsSection = formData.get("showRoomsSection") === "true";
    }

    // CTA Section fields
    if (formData.has("ctaTitle")) {
        updateData.ctaTitle = (formData.get("ctaTitle") as string)?.trim() || null;
    }
    if (formData.has("ctaDescription")) {
        updateData.ctaDescription = (formData.get("ctaDescription") as string)?.trim() || null;
    }
    if (formData.has("showCtaSection")) {
        updateData.showCtaSection = formData.get("showCtaSection") === "true";
    }

    await prisma.homePageSettings.update({
        where: { id: settings.id },
        data: updateData
    });

    revalidatePath('/');
    revalidatePath('/admin/home');
}

// Toggle section visibility
export async function toggleSectionVisibility(section: string, visible: boolean) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const settings = await getOrCreateHomePageSettings();

    const updateData: any = {};
    updateData[section] = visible;

    await prisma.homePageSettings.update({
        where: { id: settings.id },
        data: updateData
    });

    revalidatePath('/');
    revalidatePath('/admin/home');
}

// Add hero image
export async function addHeroImage(imageUrl: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const settings = await getOrCreateHomePageSettings();

    // Download and store image locally
    const storedUrl = await downloadAndStoreImage(imageUrl, 'home-hero-images');

    // Get max order
    const maxOrderImage = await prisma.homePageImage.findFirst({
        where: { homePageSettingsId: settings.id },
        orderBy: { order: 'desc' },
        select: { order: true }
    });
    const newOrder = maxOrderImage ? maxOrderImage.order + 1 : 0;

    await prisma.homePageImage.create({
        data: {
            url: storedUrl,
            order: newOrder,
            homePageSettingsId: settings.id
        }
    });

    revalidatePath('/');
    revalidatePath('/admin/home');
}

// Delete hero image
export async function deleteHeroImage(imageId: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const image = await prisma.homePageImage.findUnique({
        where: { id: imageId }
    });

    if (!image) throw new Error("Image not found");

    // Delete local file
    if (image.url.startsWith('/')) {
        const filePath = path.join(process.cwd(), 'public', image.url);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Failed to delete file:', error);
        }
    }

    await prisma.homePageImage.delete({
        where: { id: imageId }
    });

    revalidatePath('/');
    revalidatePath('/admin/home');
}

// Delete multiple hero images
export async function deleteHeroImages(imageIds: string[]) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const images = await prisma.homePageImage.findMany({
        where: { id: { in: imageIds } }
    });

    // Delete local files
    for (const image of images) {
        if (image.url.startsWith('/')) {
            const filePath = path.join(process.cwd(), 'public', image.url);
            try {
                await fs.unlink(filePath);
            } catch (error) {
                console.error('Failed to delete file:', error);
            }
        }
    }

    await prisma.homePageImage.deleteMany({
        where: { id: { in: imageIds } }
    });

    revalidatePath('/');
    revalidatePath('/admin/home');
}

// Update hero image order
export async function updateHeroImageOrder(imageOrders: { imageId: string; order: number }[]) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    await Promise.all(
        imageOrders.map(({ imageId, order }) =>
            prisma.homePageImage.update({
                where: { id: imageId },
                data: { order }
            })
        )
    );

    revalidatePath('/');
    revalidatePath('/admin/home');
}

// Create feature
export async function createFeature(formData: FormData) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const settings = await getOrCreateHomePageSettings();

    const icon = formData.get("icon") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    // Get max order
    const maxOrderFeature = await prisma.homePageFeature.findFirst({
        where: { homePageSettingsId: settings.id },
        orderBy: { order: 'desc' },
        select: { order: true }
    });
    const newOrder = maxOrderFeature ? maxOrderFeature.order + 1 : 0;

    await prisma.homePageFeature.create({
        data: {
            icon: icon || null,
            title,
            description,
            order: newOrder,
            homePageSettingsId: settings.id
        }
    });

    revalidatePath('/');
    revalidatePath('/admin/home');
}

// Update feature
export async function updateFeature(featureId: string, formData: FormData) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const icon = formData.get("icon") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    await prisma.homePageFeature.update({
        where: { id: featureId },
        data: {
            icon: icon || null,
            title,
            description
        }
    });

    revalidatePath('/');
    revalidatePath('/admin/home');
}

// Delete feature
export async function deleteFeature(featureId: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    await prisma.homePageFeature.delete({
        where: { id: featureId }
    });

    revalidatePath('/');
    revalidatePath('/admin/home');
}

// Update feature order
export async function updateFeatureOrder(featureOrders: { featureId: string; order: number }[]) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    await Promise.all(
        featureOrders.map(({ featureId, order }) =>
            prisma.homePageFeature.update({
                where: { id: featureId },
                data: { order }
            })
        )
    );

    revalidatePath('/');
    revalidatePath('/admin/home');
}

