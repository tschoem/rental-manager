'use client';

import { useState, useEffect } from 'react';

interface CalendarViewProps {
    roomId: string;
    onDateClick?: (date: Date) => void;
}

export default function CalendarView({ roomId, onDateClick }: CalendarViewProps) {
    const [blockedDates, setBlockedDates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        async function fetchBlockedDates() {
            try {
                const response = await fetch(`/api/rooms/${roomId}/availability`);
                const data = await response.json();
                setBlockedDates(data);
            } catch (error) {
                console.error('Failed to fetch availability:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchBlockedDates();
    }, [roomId]);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const formatDate = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    const isBlocked = (day: number): boolean => {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        return blockedDates.includes(dateStr);
    };

    const isPast = (day: number): boolean => {
        const date = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const navigateMonth = (direction: number) => {
        setCurrentMonth(new Date(year, month + direction, 1));
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                Loading calendar...
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Availability</h4>
            
            {/* Calendar Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
            }}>
                <button
                    onClick={() => navigateMonth(-1)}
                    style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        color: 'var(--foreground)',
                        fontWeight: 600
                    }}
                >
                    ‹
                </button>
                <h5 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                    {monthNames[month]} {year}
                </h5>
                <button
                    onClick={() => navigateMonth(1)}
                    style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        color: 'var(--foreground)',
                        fontWeight: 600
                    }}
                >
                    ›
                </button>
            </div>

            {/* Calendar Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.125rem'
            }}>
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div
                        key={day}
                        style={{
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#374151',
                            padding: '0.5rem 0.25rem'
                        }}
                    >
                        {day}
                    </div>
                ))}

                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
                    <div key={`empty-${idx}`} />
                ))}

                {/* Calendar Days */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const blocked = isBlocked(day);
                    const past = isPast(day);
                    const date = new Date(year, month, day);
                    const isAvailable = !past && !blocked;

                    const handleClick = () => {
                        if (isAvailable && onDateClick) {
                            onDateClick(date);
                        }
                    };

                    return (
                        <div
                            key={day}
                            onClick={handleClick}
                            style={{
                                minHeight: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                fontSize: '0.9375rem',
                                fontWeight: 600,
                                padding: '0.5rem',
                                background: past
                                    ? '#f3f4f6'
                                    : blocked
                                        ? '#fee2e2'
                                        : '#dcfce7',
                                color: past
                                    ? '#6b7280'
                                    : blocked
                                        ? '#991b1b'
                                        : '#166534',
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                opacity: past ? 0.7 : 1,
                                transition: 'transform 0.1s ease, background 0.1s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (isAvailable) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.background = '#bbf7d0';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = past
                                    ? '#f3f4f6'
                                    : blocked
                                        ? '#fee2e2'
                                        : '#dcfce7';
                            }}
                            title={blocked ? 'Unavailable' : past ? 'Past date' : 'Click to select date'}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem',
                fontSize: '0.875rem',
                color: '#374151',
                fontWeight: 500,
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: '#dcfce7',
                        flexShrink: 0
                    }} />
                    <span>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: '#fee2e2',
                        flexShrink: 0
                    }} />
                    <span>Unavailable</span>
                </div>
            </div>
        </div>
    );
}

