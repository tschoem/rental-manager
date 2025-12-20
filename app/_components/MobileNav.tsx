'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface MobileNavProps {
  singlePropertyMode: boolean;
  propertyId: string | null;
  showAboutPage: boolean;
  properties: Array<{ id: string; name: string }>;
}

export default function MobileNav({ singlePropertyMode, propertyId, showAboutPage, properties }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Desktop dropdown starts closed (opens on hover), mobile starts closed (opens when menu opens)
  const [isPropertiesDropdownOpen, setIsPropertiesDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Close menu when switching from mobile to desktop
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu when clicking outside or on a link
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.mobile-nav') && !target.closest('.hamburger-button')) {
          setIsOpen(false);
        }
      };

      const handleLinkClick = () => {
        setIsOpen(false);
      };

      document.addEventListener('click', handleClickOutside);
      const links = document.querySelectorAll('.mobile-nav a');
      links.forEach(link => link.addEventListener('click', handleLinkClick));

      return () => {
        document.removeEventListener('click', handleClickOutside);
        links.forEach(link => link.removeEventListener('click', handleLinkClick));
      };
    }
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Add class to body when menu is open to style site logo
  // Also open properties dropdown by default when mobile menu opens
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('mobile-menu-open');
      // Open properties dropdown by default when mobile menu opens (if there are properties)
      // This only affects mobile since desktop uses hover, not click
      if (properties.length > 0) {
        setIsPropertiesDropdownOpen(true);
      }
    } else {
      document.body.classList.remove('mobile-menu-open');
      // Close properties dropdown when mobile menu closes
      setIsPropertiesDropdownOpen(false);
    }
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isOpen, properties.length]);

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button
        className="hamburger-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
      </button>

      {/* Desktop Navigation - Hidden on mobile */}
      <nav className="desktop-nav">
        <Link href="/" style={{ fontWeight: 500 }}>
          Home
        </Link>
        {singlePropertyMode && propertyId ? (
          <Link href={`/properties/${propertyId}`} style={{ fontWeight: 500 }}>
            Rooms
          </Link>
        ) : properties.length > 0 ? (
          <div
            ref={dropdownRef}
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => {
              // Clear any pending close timeout
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
              setIsPropertiesDropdownOpen(true);
            }}
            onMouseLeave={() => {
              // Add a small delay before closing to allow navigation
              closeTimeoutRef.current = setTimeout(() => {
                setIsPropertiesDropdownOpen(false);
                closeTimeoutRef.current = null;
              }, 200); // 200ms delay
            }}
          >
            <Link
              href="/#properties"
              style={{
                fontWeight: 500,
                textDecoration: 'none',
                color: 'inherit',
                display: 'inline-block'
              }}
            >
              Properties
            </Link>
            {isPropertiesDropdownOpen && (
              <div
                onMouseEnter={() => {
                  // Clear any pending close timeout when entering dropdown
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  setIsPropertiesDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  // Add a small delay before closing when leaving dropdown
                  closeTimeoutRef.current = setTimeout(() => {
                    setIsPropertiesDropdownOpen(false);
                    closeTimeoutRef.current = null;
                  }, 200); // 200ms delay
                }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '0.25rem',
                  backgroundColor: 'white',
                  border: '1px solid var(--border, #e0e0e0)',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  minWidth: '300px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}
              >
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      fontWeight: 400,
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--off-white, #f5f5f5)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {property.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Link href="/#properties" style={{ fontWeight: 500 }}>
            PROPERTIES
          </Link>
        )}
        <Link href="/location" style={{ fontWeight: 500 }}>
          Location
        </Link>
        {showAboutPage && (
          <Link href="/about" style={{ fontWeight: 500 }}>
            About
          </Link>
        )}
        <Link
          href="/admin"
          className="owner-login-link"
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            opacity: 0.7,
            textDecoration: 'none',
            transition: 'opacity 0.2s ease'
          }}
        >
          Owner Login
        </Link>
      </nav>

      {/* Mobile Navigation Menu - Only visible when open on mobile */}
      <nav className={`mobile-nav ${isOpen ? 'open' : ''}`}>
        <Link href="/" style={{ fontWeight: 500 }}>
          Home
        </Link>
        {singlePropertyMode && propertyId ? (
          <Link href={`/properties/${propertyId}`} style={{ fontWeight: 500 }}>
            Rooms
          </Link>
        ) : properties.length > 0 ? (
          <div>
            <button
              onClick={() => setIsPropertiesDropdownOpen(!isPropertiesDropdownOpen)}
              className="mobile-nav-properties-button"
              style={{
                fontWeight: 500,
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit',
                fontSize: 'inherit',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.25rem'
              }}
              aria-expanded={isPropertiesDropdownOpen}
              aria-haspopup="true"
            >
              Properties
            </button>
            {isPropertiesDropdownOpen && (
              <div
                style={{
                  marginLeft: '1rem',
                  marginTop: '0.5rem',
                  borderLeft: '2px solid var(--border, #e0e0e0)',
                  paddingLeft: '1rem'
                }}
              >
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    onClick={() => {
                      setIsPropertiesDropdownOpen(false);
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'block',
                      padding: '0.5rem 0',
                      fontWeight: 400,
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    {property.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Link href="/#properties" style={{ fontWeight: 500 }}>
            PROPERTIES
          </Link>
        )}
        <Link href="/location" style={{ fontWeight: 500 }}>
          Location
        </Link>
        {showAboutPage && (
          <Link href="/about" style={{ fontWeight: 500 }}>
            About
          </Link>
        )}
        <Link
          href="/admin"
          className="owner-login-link"
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            opacity: 0.7,
            textDecoration: 'none',
            transition: 'opacity 0.2s ease'
          }}
        >
          Owner Login
        </Link>
      </nav>

      {/* Overlay - Only visible when menu is open on mobile */}
      {isOpen && <div className="mobile-nav-overlay" onClick={() => setIsOpen(false)}></div>}
    </>
  );
}

