'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
    updateHomePageContent, 
    addHeroImage, 
    deleteHeroImage, 
    deleteHeroImages,
    createFeature,
    updateFeature,
    deleteFeature,
    toggleSectionVisibility
} from '../actions';
import SectionToggle from './SectionToggle';
import ImageUploadWithCrop from '@/app/_components/ImageUploadWithCrop';
import SortableHeroImages from './SortableHeroImages';
import SortableFeatures from './SortableFeatures';

interface HomePageImage {
    id: string;
    url: string;
    order: number;
}

interface HomePageFeature {
    id: string;
    icon: string | null;
    title: string;
    description: string;
    order: number;
}

interface HomePageSettings {
    id: string;
    heroTitle: string | null;
    heroSubtitle: string | null;
    heroCtaText: string | null;
    showHeroSection: boolean;
    featuresTitle: string | null;
    showFeaturesSection: boolean;
    aboutTitle: string | null;
    aboutDescription: string | null;
    showAboutSection: boolean;
    roomsTitle: string | null;
    roomsSubtitle: string | null;
    showRoomsSection: boolean;
    ctaTitle: string | null;
    ctaDescription: string | null;
    showCtaSection: boolean;
    heroImages: HomePageImage[];
    features: HomePageFeature[];
}

interface HomePageEditorProps {
    settings: HomePageSettings;
}

export default function HomePageEditor({ settings }: HomePageEditorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        startTransition(async () => {
            try {
                await updateHomePageContent(formData);
                router.refresh();
            } catch (error) {
                alert('Failed to update home page content');
            }
        });
    };

    const handleAddHeroImage = async (imageUrl: string) => {
        setUploadingImage(true);
        try {
            await addHeroImage(imageUrl);
            router.refresh();
        } catch (error) {
            alert('Failed to add hero image');
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Hero Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Hero Section</h2>
                
                <SectionToggle
                    label="Hero"
                    checked={settings.showHeroSection}
                    onChange={(checked) => toggleSectionVisibility('showHeroSection', checked)}
                />
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} key={`hero-${settings.id}`}>
                    <input type="hidden" name="showHeroSection" value={settings.showHeroSection.toString()} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="heroTitle" style={{ fontWeight: 500 }}>Hero Title</label>
                        <input
                            type="text"
                            id="heroTitle"
                            name="heroTitle"
                            key={`heroTitle-${settings.heroTitle || ''}`}
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
                            key={`heroSubtitle-${settings.heroSubtitle || ''}`}
                            defaultValue={settings.heroSubtitle || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="heroCtaText" style={{ fontWeight: 500 }}>Hero CTA Button Text</label>
                        <input
                            type="text"
                            id="heroCtaText"
                            name="heroCtaText"
                            key={`heroCtaText-${settings.heroCtaText || ''}`}
                            defaultValue={settings.heroCtaText || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Hero Text'}
                    </button>
                </form>

                {/* Hero Images */}
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Hero Images</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                        Upload images to rotate in the hero section. Images will be displayed in order.
                    </p>
                    
                    <div style={{ marginBottom: '1rem' }}>
                        <ImageUploadWithCrop
                            onUploadComplete={handleAddHeroImage}
                            folder="home-hero-images"
                            maxSizeMB={5}
                            aspectRatio={21/9} // Wide hero banner aspect ratio (21:9)
                            disabled={uploadingImage}
                        />
                    </div>

                    {settings.heroImages.length > 0 && (
                        <SortableHeroImages 
                            images={settings.heroImages}
                            settingsId={settings.id}
                        />
                    )}
                </div>
            </div>

            {/* About Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>About Section</h2>
                
                <SectionToggle
                    label="About"
                    checked={settings.showAboutSection}
                    onChange={(checked) => toggleSectionVisibility('showAboutSection', checked)}
                />
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <input type="hidden" name="showAboutSection" value={settings.showAboutSection.toString()} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="aboutTitle" style={{ fontWeight: 500 }}>About Title</label>
                        <input
                            type="text"
                            id="aboutTitle"
                            name="aboutTitle"
                            defaultValue={settings.aboutTitle || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="aboutDescription" style={{ fontWeight: 500 }}>About Description</label>
                        <textarea
                            id="aboutDescription"
                            name="aboutDescription"
                            defaultValue={settings.aboutDescription || ''}
                            rows={6}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit', lineHeight: 1.6 }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save About Section'}
                    </button>
                </form>
            </div>

            {/* Rooms Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Rooms & Suites Section</h2>
                
                <SectionToggle
                    label="Rooms"
                    checked={settings.showRoomsSection}
                    onChange={(checked) => toggleSectionVisibility('showRoomsSection', checked)}
                />
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} key={`rooms-${settings.id}`}>
                    <input type="hidden" name="showRoomsSection" value={settings.showRoomsSection.toString()} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="roomsTitle" style={{ fontWeight: 500 }}>Rooms Section Title</label>
                        <input
                            type="text"
                            id="roomsTitle"
                            name="roomsTitle"
                            key={`roomsTitle-${settings.roomsTitle || ''}`}
                            defaultValue={settings.roomsTitle || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="roomsSubtitle" style={{ fontWeight: 500 }}>Rooms Section Subtitle</label>
                        <textarea
                            id="roomsSubtitle"
                            name="roomsSubtitle"
                            key={`roomsSubtitle-${settings.roomsSubtitle || ''}`}
                            defaultValue={settings.roomsSubtitle || ''}
                            rows={3}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit', lineHeight: 1.6 }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Rooms Section'}
                    </button>
                </form>
            </div>

            {/* Features Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Features Section</h2>
                
                <SectionToggle
                    label="Features"
                    checked={settings.showFeaturesSection}
                    onChange={(checked) => toggleSectionVisibility('showFeaturesSection', checked)}
                />
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <input type="hidden" name="showFeaturesSection" value={settings.showFeaturesSection.toString()} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="featuresTitle" style={{ fontWeight: 500 }}>Features Section Title (Optional)</label>
                        <input
                            type="text"
                            id="featuresTitle"
                            name="featuresTitle"
                            defaultValue={settings.featuresTitle || ''}
                            placeholder="Leave empty to hide title"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isPending} style={{ alignSelf: 'flex-start' }}>
                        {isPending ? 'Saving...' : 'Save Features Title'}
                    </button>
                </form>
                
                <SortableFeatures 
                    features={settings.features}
                    settingsId={settings.id}
                />
            </div>

            {/* CTA Section */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>CTA Section</h2>
                
                <SectionToggle
                    label="CTA"
                    checked={settings.showCtaSection}
                    onChange={(checked) => toggleSectionVisibility('showCtaSection', checked)}
                />
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} key={`cta-${settings.id}`}>
                    <input type="hidden" name="showCtaSection" value={settings.showCtaSection.toString()} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="ctaTitle" style={{ fontWeight: 500 }}>CTA Title</label>
                        <input
                            type="text"
                            id="ctaTitle"
                            name="ctaTitle"
                            key={`ctaTitle-${settings.ctaTitle || ''}`}
                            defaultValue={settings.ctaTitle || ''}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="ctaDescription" style={{ fontWeight: 500 }}>CTA Description</label>
                        <textarea
                            id="ctaDescription"
                            name="ctaDescription"
                            key={`ctaDescription-${settings.ctaDescription || ''}`}
                            defaultValue={settings.ctaDescription || ''}
                            rows={3}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit', lineHeight: 1.6 }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save CTA Section'}
                    </button>
                </form>
            </div>
        </div>
    );
}

