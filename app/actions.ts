'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendBookingNotificationEmail } from "@/lib/email";

export async function requestBooking(formData: FormData) {
    const roomId = formData.get("roomId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const message = formData.get("message") as string | null;

    // Get room and property details for email
    const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
            property: true
        }
    });

    if (!room) {
        throw new Error("Room not found");
    }

    // Create booking
    await prisma.booking.create({
        data: {
            roomId,
            guestName: name,
            guestEmail: email,
            startDate,
            endDate,
            message: message || null,
            status: "PENDING",
            source: "DIRECT"
        }
    });

    // Send email notification to admin
    await sendBookingNotificationEmail({
        guestName: name,
        guestEmail: email,
        roomName: room.name,
        propertyName: room.property.name,
        propertyAddress: room.property.address,
        startDate,
        endDate,
        message: message || null,
        price: room.price,
        propertyId: room.property.id // Pass property ID to fetch admin email
    });

    revalidatePath(`/properties`); // Revalidate broadly or specific path
}
