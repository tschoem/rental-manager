'use client'

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function SignInForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [dbError, setDbError] = useState(false)
    const [signInFn, setSignInFn] = useState<any>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Dynamically import signIn to avoid "Invalid URL" errors during SSR
    useEffect(() => {
        if (typeof window !== 'undefined') {
            import("next-auth/react").then((mod) => {
                setSignInFn(() => mod.signIn);
            }).catch((error) => {
                console.error('Failed to load signIn:', error);
            });
        }
    }, [])
    
    // Check for error in URL params (from redirects)
    // Only set error from URL params on initial mount, not when error state changes
    const [hasReadUrlError, setHasReadUrlError] = useState(false);
    useEffect(() => {
        // Only read error from URL once on mount, or if searchParams change but we haven't read it yet
        if (!hasReadUrlError) {
            const errorParam = searchParams.get('error');
            if (errorParam) {
                if (errorParam.includes('Database') || errorParam.includes('setup') || errorParam.includes('not configured')) {
                    setError("Database not configured. Please complete setup first.");
                    setDbError(true);
                } else {
                    setError("Invalid credentials");
                }
                setHasReadUrlError(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]) // Only depend on searchParams, not error, to avoid clearing user-set errors
    
    // Check if database is configured on mount
    useEffect(() => {
        async function checkDatabase() {
            try {
                // Try to fetch session - if this fails with a database error, show setup message
                const response = await fetch('/api/auth/session');
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    if (data.error && (data.error.includes('Database') || data.error.includes('setup'))) {
                        setDbError(true);
                    }
                }
            } catch (err) {
                // If fetch fails, might be database issue
                setDbError(true);
            }
        }
        checkDatabase();
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        setLoading(true)
        
        if (!signInFn) {
            setError("Authentication service is loading. Please try again in a moment.");
            setLoading(false)
            return;
        }

        try {
            // Get callbackUrl from URL params or default to /admin
            const callbackUrl = searchParams.get('callbackUrl') || '/admin';
            
            const result = await signInFn("credentials", {
                email,
                password,
                callbackUrl: callbackUrl,
                redirect: false, // Don't redirect automatically so we can handle errors
            })

            // Handle different result scenarios
            if (!result) {
                // Check if this might be a database configuration issue
                // Try to fetch providers to see if we get a database error
                try {
                    const providersResponse = await fetch('/api/auth/providers');
                    if (!providersResponse.ok) {
                        const errorData = await providersResponse.json().catch(() => ({}));
                        if (errorData.error && (errorData.error.includes('Database') || errorData.error.includes('setup'))) {
                            setError("Database not configured. Please complete setup first.")
                        } else {
                            setError("Authentication service unavailable. Please check your setup.")
                        }
                    } else {
                        setError("No response from server. Please try again.")
                    }
                } catch (fetchErr) {
                    setError("Unable to connect to authentication service. Please check your setup.")
                }
                setLoading(false)
            } else if (result.error) {
                // Check if it's a database configuration error
                if (result.error.includes('Database') || result.error.includes('setup') || result.error.includes('not configured')) {
                    setError("Database not configured. Please complete setup first.")
                } else if (result.error === 'CredentialsSignin' || result.error.includes('CredentialsSignin')) {
                    // NextAuth's default error for invalid credentials
                    setError("Invalid email or password. Please check your credentials and try again.")
                } else {
                    setError(result.error || "Invalid email or password. Please try again.")
                }
                setLoading(false)
            } else if (result.ok) {
                // Success - redirect to callback URL or admin page
                // Use window.location for a full page navigation to ensure session is recognized
                const redirectUrl = searchParams.get('callbackUrl') || '/admin';
                window.location.href = redirectUrl;
                // Don't set loading to false here since we're redirecting
            } else {
                // Unexpected result format
                setError("Invalid response from server. Please try again.")
                setLoading(false)
            }
        } catch (err: any) {
            // Handle network errors or other issues
            console.error('Sign-in error:', err);
            if (err?.message?.includes('Database') || err?.message?.includes('setup')) {
                setError("Database not configured. Please complete setup first.")
            } else if (err?.message) {
                setError(err.message)
            } else {
                setError("An error occurred. Please check your connection and try again.")
            }
            setLoading(false)
        }
    }

    // If database error, show setup message
    if (dbError) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
                <div style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', textAlign: 'center' }}>Setup Required</h1>
                    <div style={{ padding: '1rem', background: '#fff3cd', border: '2px solid #ffc107', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        <p style={{ color: '#856404', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Database not configured
                        </p>
                        <p style={{ color: '#856404', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Please complete the setup process before signing in.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Go to Setup Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>Admin Login</h1>
                <p style={{ color: 'var(--muted)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    Sign in to access the admin panel
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                // Don't clear error on input change - let it persist
                            }}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                // Don't clear error on input change - let it persist
                            }}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    {error && (
                        <div>
                            <div 
                                role="alert"
                                style={{ 
                                    padding: '0.75rem', 
                                    background: '#fee', 
                                    color: '#c00', 
                                    borderRadius: '8px', 
                                    fontSize: '0.875rem',
                                    marginBottom: '0.5rem',
                                    border: '1px solid #fcc'
                                }}
                            >
                                {error}
                            </div>
                            {/* Show "Lost password?" link only for credential errors, not database errors */}
                            {error.includes('Invalid email or password') || 
                             error.includes('Invalid credentials') ||
                             (error.includes('CredentialsSignin') && !error.includes('Database')) ? (
                                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                                    <Link
                                        href="/auth/forgot-password"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#667eea',
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            padding: '0.25rem 0.5rem',
                                            display: 'inline-block'
                                        }}
                                    >
                                        Lost password?
                                    </Link>
                                </div>
                            ) : null}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={loading}
                        style={{ 
                            width: '100%', 
                            marginTop: '0.5rem',
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
                <div style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <SignInForm />
        </Suspense>
    )
}
