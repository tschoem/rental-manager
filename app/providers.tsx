'use client'

import { useEffect, useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
    const [SessionProvider, setSessionProvider] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Dynamically import SessionProvider only on client side after mount
        // This prevents module evaluation errors during SSR
        if (typeof window !== 'undefined') {
            import("next-auth/react")
                .then((mod) => {
                    setSessionProvider(() => mod.SessionProvider);
                })
                .catch((error) => {
                    console.warn('Failed to load NextAuth SessionProvider:', error);
                    // Continue without SessionProvider if it fails to load
                });
        }
    }, []);

    // During SSR or before mount, just render children
    if (!mounted || !SessionProvider) {
        return <>{children}</>;
    }

    // Get baseUrl from window location
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    return (
        <SessionProvider baseUrl={baseUrl}>
            {children}
        </SessionProvider>
    )
}
