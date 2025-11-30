import { prisma } from "@/lib/prisma";
import PropertyForm from "../_components/PropertyForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import SortableRoomsList from "./_components/SortableRoomsList";
import PropertyImages from "./_components/PropertyImages";

export default async function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const property = await prisma.property.findUnique({
        where: { id },
        include: { 
            images: true,
            rooms: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!property) notFound();

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/admin/properties" style={{ color: 'var(--muted)' }}>← Back</Link>
                <h1 style={{ fontSize: '2rem' }}>Edit Property</h1>
            </div>

            <PropertyForm property={property} />

            {/* Property Photos */}
            <div style={{ marginTop: '4rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                <PropertyImages propertyId={property.id} images={property.images} />
            </div>

            <div style={{ marginTop: '4rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>Rooms</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/admin/properties/${property.id}/import`} className="btn btn-outline">
                            Import from Airbnb
                        </Link>
                        <Link href={`/admin/properties/${property.id}/rooms/new`} className="btn btn-primary">
                            Add Room
                        </Link>
                    </div>
                </div>

                {property.rooms.length === 0 ? (
                    <p style={{ color: 'var(--muted)' }}>No rooms added yet.</p>
                ) : (
                    <SortableRoomsList rooms={property.rooms} propertyId={property.id} />
                )}
            </div>
        </div>
    );
}
