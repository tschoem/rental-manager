import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/app/_components/Header";
import Footer from "@/app/_components/Footer";
import RoomCard from "./_components/RoomCard";
import PhotoGallery from "@/app/rooms/[id]/_components/PhotoGallery";
import PropertyMap from "./_components/PropertyMap";
import PropertyHero from "./_components/PropertyHero";

export const dynamic = 'force-dynamic';

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const property = await prisma.property.findUnique({
        where: { id },
        include: {
            images: true,
            rooms: {
                where: { unlisted: false },
                include: {
                    images: true
                },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!property) notFound();

    // Parse hero image IDs and get their URLs
    let heroImageUrls: string[] = [];
    if (property.heroImageIds) {
        try {
            const heroImageIds = JSON.parse(property.heroImageIds);
            heroImageUrls = property.images
                .filter(img => heroImageIds.includes(img.id))
                .map(img => img.url);
        } catch (e) {
            // If parsing fails, use empty array
            heroImageUrls = [];
        }
    }

    return (
        <div>
            <Header />

            {/* Hero Section with Slideshow */}
            <PropertyHero 
                heroImages={heroImageUrls}
                propertyName={property.name}
                propertyAddress={property.address}
            />

            <main className="container" style={{ padding: '4rem 1rem', maxWidth: '1200px' }}>
                {/* Photo Gallery */}
                {property.images.length > 0 && (
                    <div style={{ marginBottom: '4rem' }}>
                        <PhotoGallery images={property.images.map(img => img.url)} />
                    </div>
                )}

                {property.description && (
                    <div style={{ marginBottom: '3rem' }}>
                        <p style={{ lineHeight: 1.6, fontSize: '1.1rem' }}>{property.description}</p>
                    </div>
                )}

                {/* Google Map */}
                {property.address && (
                    <PropertyMap address={property.address} />
                )}

                <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Available Rooms</h2>
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {property.rooms.map((room: any) => (
                        <RoomCard 
                            key={room.id} 
                            room={room} 
                            propertyImages={property.images.map(img => img.url)}
                        />
                    ))}
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
