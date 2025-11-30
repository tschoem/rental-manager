'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { createFeature, updateFeature, deleteFeature, updateFeatureOrder } from '../actions';

interface HomePageFeature {
    id: string;
    icon: string | null;
    title: string;
    description: string;
    order: number;
}

interface SortableFeaturesProps {
    features: HomePageFeature[];
    settingsId: string;
}

function SortableFeatureItem({ 
    feature, 
    onEdit, 
    onSave,
    onDelete, 
    onCancel,
    isEditing 
}: { 
    feature: HomePageFeature; 
    onEdit: (feature: HomePageFeature) => void;
    onSave: (feature: HomePageFeature) => void;
    onDelete: (id: string) => void;
    onCancel: () => void;
    isEditing: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: feature.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    if (isEditing) {
        return (
            <FeatureEditForm
                feature={feature}
                onSave={onSave}
                onCancel={onCancel}
                onSaveNew={feature.id.startsWith('new-') ? handleSaveNew : undefined}
            />
        );
    }

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
            <div style={{ fontSize: '2rem', minWidth: '3rem', textAlign: 'center' }}>
                {feature.icon || '📌'}
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>{feature.title}</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>
                    {feature.description}
                </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    type="button"
                    onClick={() => onEdit(feature)}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (confirm('Are you sure you want to delete this feature?')) {
                            onDelete(feature.id);
                        }
                    }}
                    className="btn btn-destructive"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

function FeatureEditForm({ 
    feature, 
    onSave, 
    onCancel,
    onSaveNew
}: { 
    feature: HomePageFeature; 
    onSave: (updatedFeature: HomePageFeature) => void;
    onCancel: () => void;
    onSaveNew?: () => void;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState({
        icon: feature.icon || '',
        title: feature.title,
        description: feature.description
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = new FormData();
        form.append('icon', formData.icon);
        form.append('title', formData.title);
        form.append('description', formData.description);

        startTransition(async () => {
            try {
                if (feature.id && !feature.id.startsWith('new-')) {
                    await updateFeature(feature.id, form);
                    // Update local state immediately with the new values
                    const updatedFeature: HomePageFeature = {
                        ...feature,
                        icon: formData.icon || null,
                        title: formData.title,
                        description: formData.description
                    };
                    onSave(updatedFeature);
                } else {
                    // For new features, create and then refresh to get the real ID
                    await createFeature(form);
                    if (onSaveNew) {
                        onSaveNew();
                    }
                    router.refresh();
                }
            } catch (error) {
                alert('Failed to save feature');
            }
        });
    };

    return (
        <div style={{
            padding: '1rem',
            background: 'var(--surface)',
            borderRadius: '8px',
            border: '2px solid var(--primary)'
        }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>Icon (Emoji)</label>
                    <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="✈️"
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontWeight: 500 }}>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={3}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={isPending} style={{ padding: '0.5rem 1rem' }}>
                        {isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={onCancel} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function SortableFeatures({ features, settingsId }: SortableFeaturesProps) {
    const router = useRouter();
    const [items, setItems] = useState(features);
    const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Sync local state with props when features change (after router.refresh)
    useEffect(() => {
        setItems(features);
    }, [features]);

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
            const featureOrders = newItems.map((item, index) => ({
                featureId: item.id,
                order: index
            }));

            startTransition(async () => {
                try {
                    await updateFeatureOrder(featureOrders);
                    router.refresh();
                } catch (error) {
                    console.error('Failed to update feature order:', error);
                }
            });
        }
    };

    const handleEdit = (feature: HomePageFeature) => {
        setEditingFeatureId(feature.id);
    };

    const handleSave = (updatedFeature: HomePageFeature) => {
        // Update the item in the local state immediately
        setItems(items.map(item => 
            item.id === updatedFeature.id ? updatedFeature : item
        ));
        // Exit edit mode
        setEditingFeatureId(null);
        // Refresh to get latest data from server (in case there are other changes)
        router.refresh();
    };

    const handleSaveNew = () => {
        // Remove the temp feature from local state
        setItems(items.filter(f => !f.id.startsWith('new-')));
        // Exit edit mode
        setEditingFeatureId(null);
    };

    const handleDelete = async (featureId: string) => {
        startTransition(async () => {
            try {
                await deleteFeature(featureId);
                setItems(items.filter(f => f.id !== featureId));
                router.refresh();
            } catch (error) {
                alert('Failed to delete feature');
            }
        });
    };

    const handleAddNew = () => {
        const tempId = `new-${Date.now()}`;
        const newFeature: HomePageFeature = {
            id: tempId,
            icon: '📌',
            title: '',
            description: '',
            order: items.length
        };
        setItems([...items, newFeature]);
        setEditingFeatureId(tempId);
    };

    const handleCancelEdit = () => {
        setEditingFeatureId(null);
        // Remove any new features that weren't saved
        setItems(items.filter(f => !f.id.startsWith('new-')));
    };

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <button
                    type="button"
                    onClick={handleAddNew}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem' }}
                >
                    Add New Feature
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {items.map((feature) => (
                            <SortableFeatureItem
                                key={feature.id}
                                feature={feature}
                                onEdit={handleEdit}
                                onSave={handleSave}
                                onDelete={handleDelete}
                                onCancel={handleCancelEdit}
                                isEditing={editingFeatureId === feature.id}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

