'use client';

import { useState, useTransition } from 'react';
import { scanSocialMedia, improveBioWithGemini } from '../../actions';
import { useRouter } from 'next/navigation';

interface Owner {
    id: string;
    name: string;
    facebookUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
    airbnbUrl: string | null;
    websiteUrl: string | null;
    scannedData: string | null;
}

interface SocialMediaScannerProps {
    owner: Owner;
}

export default function SocialMediaScanner({ owner }: SocialMediaScannerProps) {
    const router = useRouter();
    const [isScanning, startTransition] = useTransition();
    const [isImproving, setIsImproving] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [improvedBio, setImprovedBio] = useState<string | null>(null);

    const handleScan = async () => {
        setError(null);
        setScanResult(null);

        // Check if owner has any social media URLs
        const hasSocialMedia = owner.facebookUrl || owner.instagramUrl || owner.twitterUrl || owner.linkedinUrl || owner.airbnbUrl || owner.websiteUrl;
        
        if (!hasSocialMedia) {
            setError('Please add at least one social media URL before scanning.');
            return;
        }

        startTransition(async () => {
            try {
                const result = await scanSocialMedia(owner.id);
                setScanResult(result);
            } catch (err) {
                setError('Failed to scan social media. Please try again.');
                console.error('Scan error:', err);
            }
        });
    };

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Scan social media profiles to automatically generate a bio and collect images. 
                    This will analyze the provided social media links and extract information.
                </p>
                <button
                    type="button"
                    onClick={handleScan}
                    disabled={isScanning}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem' }}
                >
                    {isScanning ? 'Scanning...' : 'Scan Social Media'}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    background: '#fee',
                    color: '#c00',
                    borderRadius: '6px',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {scanResult && (
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--surface)',
                    borderRadius: '8px',
                    marginTop: '1rem'
                }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                        Scan Results
                    </h3>
                    
                    {scanResult.concatenatedBios && (
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                Collected Bios from Social Media:
                            </p>
                            <div style={{
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                border: '1px solid var(--border)'
                            }}>
                                {scanResult.concatenatedBios}
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    setIsImproving(true);
                                    setError(null);
                                    setImprovedBio(null);
                                    try {
                                        const result = await improveBioWithGemini(owner.id);
                                        setImprovedBio(result.improvedBio);
                                        router.refresh();
                                    } catch (err: any) {
                                        setError(err.message || 'Failed to improve bio with Gemini. Please check your API key.');
                                        console.error('Gemini error:', err);
                                    } finally {
                                        setIsImproving(false);
                                    }
                                }}
                                disabled={isImproving}
                                className="btn btn-primary"
                                style={{ 
                                    marginTop: '0.75rem',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {isImproving ? 'Improving with Gemini...' : '✨ Improve Bio with Gemini'}
                            </button>
                        </div>
                    )}

                    {improvedBio && (
                        <div style={{ 
                            marginBottom: '1rem',
                            padding: '1rem',
                            background: '#e8f5e9',
                            borderRadius: '6px',
                            border: '1px solid #4caf50'
                        }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#2e7d32' }}>
                                ✨ Improved Bio (from Gemini):
                            </p>
                            <p style={{
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                lineHeight: 1.6
                            }}>
                                {improvedBio}
                            </p>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                                This bio has been saved to the owner's profile.
                            </p>
                        </div>
                    )}

                    {scanResult.summary && !scanResult.concatenatedBios && (
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Bio Summary:</p>
                            <p style={{
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                lineHeight: 1.6
                            }}>
                                {scanResult.summary}
                            </p>
                        </div>
                    )}

                    {scanResult.images && scanResult.images.length > 0 && (
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                Found {scanResult.images.length} image(s):
                            </p>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                gap: '0.5rem',
                                marginTop: '0.5rem'
                            }}>
                                {scanResult.images.map((url: string, idx: number) => (
                                    <img
                                        key={idx}
                                        src={url}
                                        alt={`Scanned image ${idx + 1}`}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            objectFit: 'cover',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)'
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ))}
                            </div>
                            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                Images have been added to the owner's image gallery. Refresh the page to see them and select a profile picture.
                            </p>
                        </div>
                    )}

                    {(!scanResult.summary && (!scanResult.images || scanResult.images.length === 0)) && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                            No data found. The social media profiles may be private or the URLs may be incorrect.
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="btn btn-outline"
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
                    >
                        Refresh Page
                    </button>
                </div>
            )}
        </div>
    );
}

