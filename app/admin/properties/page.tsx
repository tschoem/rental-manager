import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SinglePropertyToggle from "./_components/SinglePropertyToggle";

export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
    const properties = await prisma.property.findMany({
        include: {
            _count: {
                select: { rooms: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const settings = await prisma.siteSettings.findFirst();

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Properties</h1>
                <Link href="/admin/properties/new" className="btn btn-primary">
                    Add Property
                </Link>
            </div>

            <SinglePropertyToggle initialEnabled={settings?.singlePropertyMode ?? false} />

            <div style={{ display: 'grid', gap: '1rem' }}>
                {properties.map((property) => (
                    <div key={property.id} style={{
                        padding: '1.5rem',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{property.name}</h3>
                            <p style={{ color: 'var(--muted)' }}>{property.address}</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                {property._count.rooms} Rooms
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link href={`/admin/properties/${property.id}`} className="btn btn-outline">
                                Manage
                            </Link>
                        </div>
                    </div>
                ))}

                {properties.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                        <p>No properties found. Create your first one!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
