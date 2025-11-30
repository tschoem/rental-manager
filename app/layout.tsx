import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    try {
        const settings = await prisma.siteSettings.findFirst();
        
        return {
            title: settings?.siteName || "Rental Manager",
            description: settings?.seoDescription || "Manage your properties and bookings",
            keywords: settings?.seoKeywords ? settings.seoKeywords.split(',').map(k => k.trim()).filter(k => k) : undefined,
            authors: settings?.seoAuthor ? [{ name: settings.seoAuthor }] : undefined,
            icons: {
                icon: '/icon',
            },
            openGraph: {
                title: settings?.siteName || "Rental Manager",
                description: settings?.seoDescription || "Manage your properties and bookings",
                url: settings?.siteUrl || undefined,
                siteName: settings?.siteName || "Rental Manager",
            },
        };
    } catch (error) {
        return {
            title: "Rental Manager",
            description: "Manage your properties and bookings",
            icons: {
                icon: '/icon',
            },
        };
    }
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
