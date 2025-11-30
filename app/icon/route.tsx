import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    const settings = await prisma.siteSettings.findFirst();
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

