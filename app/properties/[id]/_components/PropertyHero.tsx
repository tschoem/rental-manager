'use client';

import { useState, useEffect } from 'react';

interface PropertyHeroProps {
    heroImages: string[];
    propertyName: string;
    propertyAddress?: string | null;
}

export default function PropertyHero({ 
    heroImages,
    propertyName,
    propertyAddress
}: PropertyHeroProps) {
    // Fallback to default image if none provided
    const images = heroImages.length > 0 ? heroImages : ['/hero_bg.jpg'];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // Only set up auto-rotation if there's more than one image
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentImageIndex((prev) => (prev + 1) % images.length);
                setIsTransitioning(false);
            }, 500);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <section
            className="hero"
            style={{
                backgroundImage: `url(${images[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                transition: 'opacity 0.5s ease-in-out',
                opacity: isTransitioning ? 0.7 : 1
            }}
        >
            <div className="hero-content">
                <h1>{propertyName}</h1>
                {propertyAddress && (
                    <p>{propertyAddress}</p>
                )}
            </div>
            
            {/* Image indicators - only show if more than one image */}
            {images.length > 1 && (
                <div style={{
                    position: 'absolute',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '0.5rem',
                    zIndex: 10
                }}>
                    {images.map((_, idx) => (
                        <div
                            key={idx}
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: idx === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                transition: 'background 0.3s ease'
                            }}
                            onClick={() => {
                                setIsTransitioning(true);
                                setTimeout(() => {
                                    setCurrentImageIndex(idx);
                                    setIsTransitioning(false);
                                }, 300);
                            }}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

