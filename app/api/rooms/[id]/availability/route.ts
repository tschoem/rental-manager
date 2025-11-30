import { prisma } from "@/lib/prisma";
import { getBlockedDates } from "@/lib/ical";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const room = await prisma.room.findUnique({
        where: { id }
    });

    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    let blockedDates: Date[] = [];

    // 1. Get from iCal
    if (room.iCalUrl) {
        const icalDates = await getBlockedDates(room.iCalUrl);
        blockedDates = [...blockedDates, ...icalDates];
    }

    // 2. Get from local bookings
    const bookings = await prisma.booking.findMany({
        where: {
            roomId: room.id,
            status: "CONFIRMED",
            endDate: { gte: new Date() }
        }
    });

    for (const booking of bookings) {
        let current = new Date(booking.startDate);
        while (current < booking.endDate) {
            blockedDates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
    }

    // Deduplicate dates
    const uniqueDates = Array.from(new Set(blockedDates.map(d => d.toISOString().split('T')[0])));

    return NextResponse.json(uniqueDates);
}
