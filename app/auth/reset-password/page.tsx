'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword, verifyResetToken } from '@/app/actions/password-reset';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        async function checkToken() {
            if (token) {
                const result = await verifyResetToken(token);
                setTokenValid(result.valid);
                if (result.email) {
                    setUserEmail(result.email);
                }
            } else {
                setTokenValid(false);
            }
        }
        checkToken();
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (!token) {
            setError('Invalid reset token');
            return;
        }

        setLoading(true);
        const result = await resetPassword(token, password);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else if (result.success) {
            setSuccess(true);
            // Redirect to sign in after 2 seconds
            setTimeout(() => {
                router.push('/auth/signin');
            }, 2000);
        }
    }

    if (tokenValid === null) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'var(--surface)' 
            }}>
                <div style={{ 
                    width: '100%', 
                    maxWidth: '400px', 
                    padding: '2rem', 
                    background: 'white', 
                    borderRadius: '12px', 
                    boxShadow: 'var(--shadow-md)',
                    textAlign: 'center'
                }}>
                    <p>Verifying reset token...</p>
                </div>
            </div>
        );
    }

    if (tokenValid === false) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'var(--surface)' 
            }}>
                <div style={{ 
                    width: '100%', 
                    maxWidth: '400px', 
                    padding: '2rem', 
                    background: 'white', 
                    borderRadius: '12px', 
                    boxShadow: 'var(--shadow-md)' 
                }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', textAlign: 'center' }}>
                        Invalid Reset Link
                    </h1>
                    <div style={{ 
                        padding: '1rem', 
                        background: '#fff3cd', 
                        border: '2px solid #ffc107', 
                        borderRadius: '8px', 
                        marginBottom: '1.5rem' 
                    }}>
                        <p style={{ color: '#856404', marginBottom: '0.5rem' }}>
                            This password reset link is invalid or has expired.
                        </p>
                        <p style={{ color: '#856404', fontSize: '0.9rem' }}>
                            Please request a new password reset link.
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Link 
                            href="/auth/forgot-password" 
                            className="btn btn-primary"
                            style={{ 
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                background: '#667eea',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: 500,
                                marginRight: '0.5rem'
                            }}
                        >
                            Request New Link
                        </Link>
                        <Link 
                            href="/auth/signin" 
                            style={{ 
                                color: '#667eea', 
                                textDecoration: 'none', 
                                fontSize: '0.875rem' 
                            }}
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'var(--surface)' 
            }}>
                <div style={{ 
                    width: '100%', 
                    maxWidth: '400px', 
                    padding: '2rem', 
                    background: 'white', 
                    borderRadius: '12px', 
                    boxShadow: 'var(--shadow-md)' 
                }}>
                    <div style={{ 
                        padding: '1rem', 
                        background: '#d4edda', 
                        border: '2px solid #28a745', 
                        borderRadius: '8px', 
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                        <p style={{ color: '#155724', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Password Reset Successful!
                        </p>
                        <p style={{ color: '#155724', fontSize: '0.9rem' }}>
                            Your password has been reset. Redirecting to sign in...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'var(--surface)' 
        }}>
            <div style={{ 
                width: '100%', 
                maxWidth: '400px', 
                padding: '2rem', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: 'var(--shadow-md)' 
            }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                    Reset Password
                </h1>
                {userEmail && (
                    <p style={{ 
                        color: 'var(--muted)', 
                        marginBottom: '1rem', 
                        textAlign: 'center', 
                        fontSize: '0.875rem' 
                    }}>
                        Resetting password for: {userEmail}
                    </p>
                )}
                <p style={{ 
                    color: 'var(--muted)', 
                    marginBottom: '2rem', 
                    textAlign: 'center', 
                    fontSize: '0.875rem' 
                }}>
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            New Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border)', 
                                fontSize: '1rem' 
                            }}
                            placeholder="Minimum 6 characters"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border)', 
                                fontSize: '1rem' 
                            }}
                            placeholder="Re-enter your password"
                        />
                    </div>

                    {error && (
                        <div style={{ 
                            padding: '0.75rem', 
                            background: '#fee', 
                            color: '#c00', 
                            borderRadius: '8px', 
                            fontSize: '0.875rem' 
                        }}>
                            {error}
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
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link 
                            href="/auth/signin" 
                            style={{ 
                                color: '#667eea', 
                                textDecoration: 'none', 
                                fontSize: '0.875rem' 
                            }}
                        >
                            ← Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'var(--surface)' 
            }}>
                <div style={{ 
                    width: '100%', 
                    maxWidth: '400px', 
                    padding: '2rem', 
                    background: 'white', 
                    borderRadius: '12px', 
                    boxShadow: 'var(--shadow-md)',
                    textAlign: 'center'
                }}>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}

