'use client';

import { useState, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';

interface ImageUploadWithCropProps {
    onUploadComplete: (imageUrl: string) => void;
    folder: string;
    maxSizeMB?: number;
    aspectRatio?: number;
    disabled?: boolean;
}

export default function ImageUploadWithCrop({
    onUploadComplete,
    folder,
    maxSizeMB = 2,
    aspectRatio,
    disabled = false
}: ImageUploadWithCropProps) {
    const [uploading, setUploading] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [showCrop, setShowCrop] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (2MB = 2 * 1024 * 1024 bytes)
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            alert(`File size exceeds ${maxSizeMB}MB limit. Please choose a smaller image.`);
            return;
        }

        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Read file and show crop interface
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
            // Reset crop position - react-easy-crop will center automatically when aspect ratio is set
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setShowCrop(true);
        };
        reader.readAsDataURL(file);
    };

    const createImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.src = url;
        });
    };

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg', 0.9);
        });
    };

    const handleCropComplete = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setUploading(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            
            // Create FormData and upload
            const formData = new FormData();
            formData.append('file', croppedBlob, 'image.jpg');
            formData.append('folder', folder);

            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            onUploadComplete(data.url);
            
            // Reset state
            setImageSrc(null);
            setShowCrop(false);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setImageSrc(null);
        setShowCrop(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            {!showCrop ? (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={disabled || uploading}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || uploading}
                        className="btn btn-outline"
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                        Max size: {maxSizeMB}MB
                    </p>
                </div>
            ) : (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.9)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        position: 'relative',
                        background: 'white',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Crop Image</h3>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '400px',
                            background: '#000'
                        }}>
                            {imageSrc && (
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={aspectRatio}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                    cropShape={aspectRatio === 1 ? 'round' : 'rect'}
                                    showGrid={aspectRatio === 1}
                                    restrictPosition={true}
                                    style={{
                                        containerStyle: {
                                            width: '100%',
                                            height: '100%'
                                        }
                                    }}
                                />
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.875rem', marginRight: '1rem' }}>Zoom:</label>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                style={{ flex: 1 }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="btn btn-outline"
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCropComplete}
                                className="btn btn-primary"
                                disabled={uploading || !croppedAreaPixels}
                            >
                                {uploading ? 'Uploading...' : 'Upload & Crop'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

