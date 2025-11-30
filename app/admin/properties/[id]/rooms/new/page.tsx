import { prisma } from "@/lib/prisma";
import RoomForm from "@/app/admin/rooms/_components/RoomForm";
import Link from "next/link";

export default async function NewRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const property = await prisma.property.findUnique({
        where: { id },
        select: { id: true, name: true }
    });

    if (!property) {
        return <div>Property not found</div>;
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href={`/admin/properties/${property.id}`} style={{ color: 'var(--muted)' }}>
                    ← Back to {property.name}
                </Link>
                <h1 style={{ fontSize: '2rem' }}>Add New Room</h1>
            </div>

            <RoomForm propertyId={property.id} />
        </div>
    );
}
