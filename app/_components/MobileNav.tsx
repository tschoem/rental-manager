'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MobileNavProps {
  singlePropertyMode: boolean;
  propertyId: string | null;
  showAboutPage: boolean;
}

export default function MobileNav({ singlePropertyMode, propertyId, showAboutPage }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
        ) : (
          <Link href="/#properties" style={{ fontWeight: 500 }}>
            Properties
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
        ) : (
          <Link href="/#properties" style={{ fontWeight: 500 }}>
            Properties
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

