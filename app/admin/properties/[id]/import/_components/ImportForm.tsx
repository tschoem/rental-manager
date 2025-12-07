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
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string }>>([]);
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
      initializing: { label: 'Initializing', message: 'Starting import...', progress: 10 },
      scraping: { label: 'Scraping Listing', message: 'Extracting data from HTML...', progress: 30 },
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
    formData.append('useSimpleScraper', 'true'); // Always use simple scraper

    setLoading(true);
    setError("");
    const startTime = Date.now();
    lastStageChangeRef.current = startTime;

    // Poll for real progress updates
    const progressPollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/import-progress?propertyId=${propertyId}&t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          console.log('[UI] Progress update:', data); // Debug log
          if (data.stage && data.stage !== 'idle') {
            setProgress({
              stage: data.stage as ProgressStage,
              message: data.message || 'Processing...',
              progress: data.progress || 0
            });

            // If there are logs, display them
            if (data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
              setLogs(data.logs);
            }

            // If completed or error, stop polling
            if (data.completed || data.error) {
              clearInterval(progressPollInterval);
              if (data.error) {
                setError(data.error);
                setProgress({ stage: 'error', message: data.error, progress: 0 });
                setLoading(false);
              } else {
                setProgress({ stage: 'complete', message: 'Import completed successfully!', progress: 100 });
                setLoading(false);
              }
            }
          }
        } else {
          console.error('[UI] Progress API error:', response.status, response.statusText);
        }
      } catch (err) {
        console.error('[UI] Failed to fetch progress:', err);
      }
    }, 500); // Poll every 500ms for more responsive updates

    // Store interval ref for cleanup
    progressIntervalRef.current = progressPollInterval as any;

    setProgress({ stage: 'initializing', message: 'Starting import...', progress: 0 });

    try {
      // Start the import (this is async and will run in the background)
      const importPromise = importListing(formData);

      // Wait for import to complete (or error)
      await importPromise;

      // Clear polling interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Final progress check
      const finalResponse = await fetch(`/api/import-progress?propertyId=${propertyId}`);
      if (finalResponse.ok) {
        const finalData = await finalResponse.json();
        if (finalData.completed && !finalData.error) {
          setProgress({ stage: 'complete', message: 'Import completed successfully!', progress: 100 });
          // Small delay to show completion before redirect
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (e: any) {
      // Clear polling interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Check if this is a redirect (expected behavior)
      if (e?.digest && typeof e.digest === 'string' && e.digest.includes('NEXT_REDIRECT')) {
        // This is a redirect, not an error - import succeeded
        setProgress({ stage: 'complete', message: 'Import completed successfully!', progress: 100 });
        return;
      }

      console.error('Import error:', e);

      // Extract error message
      let errorMessage = "Failed to import. ";

      if (e?.message) {
        errorMessage += e.message;
      } else if (e?.error) {
        errorMessage += e.error;
      } else if (typeof e === 'string') {
        errorMessage += e;
      } else {
        errorMessage += "Check the URL or try again. See Vercel logs for details.";
      }

      // Add helpful hints based on error type
      if (errorMessage.includes('BLOB') || errorMessage.includes('storage') || errorMessage.includes('ENOENT')) {
        errorMessage += "\n\n💡 Tip: Ensure BLOB_READ_WRITE_TOKEN is set in Vercel environment variables.";
      } else if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
        errorMessage += "\n\n💡 Tip: The request timed out. Try again or provide a gallery URL to speed up the process.";
      }

      setError(errorMessage);
      setProgress({ stage: 'error', message: errorMessage.split('\n')[0], progress: 0 });
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
            We will extract the title, description, images, and other details from the listing. You can edit these later.
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
            Optional: If you want to specify a specific gallery page, paste the gallery URL here.
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
          <div style={{
            padding: '1rem',
            background: '#fee',
            color: '#c00',
            borderRadius: '8px',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6'
          }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #fcc', fontSize: '0.8rem' }}>
              <strong>How to see full error details:</strong>
              <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                <li>Go to Vercel Dashboard → Your Project → Deployments</li>
                <li>Click the latest deployment → Functions tab</li>
                <li>Click on the function with errors</li>
                <li>Scroll to Logs section</li>
                <li>Look for entries prefixed with <code>[IMPORT]</code></li>
              </ol>
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#800' }}>
                See VERCEL_TROUBLESHOOTING.md for more help.
              </p>
            </div>

            {/* Logs Display */}
            {logs.length > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'var(--surface)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                maxHeight: '200px',
                overflowY: 'auto',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--muted)' }}>
                  Progress Logs:
                </div>
                {logs.slice(-20).map((log, idx) => (
                  <div key={idx} style={{
                    marginBottom: '0.25rem',
                    color: 'var(--muted)',
                    padding: '0.25rem 0',
                    borderBottom: idx < logs.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {' '}
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Importing...' : 'Import Room'}
        </button>
      </form>
    </div>
  );
}
