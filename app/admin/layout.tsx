import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import SignOutButton from "./_components/SignOutButton";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await requireAuth("/admin");
    
    if (!session) {
        // This shouldn't happen as requireAuth redirects, but TypeScript needs this
        return null;
    }

    return (
        <div className="admin-layout">
            <nav className="admin-nav">
                <div style={{ marginBottom: '2rem', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    Rental Manager
                </div>
                <Link href="/admin">Dashboard</Link>
                <Link href="/admin/properties">Properties</Link>
                <Link href="/admin/home">Home Page</Link>
                <Link href="/admin/location">Location Page</Link>
                <Link href="/admin/about">About Page</Link>
                <Link href="/admin/settings">Site Settings</Link>
                <Link href="/" target="_blank">View Site ↗</Link>

                <div className="user-info">
                    <p>Signed in as:</p>
                    <p style={{ fontWeight: 500 }}>{session.user?.email}</p>
                    <SignOutButton />
                </div>
            </nav>
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}
