'use client';

import { useState, useTransition } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import DeleteRoomButton from './DeleteRoomButton';
import DragHandle from './DragHandle';
import { updateRoomOrders } from '@/app/admin/rooms/actions';

interface Room {
    id: string;
    name: string;
    price: number | null;
}

interface SortableRoomsListProps {
    rooms: Room[];
    propertyId: string;
}

function SortableRoomItem({ room }: { room: Room }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: room.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: isDragging ? '#f9f9f9' : 'white',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                    {...attributes}
                    {...listeners}
                    suppressHydrationWarning
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <DragHandle />
                </div>
                <div>
                    <h4 style={{ fontWeight: 600 }}>{room.name}</h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                        {room.price ? `€${room.price}/night` : 'No price set'}
                    </p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href={`/admin/rooms/${room.id}`} className="btn btn-outline" style={{ padding: '0.5rem' }}>
                    Edit
                </Link>
                <DeleteRoomButton roomId={room.id} roomName={room.name} />
            </div>
        </div>
    );
}

export default function SortableRoomsList({ rooms, propertyId }: SortableRoomsListProps) {
    const [items, setItems] = useState(rooms);
    const [isPending, startTransition] = useTransition();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Calculate new order before state update
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            const newItems = arrayMove(items, oldIndex, newIndex);

            // Update state
            setItems(newItems);

            // Update orders in the database
            const roomOrders = newItems.map((room, index) => ({
                roomId: room.id,
                order: index,
            }));

            startTransition(async () => {
                await updateRoomOrders(roomOrders);
            });
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={items.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {items.map((room) => (
                        <SortableRoomItem key={room.id} room={room} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

