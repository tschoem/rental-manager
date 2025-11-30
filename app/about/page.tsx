import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/app/_components/Header";
import Footer from "@/app/_components/Footer";

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
    const settings = await prisma.aboutPageSettings.findFirst();
    
    if (!settings || !settings.showAboutPage) {
        notFound();
    }

    const owners = await prisma.owner.findMany({
        include: {
            images: true
        },
        orderBy: { order: 'asc' }
    });

    return (
        <div>
            <Header />

            <main className="container" style={{ padding: '4rem 1rem', maxWidth: '1200px' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>About Us</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--muted)', textAlign: 'center', marginBottom: '4rem' }}>
                    Meet the people behind your perfect stay
                </p>

                {owners.length === 0 ? (
                    <div style={{
                        padding: '3rem',
                        textAlign: 'center',
                        background: 'var(--surface)',
                        borderRadius: '12px',
                        color: 'var(--muted)'
                    }}>
                        <p>No owners information available yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '3rem' }}>
                        {owners.map((owner) => (
                            <div
                                key={owner.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr',
                                    gap: '2rem',
                                    padding: '2rem',
                                    background: 'white',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                                className="owner-card"
                            >
                                {/* Profile Image */}
                                <div>
                                    {owner.profileImage ? (
                                        <img
                                            src={owner.profileImage}
                                            alt={owner.name}
                                            style={{
                                                width: '200px',
                                                height: '200px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '3px solid var(--primary)'
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '200px',
                                                height: '200px',
                                                borderRadius: '50%',
                                                background: 'var(--surface)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--muted)',
                                                fontSize: '4rem',
                                                fontWeight: 'bold',
                                                border: '3px solid var(--border)'
                                            }}
                                        >
                                            {owner.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Owner Info */}
                                <div>
                                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{owner.name}</h2>
                                    
                                    {owner.bio && (
                                        <p style={{
                                            fontSize: '1.1rem',
                                            lineHeight: 1.8,
                                            color: 'var(--foreground)',
                                            marginBottom: '1.5rem'
                                        }}>
                                            {owner.bio}
                                        </p>
                                    )}

                                    {/* Social Media Links */}
                                    {(owner.facebookUrl || owner.instagramUrl || owner.twitterUrl || owner.linkedinUrl || owner.airbnbUrl || owner.websiteUrl) && (
                                        <div style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            flexWrap: 'wrap',
                                            marginTop: '1.5rem'
                                        }}>
                                            {owner.facebookUrl && (
                                                <a
                                                    href={owner.facebookUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#1877F2',
                                                        color: 'white',
                                                        borderRadius: '6px',
                                                        textDecoration: 'none',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Facebook
                                                </a>
                                            )}
                                            {owner.instagramUrl && (
                                                <a
                                                    href={owner.instagramUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                                                        color: 'white',
                                                        borderRadius: '6px',
                                                        textDecoration: 'none',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Instagram
                                                </a>
                                            )}
                                            {owner.twitterUrl && (
                                                <a
                                                    href={owner.twitterUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#1DA1F2',
                                                        color: 'white',
                                                        borderRadius: '6px',
                                                        textDecoration: 'none',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Twitter
                                                </a>
                                            )}
                                            {owner.linkedinUrl && (
                                                <a
                                                    href={owner.linkedinUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#0077B5',
                                                        color: 'white',
                                                        borderRadius: '6px',
                                                        textDecoration: 'none',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    LinkedIn
                                                </a>
                                            )}
                                            {owner.airbnbUrl && (
                                                <a
                                                    href={owner.airbnbUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: '#FF5A5F',
                                                        color: 'white',
                                                        borderRadius: '6px',
                                                        textDecoration: 'none',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Airbnb
                                                </a>
                                            )}
                                            {owner.websiteUrl && (
                                                <a
                                                    href={owner.websiteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: 'var(--primary)',
                                                        color: 'white',
                                                        borderRadius: '6px',
                                                        textDecoration: 'none',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Website
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

