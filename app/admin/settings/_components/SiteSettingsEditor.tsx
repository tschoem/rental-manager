'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSiteSettings } from '../actions';

interface SiteSettings {
    id: string;
    singlePropertyMode: boolean;
    siteUrl: string | null;
    siteIcon: string | null;
    siteName: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    seoAuthor: string | null;
    currency: string | null;
    currencySymbol: string | null;
}

interface SiteSettingsEditorProps {
    settings: SiteSettings;
}

export default function SiteSettingsEditor({ settings }: SiteSettingsEditorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        startTransition(async () => {
            try {
                await updateSiteSettings(formData);
                router.refresh();
            } catch (error) {
                alert('Failed to update site settings');
            }
        });
    };

    // Common currency options
    const currencies = [
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
        { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
        { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
        { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    ];

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCurrency = currencies.find(c => c.code === e.target.value);
        if (selectedCurrency) {
            // Update the currency symbol field
            const symbolInput = document.getElementById('currencySymbol') as HTMLInputElement;
            if (symbolInput) {
                symbolInput.value = selectedCurrency.symbol;
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Basic Site Information */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Basic Site Information</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} key={`basic-${settings.id}`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="siteUrl" style={{ fontWeight: 500 }}>Site URL</label>
                        <input
                            type="url"
                            id="siteUrl"
                            name="siteUrl"
                            key={`siteUrl-${settings.siteUrl || ''}`}
                            defaultValue={settings.siteUrl || ''}
                            placeholder="https://example.com"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                            The full URL of your website (used for SEO and social sharing)
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="siteIcon" style={{ fontWeight: 500 }}>Site Icon (Emoji)</label>
                        <input
                            type="text"
                            id="siteIcon"
                            name="siteIcon"
                            key={`siteIcon-${settings.siteIcon || ''}`}
                            defaultValue={settings.siteIcon || '🏠'}
                            placeholder="🏠"
                            maxLength={2}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1.5rem', textAlign: 'center', width: '80px' }}
                        />
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                            An emoji icon displayed in the header next to the site name
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="siteName" style={{ fontWeight: 500 }}>Site Name</label>
                        <input
                            type="text"
                            id="siteName"
                            name="siteName"
                            key={`siteName-${settings.siteName || ''}`}
                            defaultValue={settings.siteName || 'Rental Manager'}
                            placeholder="Rental Manager"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                            The name displayed in the header and browser tab
                        </p>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Basic Settings'}
                    </button>
                </form>
            </div>

            {/* SEO Settings */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>SEO Settings</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} key={`seo-${settings.id}`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="seoDescription" style={{ fontWeight: 500 }}>Meta Description</label>
                        <textarea
                            id="seoDescription"
                            name="seoDescription"
                            key={`seoDescription-${settings.seoDescription || ''}`}
                            defaultValue={settings.seoDescription || ''}
                            rows={3}
                            placeholder="A brief description of your site for search engines"
                            maxLength={160}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', fontFamily: 'inherit', lineHeight: 1.6 }}
                        />
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                            Recommended: 150-160 characters. This appears in search engine results.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="seoKeywords" style={{ fontWeight: 500 }}>Meta Keywords</label>
                        <input
                            type="text"
                            id="seoKeywords"
                            name="seoKeywords"
                            key={`seoKeywords-${settings.seoKeywords || ''}`}
                            defaultValue={settings.seoKeywords || ''}
                            placeholder="rental, property, accommodation, booking"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                            Comma-separated keywords relevant to your site
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="seoAuthor" style={{ fontWeight: 500 }}>Site Author</label>
                        <input
                            type="text"
                            id="seoAuthor"
                            name="seoAuthor"
                            key={`seoAuthor-${settings.seoAuthor || ''}`}
                            defaultValue={settings.seoAuthor || ''}
                            placeholder="Your Name or Company"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save SEO Settings'}
                    </button>
                </form>
            </div>

            {/* Currency Settings */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Currency Settings</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} key={`currency-${settings.id}`}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label htmlFor="currency" style={{ fontWeight: 500 }}>Currency Code</label>
                            <select
                                id="currency"
                                name="currency"
                                key={`currency-${settings.currency || ''}`}
                                defaultValue={settings.currency || 'EUR'}
                                onChange={handleCurrencyChange}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                            >
                                {currencies.map((curr) => (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.code} - {curr.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label htmlFor="currencySymbol" style={{ fontWeight: 500 }}>Currency Symbol</label>
                            <input
                                type="text"
                                id="currencySymbol"
                                name="currencySymbol"
                                key={`currencySymbol-${settings.currencySymbol || ''}`}
                                defaultValue={settings.currencySymbol || '€'}
                                placeholder="€"
                                maxLength={5}
                                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem' }}
                            />
                            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                                Symbol used to display prices (e.g., €, $, £)
                            </p>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Currency Settings'}
                    </button>
                </form>
            </div>

            {/* Site Mode */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Site Mode</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} key={`mode-${settings.id}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="singlePropertyMode"
                            name="singlePropertyMode"
                            key={`singlePropertyMode-${settings.singlePropertyMode}`}
                            defaultChecked={settings.singlePropertyMode}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="singlePropertyMode" style={{ fontWeight: 500, cursor: 'pointer' }}>
                            Single Property Mode
                        </label>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                        When enabled, the site displays rooms directly instead of properties. Useful for single-property rentals.
                    </p>

                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Site Mode'}
                    </button>
                </form>
            </div>
        </div>
    );
}

