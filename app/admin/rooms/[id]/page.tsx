import { prisma } from "@/lib/prisma";
import RoomForm from "../_components/RoomForm";
import UnlistRoomToggle from "../_components/UnlistRoomToggle";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const room = await prisma.room.findUnique({
        where: { id },
        include: {
            property: { select: { id: true, name: true } },
            images: true
        }
    });

    if (!room) notFound();

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href={`/admin/properties/${room.property.id}`} style={{ color: 'var(--muted)' }}>
                    ← Back to {room.property.name}
                </Link>
                <h1 style={{ fontSize: '2rem' }}>Edit Room</h1>
            </div>

                <UnlistRoomToggle roomId={room.id} initialUnlisted={room.unlisted} />

            <RoomForm propertyId={room.propertyId} room={room} />
        </div>
    );
}
