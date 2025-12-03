'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRoom(formData: FormData) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const propertyId = formData.get("propertyId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const capacity = formData.get("capacity") as string;
    const airbnbUrl = formData.get("airbnbUrl") as string;
    const iCalUrl = formData.get("iCalUrl") as string;

    // Get the maximum order value for rooms in this property
    const maxOrderRoom = await prisma.room.findFirst({
        where: { propertyId },
        orderBy: { order: 'desc' },
        select: { order: true }
    });

    const newOrder = maxOrderRoom ? maxOrderRoom.order + 1 : 0;

    await prisma.room.create({
        data: {
            name,
            description: description || null,
            price: price ? parseFloat(price) : null,
            capacity: capacity ? parseInt(capacity) : null,
            airbnbUrl: airbnbUrl || null,
            showAirbnbLink: (airbnbUrl && airbnbUrl.trim()) ? true : false,
            iCalUrl: iCalUrl || null,
            showCalendar: true, // Default to showing calendar
            propertyId,
            order: newOrder,
        }
    });

    revalidatePath(`/admin/properties/${propertyId}`);
    redirect(`/admin/properties/${propertyId}`);
}

export async function updateRoom(roomId: string, formData: FormData) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const capacity = formData.get("capacity") as string;
    const airbnbUrl = formData.get("airbnbUrl") as string;
    const iCalUrl = formData.get("iCalUrl") as string;

    // Get current room to preserve showAirbnbLink and showCalendar
    const currentRoom = await prisma.room.findUnique({
        where: { id: roomId },
        select: { showAirbnbLink: true, showCalendar: true }
    });

    const room = await prisma.room.update({
        where: { id: roomId },
        data: {
            name,
            description: description || null,
            price: price ? parseFloat(price) : null,
            capacity: capacity ? parseInt(capacity) : null,
            airbnbUrl: airbnbUrl || null,
            showAirbnbLink: (airbnbUrl && airbnbUrl.trim()) 
                ? (currentRoom?.showAirbnbLink ?? true) // Preserve existing state or default to true
                : false, // Set to false if URL is removed
            iCalUrl: iCalUrl || null,
            // Preserve showCalendar if not being updated
            showCalendar: currentRoom?.showCalendar ?? true,
        },
        select: { propertyId: true }
    });

    revalidatePath(`/admin/rooms/${roomId}`);
    revalidatePath(`/admin/properties/${room.propertyId}`);
    redirect(`/admin/properties/${room.propertyId}`);
}

export async function addRoomImage(roomId: string, imageUrl: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Download and store image locally
    const { downloadAndStoreImage } = await import('@/lib/download-image');
    const storedUrl = await downloadAndStoreImage(imageUrl, 'room-images');

    await prisma.image.create({
        data: {
            url: storedUrl,
            roomId: roomId
        }
    });

    revalidatePath(`/admin/rooms/${roomId}`);
}

export async function deleteRoomImage(imageId: string, roomId: string) {
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

    revalidatePath(`/admin/rooms/${roomId}`);
}

export async function deleteRoomImages(imageIds: string[], roomId: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Get images to delete the files if they're stored locally
    const images = await prisma.image.findMany({
        where: {
            id: { in: imageIds },
            roomId: roomId
        }
    });

    await prisma.image.deleteMany({
        where: {
            id: { in: imageIds },
            roomId: roomId
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

    revalidatePath(`/admin/rooms/${roomId}`);
}

export async function moveRoomImagesToProperty(imageIds: string[], roomId: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Get the propertyId from the room
    const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { propertyId: true }
    });

    if (!room) throw new Error("Room not found");

    // Get images to potentially move files
    const images = await prisma.image.findMany({
        where: {
            id: { in: imageIds },
            roomId: roomId
        }
    });

    // Update images to move them from room to property
    await prisma.image.updateMany({
        where: {
            id: { in: imageIds },
            roomId: roomId
        },
        data: {
            roomId: null,
            propertyId: room.propertyId
        }
    });

    // Move files from room-images to property-images if needed
    const { moveFile } = await import('@/lib/storage');
    const path = await import('path');
    
    for (const image of images) {
        if (image.url.startsWith('/room-images/') || image.url.startsWith('https://')) {
            try {
                const filename = path.basename(image.url);
                
                // Move file using storage abstraction (handles Vercel Blob or local filesystem)
                const newUrl = await moveFile(image.url, 'property-images', filename);
                
                // Update the URL in database
                await prisma.image.update({
                    where: { id: image.id },
                    data: { url: newUrl }
                });
            } catch (error) {
                console.error('Error moving image file:', error);
                // If move fails, try to update URL anyway (file might already be moved or not exist)
                try {
                    const filename = path.basename(image.url);
                    const newUrl = `/property-images/${filename}`;
                    await prisma.image.update({
                        where: { id: image.id },
                        data: { url: newUrl }
                    });
                } catch (updateError) {
                    console.error('Error updating image URL:', updateError);
                }
            }
        }
    }

    revalidatePath(`/admin/rooms/${roomId}`);
    revalidatePath(`/admin/properties/${room.propertyId}`);
}

export async function updateRoomAmenities(roomId: string, amenities: string[]) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    await prisma.room.update({
        where: { id: roomId },
        data: {
            amenities: JSON.stringify(amenities)
        }
    });

    revalidatePath(`/admin/rooms/${roomId}`);
}

