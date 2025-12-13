'use client';

interface PropertyMapProps {
    address: string;
}

export default function PropertyMap({ address }: PropertyMapProps) {
    if (!address) return null;

    // Encode the address for Google Maps embed URL
    const encodedAddress = encodeURIComponent(address);
    // Set zoom level to 12 (more zoomed out - city/area level)
    // Default is typically around 15, so 12 is about 3 levels lower (more zoomed out)
    const zoomLevel = 12;

    return (
        <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>Location</h2>
            <div style={{
                width: '100%',
                height: '450px',
                borderRadius: '0',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid var(--border)'
            }}>
                <iframe
                    src={`https://www.google.com/maps?q=${encodedAddress}&z=${zoomLevel}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
            <p style={{ 
                marginTop: '1rem', 
                color: 'var(--muted)', 
                fontSize: '0.875rem',
                textAlign: 'center'
            }}>
                <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)', textDecoration: 'none' }}
                >
                    View on Google Maps
                </a>
            </p>
        </div>
    );
}

