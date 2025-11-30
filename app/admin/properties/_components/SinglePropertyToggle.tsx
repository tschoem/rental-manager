'use client';

import { useState, useTransition } from 'react';
import { toggleSinglePropertyMode } from '@/app/admin/actions';

interface SinglePropertyToggleProps {
    initialEnabled: boolean;
}

export default function SinglePropertyToggle({ initialEnabled }: SinglePropertyToggleProps) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        const newState = !enabled;
        setEnabled(newState);

        startTransition(async () => {
            await toggleSinglePropertyMode(newState);
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
            marginBottom: '2rem'
        }}>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Single Property Mode</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                    When enabled, the home page will display rooms directly instead of listing properties.
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
                    cursor: isPending ? 'wait' : 'pointer'
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
