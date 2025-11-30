'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/actions/password-reset';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetUrl, setResetUrl] = useState<string | undefined>();
    const [successMessage, setSuccessMessage] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        setSuccess(false);
        setResetUrl(undefined);

        const result = await requestPasswordReset(email);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else if (result.success) {
            setSuccess(true);
            setSuccessMessage(result.message || 'Password reset link sent!');
            setResetUrl(result.resetUrl);
            setLoading(false);
        }
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
                <p style={{ 
                    color: 'var(--muted)', 
                    marginBottom: '2rem', 
                    textAlign: 'center', 
                    fontSize: '0.875rem' 
                }}>
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {!success ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--border)', 
                                    fontSize: '1rem' 
                                }}
                                placeholder="your@email.com"
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
                            {loading ? 'Sending...' : 'Send Reset Link'}
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
                ) : (
                    <div>
                        <div style={{ 
                            padding: '1rem', 
                            background: '#d4edda', 
                            border: '2px solid #28a745', 
                            borderRadius: '8px', 
                            marginBottom: '1.5rem' 
                        }}>
                            <p style={{ color: '#155724', marginBottom: '0.5rem', fontWeight: 500 }}>
                                {successMessage}
                            </p>
                            {resetUrl && (
                                <p style={{ color: '#155724', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    In development mode, use the link below to reset your password.
                                </p>
                            )}
                            {!resetUrl && (
                                <p style={{ color: '#155724', fontSize: '0.9rem' }}>
                                    Please check your email for the password reset link. The link will expire in 1 hour.
                                </p>
                            )}
                            {resetUrl && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fff', borderRadius: '6px' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                                        Development mode - Reset link:
                                    </p>
                                    <a 
                                        href={resetUrl} 
                                        style={{ 
                                            color: '#667eea', 
                                            wordBreak: 'break-all', 
                                            fontSize: '0.85rem' 
                                        }}
                                    >
                                        {resetUrl}
                                    </a>
                                </div>
                            )}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <Link 
                                href="/auth/signin" 
                                className="btn btn-primary"
                                style={{ 
                                    display: 'inline-block',
                                    padding: '0.75rem 1.5rem',
                                    background: '#667eea',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 500
                                }}
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

