'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { downloadAndStoreImage } from "@/lib/download-image";
import { promises as fs } from 'fs';
import path from 'path';

// Get or create location page settings
async function getOrCreateLocationPageSettings() {
    let settings = await prisma.locationPageSettings.findFirst();
    
    if (!settings) {
        settings = await prisma.locationPageSettings.create({
            data: {
                heroImageUrl: "/hero-rentalmanager.png",
                heroTitle: "Explore the Area",
                heroSubtitle: "Discover the unique locations near your properties",
                area1Title: "Area 1",
                area1Subtitle: "Describe the first area near your properties",
                area1Content: "Add content about the first area near your properties. Use double line breaks to separate paragraphs.",
                area1ImageUrl: "/location1.png",
                area2Title: "Area 2",
                area2Subtitle: "Describe the second area near your properties",
                area2Content: "Add content about the second area near your properties. Use double line breaks to separate paragraphs.",
                area2ImageUrl: "/location2.png",
                mapTitle: "Our Location",
                mapEmbedUrl: null
            }
        });
    }
    
    return settings;
}

// Update location page content
export async function updateLocationPageContent(formData: FormData) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const settings = await getOrCreateLocationPageSettings();

    const heroTitle = formData.get("heroTitle") as string;
    const heroSubtitle = formData.get("heroSubtitle") as string;
    const area1Title = formData.get("area1Title") as string;
    const area1Subtitle = formData.get("area1Subtitle") as string;
    const area1Content = formData.get("area1Content") as string;
    const area2Title = formData.get("area2Title") as string;
    const area2Subtitle = formData.get("area2Subtitle") as string;
    const area2Content = formData.get("area2Content") as string;
    const mapTitle = formData.get("mapTitle") as string;
    const mapEmbedUrl = formData.get("mapEmbedUrl") as string;

    await prisma.locationPageSettings.update({
        where: { id: settings.id },
        data: {
            heroTitle: heroTitle || null,
            heroSubtitle: heroSubtitle || null,
            area1Title: area1Title || null,
            area1Subtitle: area1Subtitle || null,
            area1Content: area1Content || null,
            area2Title: area2Title || null,
            area2Subtitle: area2Subtitle || null,
            area2Content: area2Content || null,
            mapTitle: mapTitle || null,
            mapEmbedUrl: mapEmbedUrl || null,
        }
    });

    revalidatePath('/location');
    revalidatePath('/admin/location');
}

// Update hero image
export async function updateHeroImage(imageUrl: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const settings = await getOrCreateLocationPageSettings();

    // Download and store image locally if it's a URL
    let storedUrl = imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        storedUrl = await downloadAndStoreImage(imageUrl, 'location-hero-images');
    }

    // Delete old image using storage abstraction (handles Vercel Blob or local filesystem)
    if (settings.heroImageUrl && settings.heroImageUrl !== storedUrl && (settings.heroImageUrl.startsWith('/') || settings.heroImageUrl.startsWith('https://'))) {
        try {
            const { deleteFile } = await import('@/lib/storage');
            await deleteFile(settings.heroImageUrl);
        } catch (error) {
            console.error('Failed to delete old hero image:', error);
        }
    }

    await prisma.locationPageSettings.update({
        where: { id: settings.id },
        data: { heroImageUrl: storedUrl }
    });

    revalidatePath('/location');
    revalidatePath('/admin/location');
}

// Update Area 1 image
export async function updateArea1Image(imageUrl: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const settings = await getOrCreateLocationPageSettings();

    // Download and store image locally if it's a URL
    let storedUrl = imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        storedUrl = await downloadAndStoreImage(imageUrl, 'location-images');
    }

    // Delete old image using storage abstraction (handles Vercel Blob or local filesystem)
    if (settings.area1ImageUrl && settings.area1ImageUrl !== storedUrl && (settings.area1ImageUrl.startsWith('/') || settings.area1ImageUrl.startsWith('https://'))) {
        try {
            const { deleteFile } = await import('@/lib/storage');
            await deleteFile(settings.area1ImageUrl);
        } catch (error) {
            console.error('Failed to delete old Area 1 image:', error);
        }
    }

    await prisma.locationPageSettings.update({
        where: { id: settings.id },
        data: { area1ImageUrl: storedUrl }
    });

    revalidatePath('/location');
    revalidatePath('/admin/location');
}

// Update Area 2 image
export async function updateArea2Image(imageUrl: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const settings = await getOrCreateLocationPageSettings();

    // Download and store image locally if it's a URL
    let storedUrl = imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        storedUrl = await downloadAndStoreImage(imageUrl, 'location-images');
    }

    // Delete old image using storage abstraction (handles Vercel Blob or local filesystem)
    if (settings.area2ImageUrl && settings.area2ImageUrl !== storedUrl && (settings.area2ImageUrl.startsWith('/') || settings.area2ImageUrl.startsWith('https://'))) {
        try {
            const { deleteFile } = await import('@/lib/storage');
            await deleteFile(settings.area2ImageUrl);
        } catch (error) {
            console.error('Failed to delete old Area 2 image:', error);
        }
    }

    await prisma.locationPageSettings.update({
        where: { id: settings.id },
        data: { area2ImageUrl: storedUrl }
    });

    revalidatePath('/location');
    revalidatePath('/admin/location');
}

