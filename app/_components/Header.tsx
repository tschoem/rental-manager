import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Header() {
    const settings = await prisma.siteSettings.findFirst();
    const singlePropertyMode = settings?.singlePropertyMode ?? false;
    const aboutSettings = await prisma.aboutPageSettings.findFirst();
    const showAboutPage = aboutSettings?.showAboutPage ?? false;

    // Get the first property ID if in single property mode
    let propertyId: string | null = null;
    if (singlePropertyMode) {
        const firstProperty = await prisma.property.findFirst({
            orderBy: { createdAt: 'asc' },
            select: { id: true }
        });
        propertyId = firstProperty?.id ?? null;
    }

    return (
        <header className="site-header">
            <div className="container header-content">
                <Link href="/" className="site-logo">
                    {settings?.siteIcon && <span style={{ marginRight: '0.5rem' }}>{settings.siteIcon}</span>}
                    {settings?.siteName || "Rental Manager"}
                </Link>
                <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <Link href="/" style={{ fontWeight: 500 }}>
                        Home
                    </Link>
                    {singlePropertyMode && propertyId ? (
                        <Link href={`/properties/${propertyId}`} style={{ fontWeight: 500 }}>
                            Rooms
                        </Link>
                    ) : (
                        <Link href="/#properties" style={{ fontWeight: 500 }}>
                            Properties
                        </Link>
                    )}
                    <Link href="/location" style={{ fontWeight: 500 }}>
                        Location
                    </Link>
                    {showAboutPage && (
                        <Link href="/about" style={{ fontWeight: 500 }}>
                            About
                        </Link>
                    )}
                    <Link 
                        href="/admin" 
                        className="owner-login-link"
                        style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--text-muted)', 
                            opacity: 0.7,
                            textDecoration: 'none',
                            transition: 'opacity 0.2s ease'
                        }}
                    >
                        Owner Login
                    </Link>
                </nav>
            </div>
        </header>
    );
}
