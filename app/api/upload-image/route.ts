import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    if (!authOptions) {
        return NextResponse.json({ error: 'Authentication service unavailable. Database not configured.' }, { status: 503 });
    }
    
    const session = await getServerSession(authOptions as NonNullable<typeof authOptions>);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Check file size (2MB limit)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File size exceeds 2MB limit' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Determine file extension
        const contentType = file.type;
        let extension = 'jpg';
        if (contentType.includes('png')) {
            extension = 'png';
        } else if (contentType.includes('gif')) {
            extension = 'gif';
        } else if (contentType.includes('webp')) {
            extension = 'webp';
        }

        // Create unique filename
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
        const publicDir = path.join(process.cwd(), 'public', folder);
        const filePath = path.join(publicDir, filename);

        // Ensure directory exists
        await fs.mkdir(publicDir, { recursive: true });

        // Write file
        await fs.writeFile(filePath, buffer);

        // Return the public URL path
        return NextResponse.json({ url: `/${folder}/${filename}` });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}

