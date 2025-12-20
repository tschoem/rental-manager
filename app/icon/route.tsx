import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    const settings = await prisma.siteSettings.findFirst();
    const iconType = settings?.siteIconType || 'emoji';

    if (iconType === 'image' && settings?.siteIconImageUrl) {
        // For image icons, fetch and return the exact same image
        try {
            const imageResponse = await fetch(settings.siteIconImageUrl);
            if (imageResponse.ok) {
                const contentType = imageResponse.headers.get('content-type') || 'image/png';
                const imageBuffer = await imageResponse.arrayBuffer();
                
                // Return the image directly to preserve transparency and ensure it's the exact same image
                return new NextResponse(imageBuffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=3600, must-revalidate',
                    },
                });
            }
        } catch (error) {
            console.error('Failed to fetch icon image:', error);
            // Fall through to emoji/default
        }
    }

    // Default to emoji (either explicitly emoji type or fallback)
    const emoji = settings?.siteIcon || '🏠';

    // Create an SVG favicon with the emoji
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <text x="50" y="75" font-size="70" text-anchor="middle" dominant-baseline="central">${emoji}</text>
        </svg>
    `.trim();

    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
    });
}

