'use client';

import { useState, useEffect } from 'react';

interface PhotoGalleryProps {
  images: string[];
}

export default function PhotoGallery({ images }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [thumbnailStart, setThumbnailStart] = useState(0);

  if (images.length === 0) return null;

  const mainImage = images[selectedIndex];
  const maxThumbnails = 5;
  const thumbnails = images.slice(thumbnailStart, thumbnailStart + maxThumbnails);

  // Update thumbnail start when selected index changes
  useEffect(() => {
    if (selectedIndex < thumbnailStart) {
      setThumbnailStart(Math.max(0, selectedIndex));
    } else if (selectedIndex >= thumbnailStart + maxThumbnails) {
      setThumbnailStart(Math.min(images.length - maxThumbnails, selectedIndex - maxThumbnails + 1));
    }
  }, [selectedIndex, thumbnailStart, images.length, maxThumbnails]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        {/* Main Image */}
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 'var(--image-radius, 12px)',
            overflow: 'hidden',
            cursor: 'pointer',
            background: 'var(--surface)',
            position: 'relative'
          }}
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={mainImage}
            alt={`Room image ${selectedIndex + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
          />
          {images.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
            position: 'relative'
          }}>
            {thumbnailStart > 0 && (
              <button
                onClick={() => setThumbnailStart(Math.max(0, thumbnailStart - maxThumbnails))}
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                title="Previous thumbnails"
              >
                ‹
              </button>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${thumbnails.length}, 1fr)`,
              gap: '0.5rem',
              flex: 1,
              minWidth: 0
            }}>
              {thumbnails.map((img, idx) => {
                const actualIndex = thumbnailStart + idx;
                return (
                  <div
                    key={actualIndex}
                    onClick={() => setSelectedIndex(actualIndex)}
                    style={{
                      aspectRatio: '16/9',
                      borderRadius: 'var(--image-radius, 12px)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedIndex === actualIndex ? '3px solid var(--primary)' : '3px solid transparent',
                      opacity: selectedIndex === actualIndex ? 1 : 0.7,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${actualIndex + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                );
              })}
            </div>
            {thumbnailStart + maxThumbnails < images.length && (
              <button
                onClick={() => setThumbnailStart(Math.min(images.length - maxThumbnails, thumbnailStart + maxThumbnails))}
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                title="Next thumbnails"
              >
                ›
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={images[selectedIndex]}
              alt={`Room image ${selectedIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  style={{
                    position: 'absolute',
                    left: '-4rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((prev) => (prev + 1) % images.length);
                  }}
                  style={{
                    position: 'absolute',
                    right: '-4rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ›
                </button>
                <div style={{
                  position: 'absolute',
                  bottom: '-3rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'white',
                  fontSize: '0.875rem'
                }}>
                  {selectedIndex + 1} / {images.length}
                </div>
              </>
            )}
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                position: 'absolute',
                top: '-3rem',
                right: 0,
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.5rem',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}

