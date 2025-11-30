'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
    updateLocationPageContent,
    updateHeroImage,
    updateArea1Image,
    updateArea2Image
} from '../actions';
import ImageUploadWithCrop from '@/app/_components/ImageUploadWithCrop';

interface LocationPageSettings {
    id: string;
    heroImageUrl: string | null;
    heroTitle: string | null;
    heroSubtitle: string | null;
    area1Title: string | null;
    area1Subtitle: string | null;
    area1Content: string | null;
    area1ImageUrl: string | null;
    area2Title: string | null;
    area2Subtitle: string | null;
    area2Content: string | null;
    area2ImageUrl: string | null;
    mapTitle: string | null;
    mapEmbedUrl: string | null;
}

interface LocationPageEditorProps {
    settings: LocationPageSettings;
}

export default function LocationPageEditor({ settings }: LocationPageEditorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
    const [uploadingArea1Image, setUploadingArea1Image] = useState(false);
    const [uploadingArea2Image, setUploadingArea2Image] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        startTransition(async () => {
            try {
                await updateLocationPageContent(formData);
                router.refresh();
            } catch (error) {
                alert('Failed to update location page content');
            }
        });
    };

    const handleHeroImageUpload = async (imageUrl: string) => {
        setUploadingHeroImage(true);
        try {
            await updateHeroImage(imageUrl);
            router.refresh();
        } catch (error) {
            alert('Failed to update hero image');
        } finally {
            setUploadingHeroImage(false);
        }
    };

    const handleArea1ImageUpload = async (imageUrl: string) => {
        setUploadingArea1Image(true);
        try {
            await updateArea1Image(imageUrl);
            router.refresh();
        } catch (error) {
            alert('Failed to update Area 1 image');
        } finally {
            setUploadingArea1Image(false);
        }
    };

    const handleArea2ImageUpload = async (imageUrl: string) => {
        setUploadingArea2Image(true);
        try {
            await updateArea2Image(imageUrl);
            router.refresh();
        } catch (error) {
            alert('Failed to update Area 2 image');
        } finally {
            setUploadingArea2Image(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Hero Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Hero Section</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="heroTitle" style={{ fontWeight: 500 }}>Hero Title</label>
                        <input
                            type="text"
                            id="heroTitle"
                            name="heroTitle"
                            defaultValue={settings.heroTitle || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="heroSubtitle" style={{ fontWeight: 500 }}>Hero Subtitle</label>
                        <input
                            type="text"
                            id="heroSubtitle"
                            name="heroSubtitle"
                            defaultValue={settings.heroSubtitle || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Hero Text'}
                    </button>
                </form>

                {/* Hero Image */}
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Hero Background Image</h3>
                    {settings.heroImageUrl && (
                        <div style={{ marginBottom: '1rem' }}>
                            <img
                                src={settings.heroImageUrl}
                                alt="Hero background"
                                style={{
                                    width: '100%',
                                    maxWidth: '600px',
                                    height: '300px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)'
                                }}
                            />
                        </div>
                    )}
                    <ImageUploadWithCrop
                        onUploadComplete={handleHeroImageUpload}
                        folder="location-hero-images"
                        maxSizeMB={5}
                        disabled={uploadingHeroImage}
                    />
                </div>
            </div>

            {/* Area 1 Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Area 1 Section</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="area1Title" style={{ fontWeight: 500 }}>Area 1 Title</label>
                        <input
                            type="text"
                            id="area1Title"
                            name="area1Title"
                            defaultValue={settings.area1Title || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="area1Subtitle" style={{ fontWeight: 500 }}>Area 1 Subtitle</label>
                        <input
                            type="text"
                            id="area1Subtitle"
                            name="area1Subtitle"
                            defaultValue={settings.area1Subtitle || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="area1Content" style={{ fontWeight: 500 }}>Area 1 Content</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                            Use double line breaks to separate paragraphs.
                        </p>
                        <textarea
                            id="area1Content"
                            name="area1Content"
                            defaultValue={settings.area1Content || ''}
                            rows={8}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit', lineHeight: 1.6 }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Area 1 Section'}
                    </button>
                </form>

                {/* Area 1 Image */}
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Area 1 Image</h3>
                    {settings.area1ImageUrl && (
                        <div style={{ marginBottom: '1rem' }}>
                            <img
                                src={settings.area1ImageUrl}
                                alt={settings.area1Title || "Area 1"}
                                style={{
                                    width: '100%',
                                    maxWidth: '600px',
                                    height: '300px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)'
                                }}
                            />
                        </div>
                    )}
                    <ImageUploadWithCrop
                        onUploadComplete={handleArea1ImageUpload}
                        folder="location-images"
                        maxSizeMB={5}
                        disabled={uploadingArea1Image}
                    />
                </div>
            </div>

            {/* Area 2 Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Area 2 Section</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="area2Title" style={{ fontWeight: 500 }}>Area 2 Title</label>
                        <input
                            type="text"
                            id="area2Title"
                            name="area2Title"
                            defaultValue={settings.area2Title || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="area2Subtitle" style={{ fontWeight: 500 }}>Area 2 Subtitle</label>
                        <input
                            type="text"
                            id="area2Subtitle"
                            name="area2Subtitle"
                            defaultValue={settings.area2Subtitle || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="area2Content" style={{ fontWeight: 500 }}>Area 2 Content</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                            Use double line breaks to separate paragraphs.
                        </p>
                        <textarea
                            id="area2Content"
                            name="area2Content"
                            defaultValue={settings.area2Content || ''}
                            rows={8}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit', lineHeight: 1.6 }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Area 2 Section'}
                    </button>
                </form>

                {/* Area 2 Image */}
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Area 2 Image</h3>
                    {settings.area2ImageUrl && (
                        <div style={{ marginBottom: '1rem' }}>
                            <img
                                src={settings.area2ImageUrl}
                                alt={settings.area2Title || "Area 2"}
                                style={{
                                    width: '100%',
                                    maxWidth: '600px',
                                    height: '300px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)'
                                }}
                            />
                        </div>
                    )}
                    <ImageUploadWithCrop
                        onUploadComplete={handleArea2ImageUpload}
                        folder="location-images"
                        maxSizeMB={5}
                        disabled={uploadingArea2Image}
                    />
                </div>
            </div>

            {/* Map Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Map Section</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="mapTitle" style={{ fontWeight: 500 }}>Map Title</label>
                        <input
                            type="text"
                            id="mapTitle"
                            name="mapTitle"
                            defaultValue={settings.mapTitle || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="mapEmbedUrl" style={{ fontWeight: 500 }}>Google Maps Embed URL</label>
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                            Get the embed URL from Google Maps: Share → Embed a map → Copy HTML → Extract the src URL
                        </p>
                        <textarea
                            id="mapEmbedUrl"
                            name="mapEmbedUrl"
                            defaultValue={settings.mapEmbedUrl || ''}
                            rows={3}
                            placeholder="https://www.google.com/maps/embed?pb=..."
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit' }}
                        />
                    </div>

                    {settings.mapEmbedUrl && (
                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Preview:</p>
                            <div style={{
                                width: '100%',
                                height: '300px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid var(--border)'
                            }}>
                                <iframe
                                    src={settings.mapEmbedUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Map Section'}
                    </button>
                </form>
            </div>
        </div>
    );
}

