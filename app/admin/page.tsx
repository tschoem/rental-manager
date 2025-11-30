import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
    const propertyCount = await prisma.property.count();
    const roomCount = await prisma.room.count();
    const bookingCount = await prisma.booking.count();

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                    <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Properties</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{propertyCount}</p>
                </div>

                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                    <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Rooms</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{roomCount}</p>
                </div>

                <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                    <h3 style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Bookings</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{bookingCount}</p>
                </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/admin/properties/new" className="btn btn-primary">
                        Add Property
                    </Link>
                </div>
            </div>
        </div>
    );
}
