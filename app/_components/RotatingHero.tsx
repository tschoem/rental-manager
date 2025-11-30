'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RotatingHeroProps {
    singlePropertyMode: boolean;
    heroImages: string[];
    heroTitle: string;
    heroSubtitle: string;
    heroCtaText: string;
}

export default function RotatingHero({ 
    singlePropertyMode, 
    heroImages: propHeroImages,
    heroTitle,
    heroSubtitle,
    heroCtaText
}: RotatingHeroProps) {
    // Fallback to default images if none provided
    const defaultImages = [
        '/hero_bg.jpg',
        '/dublin_city.png',
        '/newbridge_park.png'
    ];
    
    const heroImages = propHeroImages.length > 0 ? propHeroImages : defaultImages;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
                setIsTransitioning(false);
            }, 500);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <section
            className="hero"
            style={{
                backgroundImage: `url(${heroImages[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                transition: 'opacity 0.5s ease-in-out',
                opacity: isTransitioning ? 0.7 : 1
            }}
        >
            <div className="hero-content">
                <h1>{heroTitle}</h1>
                <p>{heroSubtitle}</p>
                <Link href="#properties" className="btn btn-secondary">
                    {heroCtaText}
                </Link>
            </div>
            
            {/* Image indicators */}
            <div style={{
                position: 'absolute',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 10
            }}>
                {heroImages.map((_, idx) => (
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
        </section>
    );
}

