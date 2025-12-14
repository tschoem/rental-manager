'use client';

interface AmenitiesDisplayProps {
  amenities: string[];
}

export default function AmenitiesDisplay({ amenities }: AmenitiesDisplayProps) {
  if (amenities.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '1rem'
    }}>
      {amenities.map((amenity, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            borderRadius: 'var(--card-radius, 12px)',
            background: 'var(--surface)',
            transition: 'background 0.2s ease'
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.875rem',
            flexShrink: 0
          }}>
            ✓
          </div>
          <span style={{ fontSize: '1rem', color: 'var(--foreground)' }}>
            {amenity}
          </span>
        </div>
      ))}
    </div>
  );
}

