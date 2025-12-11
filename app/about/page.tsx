import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/app/_components/Header";
import Footer from "@/app/_components/Footer";
import styles from "./about.module.css";

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

            <main className={`container ${styles.main}`}>
                <h1 className={styles.title}>About Us</h1>
                <p className={styles.subtitle}>
                    Meet the people behind your perfect stay
                </p>

                {owners.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No owners information available yet.</p>
                    </div>
                ) : (
                    <div className={styles.ownersGrid}>
                        {owners.map((owner) => (
                            <div
                                key={owner.id}
                                className={styles.ownerCard}
                            >
                                {/* Profile Image */}
                                <div className={styles.profileImageContainer}>
                                    {owner.profileImage ? (
                                        <img
                                            src={owner.profileImage}
                                            alt={owner.name}
                                            className={styles.profileImage}
                                        />
                                    ) : (
                                        <div className={styles.profileImagePlaceholder}>
                                            {owner.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Owner Info */}
                                <div className={styles.ownerInfo}>
                                    <h2 className={styles.ownerName}>{owner.name}</h2>
                                    
                                    {owner.bio && (
                                        <p className={styles.ownerBio}>
                                            {owner.bio}
                                        </p>
                                    )}

                                    {/* Social Media Links */}
                                    {(owner.facebookUrl || owner.instagramUrl || owner.twitterUrl || owner.linkedinUrl || owner.airbnbUrl || owner.websiteUrl) && (
                                        <div className={styles.socialLinks}>
                                            {owner.facebookUrl && (
                                                <a
                                                    href={owner.facebookUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.socialButton}
                                                    style={{ background: '#1877F2' }}
                                                >
                                                    Facebook
                                                </a>
                                            )}
                                            {owner.instagramUrl && (
                                                <a
                                                    href={owner.instagramUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.socialButton}
                                                    style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}
                                                >
                                                    Instagram
                                                </a>
                                            )}
                                            {owner.twitterUrl && (
                                                <a
                                                    href={owner.twitterUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.socialButton}
                                                    style={{ background: '#1DA1F2' }}
                                                >
                                                    Twitter
                                                </a>
                                            )}
                                            {owner.linkedinUrl && (
                                                <a
                                                    href={owner.linkedinUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.socialButton}
                                                    style={{ background: '#0077B5' }}
                                                >
                                                    LinkedIn
                                                </a>
                                            )}
                                            {owner.airbnbUrl && (
                                                <a
                                                    href={owner.airbnbUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.socialButton}
                                                    style={{ background: '#FF5A5F' }}
                                                >
                                                    Airbnb
                                                </a>
                                            )}
                                            {owner.websiteUrl && (
                                                <a
                                                    href={owner.websiteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.socialButton}
                                                    style={{ background: 'var(--primary)' }}
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

