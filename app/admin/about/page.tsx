import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import AboutPageToggle from "./_components/AboutPageToggle";
import OwnersList from "./_components/OwnersList";

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
    await requireAuth("/admin/about");

    const settings = await prisma.aboutPageSettings.findFirst();
    const owners = await prisma.owner.findMany({
        include: {
            images: true
        },
        orderBy: { order: 'asc' }
    });

    return (
        <div className="admin-content">
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin" style={{ color: 'var(--muted)' }}>← Back to Dashboard</Link>
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>About Page Management</h1>

            {/* Toggle to show/hide About page */}
            <AboutPageToggle initialEnabled={settings?.showAboutPage ?? false} />

            {/* Owners List */}
            <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>Owners</h2>
                    <Link href="/admin/about/owners/new" className="btn btn-primary">
                        Add Owner
                    </Link>
                </div>
                <OwnersList owners={owners} />
            </div>
        </div>
    );
}

