import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import SiteSettingsEditor from "./_components/SiteSettingsEditor";

export const dynamic = 'force-dynamic';

// Get or create site settings
async function getOrCreateSiteSettings() {
    let settings = await prisma.siteSettings.findFirst();
    
    if (!settings) {
        settings = await prisma.siteSettings.create({
            data: {
                singlePropertyMode: false,
                siteUrl: null,
                siteIcon: "🏠",
                siteName: "Rental Manager",
                seoDescription: null,
                seoKeywords: null,
                seoAuthor: null,
                currency: "EUR",
                currencySymbol: "€"
            }
        });
    }
    
    return settings;
}

export default async function SiteSettingsPage() {
    await requireAuth("/admin/settings");

    const settings = await getOrCreateSiteSettings();

    return (
        <div className="admin-content">
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin" style={{ color: 'var(--muted)' }}>← Back to Dashboard</Link>
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Site Configuration</h1>

            <SiteSettingsEditor settings={settings} />
        </div>
    );
}

