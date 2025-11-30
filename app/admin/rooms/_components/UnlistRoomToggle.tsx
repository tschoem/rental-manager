'use client';

import { useState, useTransition } from 'react';
import { toggleRoomUnlisted } from '@/app/admin/rooms/actions';

interface UnlistRoomToggleProps {
    roomId: string;
    initialUnlisted: boolean;
}

export default function UnlistRoomToggle({ roomId, initialUnlisted }: UnlistRoomToggleProps) {
    // Reverse logic: listed = !unlisted, so we track the listed state
    const [listed, setListed] = useState(!initialUnlisted);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        const newListedState = !listed;
        setListed(newListedState);

        // Convert to unlisted: if listed is false, then unlisted is true
        const newUnlistedState = !newListedState;

        startTransition(async () => {
            await toggleRoomUnlisted(roomId, newUnlistedState);
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
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Listing Status</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                    {listed 
                        ? 'This room is currently listed and visible to the public.'
                        : 'This room is currently unlisted and will not appear in public listings.'}
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
                    background: listed ? 'var(--primary)' : '#ccc',
                    transition: 'background 0.2s',
                    cursor: isPending ? 'wait' : 'pointer',
                    border: 'none'
                }}
            >
                <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: listed ? '26px' : '2px',
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