export async function toggleShowAirbnbLink(roomId: string, showAirbnbLink: boolean) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    await prisma.room.update({
        where: { id: roomId },
        data: { showAirbnbLink }
    });

    revalidatePath(`/admin/rooms/${roomId}`);
    revalidatePath(`/rooms/${roomId}`);
}

export async function toggleShowCalendar(roomId: string, showCalendar: boolean) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    await prisma.room.update({
        where: { id: roomId },
        data: { showCalendar }
    });

    revalidatePath(`/admin/rooms/${roomId}`);
    revalidatePath(`/rooms/${roomId}`);
}

export async function toggleRoomUnlisted(roomId: string, unlisted: boolean) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const room = await prisma.room.update({
        where: { id: roomId },
        data: { unlisted },
        select: { propertyId: true }
    });

    revalidatePath(`/admin/rooms/${roomId}`);
    revalidatePath(`/admin/properties/${room.propertyId}`);
    revalidatePath(`/properties/${room.propertyId}`);
    revalidatePath('/');
}

export async function deleteRoom(roomId: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { propertyId: true }
    });

    if (!room) throw new Error("Room not found");

    await prisma.room.delete({
        where: { id: roomId }
    });

    revalidatePath(`/admin/properties/${room.propertyId}`);
}

export async function moveRoomUp(roomId: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { propertyId: true, order: true }
    });

    if (!room) throw new Error("Room not found");

    // Find the room with the next lower order value
    const roomAbove = await prisma.room.findFirst({
        where: {
            propertyId: room.propertyId,
            order: { lt: room.order }
        },
        orderBy: { order: 'desc' },
        select: { id: true, order: true }
    });

    if (roomAbove) {
        // Swap orders
        await prisma.$transaction([
            prisma.room.update({
                where: { id: roomId },
                data: { order: roomAbove.order }
            }),
            prisma.room.update({
                where: { id: roomAbove.id },
                data: { order: room.order }
            })
        ]);
    }

    revalidatePath(`/admin/properties/${room.propertyId}`);
}

export async function moveRoomDown(roomId: string) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { propertyId: true, order: true }
    });

    if (!room) throw new Error("Room not found");

    // Find the room with the next higher order value
    const roomBelow = await prisma.room.findFirst({
        where: {
            propertyId: room.propertyId,
            order: { gt: room.order }
        },
        orderBy: { order: 'asc' },
        select: { id: true, order: true }
    });

    if (roomBelow) {
        // Swap orders
        await prisma.$transaction([
            prisma.room.update({
                where: { id: roomId },
                data: { order: roomBelow.order }
            }),
            prisma.room.update({
                where: { id: roomBelow.id },
                data: { order: room.order }
            })
        ]);
    }

    revalidatePath(`/admin/properties/${room.propertyId}`);
}

export async function updateRoomOrders(roomOrders: { roomId: string; order: number }[]) {
    if (!authOptions) throw new Error("Authentication not configured");
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Get the first room to verify propertyId
    const firstRoom = await prisma.room.findUnique({
        where: { id: roomOrders[0]?.roomId },
        select: { propertyId: true }
    });

    if (!firstRoom) throw new Error("Room not found");

    // Update all rooms in a transaction
    await prisma.$transaction(
        roomOrders.map(({ roomId, order }) =>
            prisma.room.update({
                where: { id: roomId },
                data: { order }
            })
        )
    );

    revalidatePath(`/admin/properties/${firstRoom.propertyId}`);
}
