'use client';

import { useState, useTransition } from 'react';
import { toggleShowAboutPage } from '../actions';

interface AboutPageToggleProps {
    initialEnabled: boolean;
}

export default function AboutPageToggle({ initialEnabled }: AboutPageToggleProps) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        const newState = !enabled;
        setEnabled(newState);

        startTransition(async () => {
            await toggleShowAboutPage(newState);
        });
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.5rem',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            marginBottom: '2rem'
        }}>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Show About Page</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                    {enabled
                        ? 'The About page is currently visible to the public.'
                        : 'The About page is currently hidden from the public.'}
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
                    background: enabled ? 'var(--primary)' : '#ccc',
                    transition: 'background 0.2s',
                    cursor: isPending ? 'wait' : 'pointer',
                    border: 'none'
                }}
            >
                <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: enabled ? '26px' : '2px',
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

