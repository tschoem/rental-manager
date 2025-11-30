'use client';

import { useState } from 'react';
import { createAdminUser } from '@/app/actions/setup-admin';
import { useRouter } from 'next/navigation';

export default function AdminSetupForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('name', name || 'Admin User');

        const result = await createAdminUser(formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setSuccess(true);
            // Refresh the page after a short delay to update setup status
            // Then redirect to signin page so user can log in
            setTimeout(() => {
                window.location.href = '/auth/signin';
            }, 2000);
        }
    }

    if (success) {
        return (
            <div style={{
                padding: '2rem',
                background: '#d4edda',
                border: '2px solid #28a745',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ color: '#155724', marginBottom: '0.5rem' }}>Admin User Created!</h3>
                <p style={{ color: '#155724' }}>Redirecting to sign in page...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{
            padding: '1.5rem',
            background: '#f7fafc',
            borderRadius: '8px',
            border: '2px solid #e2e8f0'
        }}>
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '1rem'
            }}>
                Create Admin User
            </h3>

            {error && (
                <div style={{
                    padding: '0.75rem',
                    background: '#fee',
                    color: '#c00',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#4a5568'
                }}>
                    Email *
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #cbd5e0',
                        borderRadius: '6px',
                        fontSize: '1rem'
                    }}
                    placeholder="admin@example.com"
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#4a5568'
                }}>
                    Password *
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #cbd5e0',
                        borderRadius: '6px',
                        fontSize: '1rem'
                    }}
                    placeholder="Minimum 6 characters"
                />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#4a5568'
                }}>
                    Name (optional)
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #cbd5e0',
                        borderRadius: '6px',
                        fontSize: '1rem'
                    }}
                    placeholder="Admin User"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: loading ? '#a0aec0' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                }}
            >
                {loading ? 'Creating...' : 'Create Admin User'}
            </button>
        </form>
    );
}

