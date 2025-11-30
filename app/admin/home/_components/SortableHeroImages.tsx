'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { deleteHeroImage, deleteHeroImages, updateHeroImageOrder } from '../actions';

interface HomePageImage {
    id: string;
    url: string;
    order: number;
}

interface SortableHeroImagesProps {
    images: HomePageImage[];
    settingsId: string;
}

function SortableImageItem({ image, onDelete }: { image: HomePageImage; onDelete: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--surface)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                alignItems: 'center'
            }}
        >
            <div
                {...attributes}
                {...listeners}
                suppressHydrationWarning
                style={{
                    cursor: 'grab',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--muted)'
                }}
            >
                ⋮⋮
            </div>
            <img
                src={image.url}
                alt={`Hero image ${image.order + 1}`}
                style={{
                    width: '120px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                }}
            />
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>
                    Order: {image.order + 1}
                </p>
            </div>
            <button
                type="button"
                onClick={() => {
                    if (confirm('Are you sure you want to delete this image?')) {
                        onDelete(image.id);
                    }
                }}
                className="btn btn-destructive"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
                Delete
            </button>
        </div>
    );
}

export default function SortableHeroImages({ images, settingsId }: SortableHeroImagesProps) {
    const router = useRouter();
    const [items, setItems] = useState(images);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
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
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);

            // Update order in database
            const imageOrders = newItems.map((item, index) => ({
                imageId: item.id,
                order: index
            }));

            startTransition(async () => {
                try {
                    await updateHeroImageOrder(imageOrders);
                    router.refresh();
                } catch (error) {
                    console.error('Failed to update image order:', error);
                }
            });
        }
    };

    const handleDelete = async (imageId: string) => {
        startTransition(async () => {
            try {
                await deleteHeroImage(imageId);
                setItems(items.filter(img => img.id !== imageId));
                setSelectedImages(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(imageId);
                    return newSet;
                });
                router.refresh();
            } catch (error) {
                alert('Failed to delete image');
            }
        });
    };

    const handleToggleSelection = (imageId: string) => {
        setSelectedImages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            } else {
                newSet.add(imageId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedImages.size === items.length) {
            setSelectedImages(new Set());
        } else {
            setSelectedImages(new Set(items.map(img => img.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedImages.size > 0) {
            if (confirm(`Are you sure you want to delete ${selectedImages.size} image(s)?`)) {
                startTransition(async () => {
                    try {
                        await deleteHeroImages(Array.from(selectedImages));
                        setItems(items.filter(img => !selectedImages.has(img.id)));
                        setSelectedImages(new Set());
                        router.refresh();
                    } catch (error) {
                        alert('Failed to delete images');
                    }
                });
            }
        }
    };

    return (
        <div>
            {items.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="btn btn-outline"
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                        {selectedImages.size === items.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedImages.size > 0 && (
                        <button
                            type="button"
                            onClick={handleBulkDelete}
                            disabled={isPending}
                            className="btn btn-outline"
                            style={{
                                fontSize: '0.875rem',
                                padding: '0.5rem 1rem',
                                color: '#c00',
                                borderColor: '#c00'
                            }}
                        >
                            Delete Selected ({selectedImages.size})
                        </button>
                    )}
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(img => img.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {items.map((image) => (
                            <div key={image.id} style={{ position: 'relative' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedImages.has(image.id)}
                                    onChange={() => handleToggleSelection(image.id)}
                                    style={{
                                        position: 'absolute',
                                        top: '1.5rem',
                                        right: '5rem',
                                        zIndex: 10,
                                        width: '20px',
                                        height: '20px'
                                    }}
                                />
                                <SortableImageItem image={image} onDelete={handleDelete} />
                            </div>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

