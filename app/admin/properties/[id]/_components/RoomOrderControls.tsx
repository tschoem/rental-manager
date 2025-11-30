'use client';

import { useTransition } from 'react';
import { moveRoomUp, moveRoomDown } from '@/app/admin/rooms/actions';

interface RoomOrderControlsProps {
    roomId: string;
    isFirst: boolean;
    isLast: boolean;
}

export default function RoomOrderControls({ roomId, isFirst, isLast }: RoomOrderControlsProps) {
    const [isPending, startTransition] = useTransition();

    const handleMoveUp = () => {
        if (isFirst) return;
        startTransition(async () => {
            await moveRoomUp(roomId);
        });
    };

    const handleMoveDown = () => {
        if (isLast) return;
        startTransition(async () => {
            await moveRoomDown(roomId);
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <button
                onClick={handleMoveUp}
                disabled={isFirst || isPending}
                style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    background: isFirst ? '#f0f0f0' : 'white',
                    cursor: isFirst || isPending ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    opacity: isFirst ? 0.5 : 1
                }}
                title="Move up"
            >
                ↑
            </button>
            <button
                onClick={handleMoveDown}
                disabled={isLast || isPending}
                style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    background: isLast ? '#f0f0f0' : 'white',
                    cursor: isLast || isPending ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    opacity: isLast ? 0.5 : 1
                }}
                title="Move down"
            >
                ↓
            </button>
        </div>
    );
}

