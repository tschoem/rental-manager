import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/app/_components/Header";
import Footer from "@/app/_components/Footer";
import PhotoGallery from "./_components/PhotoGallery";
import AmenitiesDisplay from "./_components/AmenitiesDisplay";
import BookingSection from "./_components/BookingSection";
import Breadcrumbs from "./_components/Breadcrumbs";

export const dynamic = 'force-dynamic';

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const room = await prisma.room.findUnique({
        where: { id },
        include: {
            images: true,
            property: {
                include: {
                    images: true
                }
            }
        }
    });

    if (!room || room.unlisted) notFound();

    const amenitiesList = room.amenities ? JSON.parse(room.amenities) : [];

    return (
        <div>
            <Header />

            <main className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px' }}>
                {/* Breadcrumbs */}
                <Breadcrumbs
                    items={[
                        { label: 'Home', href: '/' },
                        { label: room.property.name, href: `/properties/${room.property.id}` },
                        { label: room.name, href: `/rooms/${room.id}` }
                    ]}
                />

                {/* Room Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{room.name}</h1>
                    {room.property.address && (
                        <p style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                            {room.property.address}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {room.price && (
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                €{room.price} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--muted)' }}>/ night</span>
                            </p>
                        )}
                        {room.capacity && (
                            <p style={{ color: 'var(--muted)' }}>
                                Up to {room.capacity} guests
                            </p>
                        )}
                        {room.airbnbUrl && room.showAirbnbLink && (
                            <a
                                href={room.airbnbUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="airbnb-link-button"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    background: '#FF5A5F',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(255, 90, 95, 0.2)'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                                </svg>
                                View on Airbnb
                            </a>
                        )}
                    </div>
                </div>

                {/* Photo Gallery - Prioritize room images, fallback to property images */}
                {(room.images.length > 0 || room.property.images.length > 0) && (
                    <div style={{ marginBottom: '4rem' }}>
                        <PhotoGallery 
                            images={
                                room.images.length > 0 
                                    ? room.images.map(img => img.url)
                                    : room.property.images.map(img => img.url)
                            } 
                        />
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '4rem',
                    marginBottom: '4rem'
                }}
                className="room-detail-grid"
                >
                    {/* Left Column - Main Content */}
                    <div>
                        {/* Description */}
                        {room.description && (
                            <div style={{ marginBottom: '3rem' }}>
                                <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>About this room</h2>
                                <p style={{ lineHeight: 1.8, fontSize: '1.1rem', color: 'var(--foreground)' }}>
                                    {room.description}
                                </p>
                            </div>
                        )}

                        {/* Amenities */}
                        {amenitiesList.length > 0 && (
                            <div style={{ marginBottom: '3rem' }}>
                                <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Amenities</h2>
                                <AmenitiesDisplay amenities={amenitiesList} />
                            </div>
                        )}
                    </div>

                    {/* Right Column - Booking Card */}
                    <div style={{ position: 'sticky', top: '2rem', alignSelf: 'start' }}>
                        <div style={{
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '2rem',
                            background: 'white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 600 }}>Book this room</h2>
                            <BookingSection 
                                roomId={room.id} 
                                roomPrice={room.price} 
                                showCalendar={room.showCalendar} 
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}

