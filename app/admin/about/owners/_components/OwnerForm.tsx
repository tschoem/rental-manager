'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createOwner, updateOwner, scanSocialMedia, addOwnerImage } from '../../actions';
import SocialMediaScanner from './SocialMediaScanner';
import ImageSelector from './ImageSelector';
import ImageUploadWithCrop from '@/app/_components/ImageUploadWithCrop';

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
    facebookUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
    airbnbUrl: string | null;
    websiteUrl: string | null;
    scannedData: string | null;
    images: OwnerImage[];
}

interface OwnerFormProps {
    owner?: Owner;
}

export default function OwnerForm({ owner }: OwnerFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState(owner?.name || '');
    const [bio, setBio] = useState(owner?.bio || '');
    const [profileImage, setProfileImage] = useState(owner?.profileImage || '');
    const [facebookUrl, setFacebookUrl] = useState(owner?.facebookUrl || '');
    const [instagramUrl, setInstagramUrl] = useState(owner?.instagramUrl || '');
    const [twitterUrl, setTwitterUrl] = useState(owner?.twitterUrl || '');
    const [linkedinUrl, setLinkedinUrl] = useState(owner?.linkedinUrl || '');
    const [airbnbUrl, setAirbnbUrl] = useState(owner?.airbnbUrl || '');
    const [websiteUrl, setWebsiteUrl] = useState(owner?.websiteUrl || '');
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', name);
        formData.append('bio', bio);
        // Only include profileImage if owner exists (for editing)
        if (owner) {
            formData.append('profileImage', profileImage);
        }
        formData.append('facebookUrl', facebookUrl);
        formData.append('instagramUrl', instagramUrl);
        formData.append('twitterUrl', twitterUrl);
        formData.append('linkedinUrl', linkedinUrl);
        formData.append('airbnbUrl', airbnbUrl);
        formData.append('websiteUrl', websiteUrl);

        startTransition(async () => {
            try {
                if (owner) {
                    await updateOwner(owner.id, formData);
                    router.push('/admin/about');
                    router.refresh();
                } else {
                    const ownerId = await createOwner(formData);
                    // Redirect to edit page after creating new owner
                    router.push(`/admin/about/owners/${ownerId}`);
                    router.refresh();
                }
            } catch (error) {
                alert('Failed to save owner');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Basic Info */}
                <div style={{ padding: '1.5rem', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Basic Information</h2>
                    
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Bio
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                                placeholder="Tell us about this owner..."
                            />
                        </div>

                    </div>
                </div>

                {/* Social Media Links */}
                <div style={{ padding: '1.5rem', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Social Media Links</h2>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Facebook URL
                            </label>
                            <input
                                type="url"
                                value={facebookUrl}
                                onChange={(e) => setFacebookUrl(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem'
                                }}
                                placeholder="https://facebook.com/username"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Instagram URL
                            </label>
                            <input
                                type="url"
                                value={instagramUrl}
                                onChange={(e) => setInstagramUrl(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem'
                                }}
                                placeholder="https://instagram.com/username"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Twitter/X URL
                            </label>
                            <input
                                type="url"
                                value={twitterUrl}
                                onChange={(e) => setTwitterUrl(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem'
                                }}
                                placeholder="https://twitter.com/username"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                LinkedIn URL
                            </label>
                            <input
                                type="url"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem'
                                }}
                                placeholder="https://linkedin.com/in/username"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Airbnb URL
                            </label>
                            <input
                                type="url"
                                value={airbnbUrl}
                                onChange={(e) => setAirbnbUrl(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem'
                                }}
                                placeholder="https://airbnb.com/users/show/username"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Website URL
                            </label>
                            <input
                                type="url"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem'
                                }}
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>

                    {/* Social Media Scanner - Always visible when owner exists */}
                    {owner && (
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                            <SocialMediaScanner owner={owner} />
                        </div>
                    )}
                </div>

                {/* Image Management - Only show if owner exists */}
                {owner && (
                    <div style={{ padding: '1.5rem', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Images</h2>
                        
                        {/* Upload Image */}
                        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Upload Image
                            </label>
                            <ImageUploadWithCrop
                                onUploadComplete={async (imageUrl) => {
                                    setUploadingImage(true);
                                    try {
                                        await addOwnerImage(owner.id, imageUrl);
                                        router.refresh();
                                    } catch (error) {
                                        alert('Failed to add image');
                                    } finally {
                                        setUploadingImage(false);
                                    }
                                }}
                                folder="owner-images"
                                maxSizeMB={2}
                                aspectRatio={1}
                                disabled={uploadingImage}
                            />
                        </div>

                        {/* Image Selector */}
                        {owner.images.length > 0 ? (
                            <ImageSelector 
                                owner={owner} 
                                onProfileImageSet={(imageUrl) => setProfileImage(imageUrl)}
                            />
                        ) : (
                            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                                No images yet. Add images manually or scan social media to collect images.
                            </p>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={() => router.push('/admin/about')}
                        className="btn btn-outline"
                        disabled={isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isPending}
                    >
                        {isPending ? 'Saving...' : owner ? 'Update Owner' : 'Create Owner'}
                    </button>
                </div>
            </div>
        </form>
    );
}

