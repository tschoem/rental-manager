'use client';

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut({ 
            callbackUrl: '/',
            redirect: true 
        });
    };

    return (
        <button
            onClick={handleSignOut}
            style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'var(--text-muted)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'background 0.2s ease',
                width: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--text-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--text-muted)'}
        >
            Sign Out
        </button>
    );
}

