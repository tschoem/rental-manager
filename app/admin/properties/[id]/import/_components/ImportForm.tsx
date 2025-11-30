'use client'

import { importListing } from "@/app/admin/actions";
import { useState, useEffect, useRef } from "react";

interface ImportFormProps {
    propertyId: string;
    propertyName: string;
}

type ProgressStage = 
    | 'idle'
    | 'initializing'
    | 'scraping'
    | 'extracting-images'
    | 'extracting-amenities'
    | 'saving'
    | 'complete'
    | 'error';

interface ProgressState {
    stage: ProgressStage;
    message: string;
    progress: number;
}

export default function ImportForm({ propertyId, propertyName }: ImportFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState<ProgressState>({
        stage: 'idle',
        message: '',
        progress: 0
    });
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastStageChangeRef = useRef<number>(Date.now());

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, []);

    const getStageInfo = (stage: ProgressStage) => {
        const stages = {
            idle: { label: 'Ready', message: 'Click Import Room to start', progress: 0 },
            initializing: { label: 'Initializing', message: 'Starting browser and loading page...', progress: 10 },
            scraping: { label: 'Scraping Listing', message: 'Extracting title, description, price, and capacity...', progress: 30 },
            'extracting-images': { label: 'Extracting Images', message: 'Collecting images from gallery...', progress: 50 },
            'extracting-amenities': { label: 'Extracting Amenities', message: 'Getting amenities list...', progress: 70 },
            saving: { label: 'Saving', message: 'Saving room and images to database...', progress: 90 },
            complete: { label: 'Complete', message: 'Import completed successfully!', progress: 100 },
            error: { label: 'Error', message: 'An error occurred during import', progress: 0 }
        };
        return stages[stage];
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        setLoading(true);
        setError("");
        const startTime = Date.now();
        lastStageChangeRef.current = startTime;
        
        // Define stages with their durations and progress ranges
        const stages: Array<{ key: ProgressStage; duration: number; progressStart: number; progressEnd: number }> = [
            { key: 'initializing', duration: 2000, progressStart: 0, progressEnd: 15 },
            { key: 'scraping', duration: 5000, progressStart: 15, progressEnd: 35 },
            { key: 'extracting-images', duration: 12000, progressStart: 35, progressEnd: 60 },
            { key: 'extracting-amenities', duration: 4000, progressStart: 60, progressEnd: 80 },
            { key: 'saving', duration: 3000, progressStart: 80, progressEnd: 95 }
        ];
        
        setProgress({ stage: 'initializing', message: 'Starting browser and loading page...', progress: 0 });

        // Progress updates - stages advance automatically based on elapsed time
        progressIntervalRef.current = setInterval(() => {
            const totalElapsed = Date.now() - startTime;
            let cumulativeTime = 0;
            let currentStage: ProgressStage = 'initializing';
            let currentProgress = 0;
            
            // Determine which stage we should be in based on elapsed time
            for (const stage of stages) {
                cumulativeTime += stage.duration;
                
                if (totalElapsed < cumulativeTime) {
                    // We're in this stage
                    currentStage = stage.key;
                    const timeInStage = totalElapsed - (cumulativeTime - stage.duration);
                    const stageProgress = Math.min((timeInStage / stage.duration) * 100, 100);
                    const progressRange = stage.progressEnd - stage.progressStart;
                    currentProgress = stage.progressStart + (stageProgress / 100) * progressRange;
                    break;
                } else if (stage === stages[stages.length - 1]) {
                    // We've passed all stages, stay at the last one
                    currentStage = stage.key;
                    currentProgress = stage.progressEnd;
                }
            }
            
            // Update progress state
            const info = getStageInfo(currentStage);
            setProgress({
                stage: currentStage,
                message: info.message,
                progress: Math.round(Math.min(currentProgress, 95))
            });
        }, 300); // Update every 300ms

        try {
            // Start the import
            const importPromise = importListing(formData);
            
            // Wait for import to complete
            await importPromise;
            
            // Clear interval and show completion
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            setProgress({ stage: 'complete', message: 'Import completed successfully!', progress: 100 });
            
            // Small delay to show completion before redirect
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Redirect will happen via the server action, but if it doesn't, we can handle it here
        } catch (e: any) {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            console.error(e);
            setError(e.message || "Failed to import. Check the URL or try again.");
            setProgress({ stage: 'error', message: e.message || 'Import failed', progress: 0 });
            setLoading(false);
        }
    }

    return (
        <div>
            <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: '12px', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                    Importing room for property: <strong>{propertyName}</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <input type="hidden" name="propertyId" value={propertyId} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="url" style={{ fontWeight: 500 }}>Airbnb Listing URL</label>
                    <input
                        type="url"
                        name="url"
                        id="url"
                        placeholder="https://www.airbnb.com/rooms/..."
                        required
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        We will try to fetch the title, description, and main image. You can edit these later.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="galleryUrl" style={{ fontWeight: 500 }}>Picture Gallery URL (Optional)</label>
                    <input
                        type="url"
                        name="galleryUrl"
                        id="galleryUrl"
                        placeholder="https://www.airbnb.com/rooms/.../photos/..."
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        If automatic image extraction fails, paste the gallery URL here. Open the first image on the listing page and copy the URL from the address bar.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="iCalUrl" style={{ fontWeight: 500 }}>iCal Calendar URL (Optional)</label>
                    <input
                        type="url"
                        name="iCalUrl"
                        id="iCalUrl"
                        placeholder="https://www.airbnb.com/calendar/ical/..."
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Add the iCal URL to automatically sync availability from Airbnb.
                    </p>
                </div>

                {/* Progress Indicator */}
                {loading && (
                    <div style={{ 
                        padding: '1.5rem', 
                        background: 'var(--surface)', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border)',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                            }}>
                                <span style={{ 
                                    fontSize: '0.875rem', 
                                    fontWeight: 600,
                                    color: 'var(--foreground)'
                                }}>
                                    {getStageInfo(progress.stage).label}
                                </span>
                                <span style={{ 
                                    fontSize: '0.875rem', 
                                    color: 'var(--muted)'
                                }}>
                                    {Math.round(progress.progress)}%
                                </span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '8px',
                                background: 'var(--border)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${progress.progress}%`,
                                    height: '100%',
                                    background: progress.stage === 'error' ? '#c00' : 'var(--primary)',
                                    borderRadius: '4px',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>
                        
                        {/* Stage Steps */}
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            flexWrap: 'wrap'
                        }}>
                            {[
                                { key: 'initializing', label: 'Init' },
                                { key: 'scraping', label: 'Scrape' },
                                { key: 'extracting-images', label: 'Images' },
                                { key: 'extracting-amenities', label: 'Amenities' },
                                { key: 'saving', label: 'Save' }
                            ].map((step, index) => {
                                const stepKeys: ProgressStage[] = ['initializing', 'scraping', 'extracting-images', 'extracting-amenities', 'saving'];
                                const currentIndex = stepKeys.indexOf(progress.stage);
                                const isActive = currentIndex === index;
                                const isComplete = currentIndex > index;
                                
                                return (
                                    <div
                                        key={step.key}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            background: isComplete 
                                                ? 'var(--primary)' 
                                                : isActive 
                                                    ? 'var(--primary)' 
                                                    : 'var(--border)',
                                            color: (isComplete || isActive) ? 'white' : 'var(--muted)',
                                            opacity: isActive ? 1 : (isComplete ? 0.7 : 0.5),
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {step.label}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <p style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--muted)',
                            margin: 0
                        }}>
                            {progress.message}
                        </p>
                    </div>
                )}

                {error && (
                    <div style={{ padding: '1rem', background: '#fee', color: '#c00', borderRadius: '8px', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Importing...' : 'Import Room'}
                </button>
            </form>
        </div>
    );
}
