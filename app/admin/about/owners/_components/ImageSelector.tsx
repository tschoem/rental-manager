'use client';

import { useState, useTransition } from 'react';
import { setProfileImage, deleteOwnerImage, deleteOwnerImages } from '../../actions';
import { useRouter } from 'next/navigation';

interface OwnerImage {
    id: string;
    url: string;
    isProfile: boolean;
}

interface Owner {
    id: string;
    images: OwnerImage[];
    profileImage: string | null;
}

interface ImageSelectorProps {
    owner: Owner;
    onProfileImageSet?: (imageUrl: string) => void;
}

export default function ImageSelector({ owner, onProfileImageSet }: ImageSelectorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

    const handleSelectProfile = async (imageId: string) => {
        if (isPending) return; // Prevent multiple clicks
        
        // Find the image URL before updating
        const selectedImage = owner.images.find(img => img.id === imageId);
        const imageUrl = selectedImage?.url || '';
        
        startTransition(async () => {
            try {
                await setProfileImage(owner.id, imageId);
                // Update parent form state if callback provided
                if (onProfileImageSet && imageUrl) {
                    onProfileImageSet(imageUrl);
                }
                router.refresh();
            } catch (error) {
                console.error('Error setting profile image:', error);
                alert(`Failed to set profile image: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    };

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
        if (selectedImages.size === owner.images.length) {
            setSelectedImages(new Set());
        } else {
            setSelectedImages(new Set(owner.images.map(img => img.id)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedImages.size > 0) {
            if (confirm(`Are you sure you want to delete ${selectedImages.size} image(s)?`)) {
                startTransition(async () => {
                    try {
                        await deleteOwnerImages(Array.from(selectedImages), owner.id);
                        setSelectedImages(new Set());
                        router.refresh();
                    } catch (error) {
                        alert('Failed to delete images');
                    }
                });
            }
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        if (!confirm('Are you sure you want to delete this image?')) {
            return;
        }

        startTransition(async () => {
            try {
                await deleteOwnerImage(imageId, owner.id);
                router.refresh();
            } catch (error) {
                alert('Failed to delete image');
            }
        });
    };

    if (owner.images.length === 0) {
        return (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                No images available. Images will appear here after scanning social media.
            </p>
        );
    }

    return (
        <div>
            {owner.images.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="btn btn-outline"
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                        disabled={isPending}
                    >
                        {selectedImages.size === owner.images.length ? 'Deselect All' : 'Select All'}
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

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
            }}>
                {owner.images.map((image) => {
                    const isSelected = selectedImages.has(image.id);
                    const isProfile = image.isProfile;
                    return (
                        <div
                            key={image.id}
                            style={{
                                position: 'relative',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: isSelected ? '3px solid var(--primary)' : isProfile ? '3px solid #16a34a' : '1px solid var(--border)',
                                cursor: 'pointer',
                                opacity: isSelected ? 0.9 : 1,
                                transition: 'all 0.2s ease',
                                aspectRatio: '1'
                            }}
                            onClick={() => handleToggleImageSelection(image.id)}
                        >
                            <img
                                src={image.url}
                                alt="Owner"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                            {/* Selection checkbox */}
                            <div style={{
                                position: 'absolute',
                                top: '0.5rem',
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
                            {/* Profile image indicator */}
                            {isProfile && (
                                <div style={{
                                    position: 'absolute',
                                    top: '0.5rem',
                                    right: '0.5rem',
                                    background: '#16a34a',
                                    color: 'white',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }}>
                                    Profile
                                </div>
                            )}
                            {/* Action buttons */}
                            <div style={{
                                position: 'absolute',
                                bottom: '0.5rem',
                                left: '0.5rem',
                                right: '0.5rem',
                                display: 'flex',
                                gap: '0.5rem'
                            }}>
                                {!isProfile && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelectProfile(image.id);
                                        }}
                                        disabled={isPending}
                                        className="btn btn-outline"
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            fontSize: '0.75rem',
                                            background: 'rgba(255,255,255,0.95)',
                                            border: '1px solid var(--border)',
                                            cursor: isPending ? 'wait' : 'pointer'
                                        }}
                                    >
                                        {isPending ? 'Setting...' : 'Set Profile'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteImage(image.id);
                                    }}
                                    disabled={isPending}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        fontSize: '0.75rem',
                                        background: 'rgba(255,255,255,0.95)',
                                        border: '1px solid var(--border)',
                                        color: '#c00',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
