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
import { useRouter } from 'next/navigation';
import { updateOwnerOrder } from '../actions';
import DragHandle from '@/app/admin/properties/[id]/_components/DragHandle';

interface OwnerImage {
    id: string;
    url: string;
    isProfile: boolean;
}

interface Owner {
    id: string;
    name: string;
    bio: string | null;
    profileImage: string | null;
    order: number;
    facebookUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
    airbnbUrl: string | null;
    websiteUrl: string | null;
    images: OwnerImage[];
}

interface SortableOwnersListProps {
    owners: Owner[];
}

function SortableOwnerItem({ owner, onDelete, isDeleting }: { owner: Owner; onDelete: (id: string, name: string) => void; isDeleting: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: owner.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDelete = () => {
        onDelete(owner.id, owner.name);
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                padding: '1.5rem',
                background: isDragging ? '#f9f9f9' : 'white',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                display: 'flex',
                gap: '1.5rem',
            }}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                suppressHydrationWarning
                style={{ cursor: isDragging ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center' }}
            >
                <DragHandle />
            </div>

            {/* Profile Image */}
            <div>
                {owner.profileImage ? (
                    <img
                        src={owner.profileImage}
                        alt={owner.name}
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--border)'
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'var(--surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--muted)',
                            fontSize: '2rem'
                        }}
                    >
                        {owner.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Owner Info */}
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{owner.name}</h3>
                {owner.bio && (
                    <p style={{ color: 'var(--muted)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                        {owner.bio.substring(0, 150)}{owner.bio.length > 150 ? '...' : ''}
                    </p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {owner.facebookUrl && (
                        <a href={owner.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                            Facebook
                        </a>
                    )}
                    {owner.instagramUrl && (
                        <a href={owner.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                            Instagram
                        </a>
                    )}
                    {owner.twitterUrl && (
                        <a href={owner.twitterUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                            Twitter
                        </a>
                    )}
                    {owner.linkedinUrl && (
                        <a href={owner.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                            LinkedIn
                        </a>
                    )}
                    {owner.airbnbUrl && (
                        <a href={owner.airbnbUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                            Airbnb
                        </a>
                    )}
                    {owner.websiteUrl && (
                        <a href={owner.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                            Website
                        </a>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link href={`/admin/about/owners/${owner.id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                    Edit
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="btn btn-destructive"
                    style={{ padding: '0.5rem 1rem' }}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    );
}

export default function SortableOwnersList({ owners }: SortableOwnersListProps) {
    const router = useRouter();
    const [items, setItems] = useState(owners);
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

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
            const ownerOrders = newItems.map((owner, index) => ({
                ownerId: owner.id,
                order: index,
            }));

            startTransition(async () => {
                await updateOwnerOrder(ownerOrders);
            });
        }
    };

    const handleDelete = async (ownerId: string, ownerName: string) => {
        setDeletingId(ownerId);
        try {
            const { deleteOwner } = await import('../actions');
            await deleteOwner(ownerId);
            router.refresh();
        } catch (error) {
            alert('Failed to delete owner');
        } finally {
            setDeletingId(null);
        }
    };

    if (items.length === 0) {
        return (
            <div style={{
                padding: '3rem',
                textAlign: 'center',
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--muted)'
            }}>
                <p>No owners added yet. Click "Add Owner" to get started.</p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={items.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {items.map((owner) => (
                        <SortableOwnerItem 
                            key={owner.id} 
                            owner={owner} 
                            onDelete={handleDelete}
                            isDeleting={deletingId === owner.id}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

