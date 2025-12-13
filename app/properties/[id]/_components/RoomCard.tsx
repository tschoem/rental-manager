'use client'

import { useState } from "react";
import Link from "next/link";
import { requestBooking } from "@/app/actions";

interface RoomWithImages {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    capacity: number | null;
    amenities: string | null;
    images: { url: string }[];
}

interface RoomCardProps {
    room: RoomWithImages;
    propertyImages?: string[];
}

export default function RoomCard({ room, propertyImages = [] }: RoomCardProps) {
    const [showForm, setShowForm] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const amenitiesList = room.amenities ? JSON.parse(room.amenities) : [];
    // Prioritize room images, fallback to property images if room has no images
    const images = room.images.length > 0 
        ? room.images 
        : (propertyImages.length > 0 ? propertyImages.map(url => ({ url })) : []);

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: '0', overflow: 'hidden', background: 'white' }}>
            {/* Image Gallery */}
            <div style={{ height: '400px', background: 'var(--surface)', position: 'relative' }}>
                {images.length > 0 ? (
                    <>
                        <img
                            src={images[currentImageIndex].url}
                            alt={room.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.5rem' }}
                                >
                                    ‹
                                </button>
                                <button
                                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.5rem' }}
                                >
                                    ›
                                </button>
                                <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem' }}>
                                    {images.map((_, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: idx === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>No Image</div>
                )}
            </div>

            <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{room.name}</h3>
                        {room.capacity && <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Up to {room.capacity} guests</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {room.price && <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>€{room.price} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--muted)' }}>/ night</span></p>}
                    </div>
                </div>

                <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{room.description}</p>

                {/* Amenities */}
                {amenitiesList.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Amenities</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                            {amenitiesList.slice(0, 8).map((amenity: string, idx: number) => (
                                <div key={idx} style={{ fontSize: '0.875rem', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: 'var(--primary)' }}>✓</span>
                                    {amenity}
                                </div>
                            ))}
                        </div>
                        {amenitiesList.length > 8 && (
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                                +{amenitiesList.length - 8} more amenities
                            </p>
                        )}
                    </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <Link href={`/rooms/${room.id}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                        View Details
                    </Link>
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-outline">
                        {showForm ? 'Cancel' : 'Quick Book'}
                    </button>
                </div>

                {showForm && (
                    <form action={async (formData) => {
                        await requestBooking(formData);
                        alert("Request sent! We will contact you shortly.");
                        setShowForm(false);
                    }} style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: '8px' }}>
                        <input type="hidden" name="roomId" value={room.id} />

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
                                <input type="text" name="name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                                <input type="email" name="email" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Check-in</label>
                                    <input type="date" name="startDate" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Check-out</label>
                                    <input type="date" name="endDate" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Message (Optional)</label>
                                <textarea
                                    name="message"
                                    rows={3}
                                    placeholder="Any special requests or questions?"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border)',
                                        fontFamily: 'inherit',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Send Request</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
