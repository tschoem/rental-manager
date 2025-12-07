'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addPropertyImage, deletePropertyImage, deletePropertyImages, togglePropertyHeroImage } from '@/app/admin/actions';

interface PropertyImagesProps {
    propertyId: string;
    images: { id: string; url: string }[];
    heroImageIds?: string | null;
}

export default function PropertyImages({ propertyId, images: initialImages, heroImageIds }: PropertyImagesProps) {
    const [images, setImages] = useState(initialImages);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggleImageSelection = (imageId: string) => {
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
        if (selectedImages.size === images.length) {
            setSelectedImages(new Set());
        } else {
            setSelectedImages(new Set(images.map(img => img.id)));
        }
    };

    const handleAddImage = async () => {
        if (newImageUrl.trim()) {
            startTransition(async () => {
                await addPropertyImage(propertyId, newImageUrl.trim());
                setNewImageUrl('');
                router.refresh();
            });
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        if (confirm("Are you sure you want to delete this image?")) {
            startTransition(async () => {
                await deletePropertyImage(imageId, propertyId);
                setImages(prev => prev.filter(img => img.id !== imageId));
                setSelectedImages(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(imageId);
                    return newSet;
                });
            });
        }
    };

    const handleBulkDelete = () => {
        if (selectedImages.size > 0) {
            if (confirm(`Are you sure you want to delete ${selectedImages.size} image(s)?`)) {
                startTransition(async () => {
                    await deletePropertyImages(Array.from(selectedImages), propertyId);
                    setImages(prev => prev.filter(img => !selectedImages.has(img.id)));
                    setSelectedImages(new Set());
                });
            }
        }
    };

    // Parse hero image IDs
    const heroImageIdsArray: string[] = heroImageIds ? (() => {
        try {
            return JSON.parse(heroImageIds);
        } catch {
            return [];
        }
    })() : [];

    const handleToggleHeroImage = async (imageId: string) => {
        startTransition(async () => {
            try {
                await togglePropertyHeroImage(propertyId, imageId);
                router.refresh();
            } catch (error: any) {
                alert(error.message || 'Failed to update hero image');
            }
        });
    };

    return (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Property Photos</h2>
                {images.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            onClick={handleSelectAll}
                            className="btn btn-outline"
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                        >
                            {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
                        </button>
                        {selectedImages.size > 0 && (
                            <button
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
            </div>

            {images.length === 0 ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>No images added yet.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {images.map((image) => {
                        const isSelected = selectedImages.has(image.id);
                        const isHeroImage = heroImageIdsArray.includes(image.id);
                        const canAddHero = !isHeroImage && heroImageIdsArray.length < 3;
                        return (
                            <div 
                                key={image.id} 
                                style={{ 
                                    position: 'relative', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden', 
                                    border: isHeroImage ? '3px solid #10b981' : isSelected ? '3px solid var(--primary)' : '1px solid var(--border)',
                                    cursor: 'pointer',
                                    opacity: isSelected ? 0.9 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleToggleImageSelection(image.id)}
                            >
                                <img src={image.url} alt="Property" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                                {isHeroImage && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.5rem',
                                        left: '0.5rem',
                                        background: '#10b981',
                                        color: 'white',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        zIndex: 2
                                    }}>
                                        Hero ({heroImageIdsArray.indexOf(image.id) + 1}/3)
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute',
                                    top: isHeroImage ? '2.5rem' : '0.5rem',
                                    left: '0.5rem',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.9)',
                                    border: '2px solid white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem'
                                }}>
                                    {isSelected ? '✓' : ''}
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0.5rem',
                                    left: '0.5rem',
                                    right: '0.5rem',
                                    display: 'flex',
                                    gap: '0.25rem'
                                }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleHeroImage(image.id);
                                        }}
                                        disabled={!canAddHero && !isHeroImage}
                                        style={{ 
                                            flex: 1,
                                            background: isHeroImage ? '#ef4444' : canAddHero ? '#10b981' : '#9ca3af', 
                                            border: 'none', 
                                            borderRadius: '4px', 
                                            padding: '0.25rem 0.5rem', 
                                            cursor: canAddHero || isHeroImage ? 'pointer' : 'not-allowed', 
                                            fontSize: '0.75rem', 
                                            color: 'white',
                                            fontWeight: 'bold',
                                            opacity: canAddHero || isHeroImage ? 1 : 0.6
                                        }}
                                    >
                                        {isHeroImage ? 'Remove Hero' : canAddHero ? 'Set as Hero' : 'Max 3'}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteImage(image.id);
                                        }}
                                        style={{ 
                                            background: 'rgba(255,255,255,0.9)', 
                                            border: 'none', 
                                            borderRadius: '4px', 
                                            padding: '0.25rem 0.5rem', 
                                            cursor: 'pointer', 
                                            fontSize: '0.75rem', 
                                            color: '#c00' 
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Image URL"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                />
                <button 
                    onClick={handleAddImage} 
                    disabled={isPending}
                    className="btn btn-outline"
                >
                    Add Image
                </button>
            </div>
        </div>
    );
}

