'use client';

import { useState, useTransition } from 'react';
import { toggleShowAirbnbLink } from '@/app/admin/rooms/actions';

interface ShowAirbnbLinkToggleProps {
    roomId: string;
    initialShowAirbnbLink: boolean;
    airbnbUrl: string | null;
}

export default function ShowAirbnbLinkToggle({ roomId, initialShowAirbnbLink, airbnbUrl }: ShowAirbnbLinkToggleProps) {
    const [showLink, setShowLink] = useState(initialShowAirbnbLink);
    const [isPending, startTransition] = useTransition();

    // Don't show toggle if there's no Airbnb URL
    if (!airbnbUrl) {
        return null;
    }

    const handleToggle = () => {
        const newState = !showLink;
        setShowLink(newState);

        startTransition(async () => {
            await toggleShowAirbnbLink(roomId, newState);
        });
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            marginBottom: '1.5rem'
        }}>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Show Airbnb Link</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                    {showLink 
                        ? 'The Airbnb link is visible on the public room page.'
                        : 'The Airbnb link is hidden from the public room page.'}
                </p>
            </div>

            <button
                onClick={handleToggle}
                disabled={isPending}
                style={{
                    position: 'relative',
                    width: '48px',
                    height: '24px',
                    borderRadius: '9999px',
                    background: showLink ? 'var(--primary)' : '#ccc',
                    transition: 'background 0.2s',
                    cursor: isPending ? 'wait' : 'pointer',
                    border: 'none'
                }}
            >
                <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: showLink ? '26px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }} />
            </button>
        </div>
    );
}

