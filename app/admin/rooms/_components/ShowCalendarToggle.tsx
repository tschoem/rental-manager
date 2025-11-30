'use client';

import { useState, useTransition } from 'react';
import { toggleShowCalendar } from '@/app/admin/rooms/actions';

interface ShowCalendarToggleProps {
    roomId: string;
    initialShowCalendar: boolean;
}

export default function ShowCalendarToggle({ roomId, initialShowCalendar }: ShowCalendarToggleProps) {
    const [showCalendar, setShowCalendar] = useState(initialShowCalendar);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        const newState = !showCalendar;
        setShowCalendar(newState);

        startTransition(async () => {
            await toggleShowCalendar(roomId, newState);
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
            marginBottom: '1rem'
        }}>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Show Calendar</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                    {showCalendar 
                        ? 'The calendar is displayed on the public room page.'
                        : 'The calendar is hidden from the public room page.'}
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
                    background: showCalendar ? 'var(--primary)' : '#ccc',
                    transition: 'background 0.2s',
                    cursor: isPending ? 'wait' : 'pointer',
                    border: 'none'
                }}
            >
                <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: showCalendar ? '26px' : '2px',
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

