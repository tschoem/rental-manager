/**
 * Storage abstraction layer
 * - Production (Vercel): Uses Vercel Blob Storage
 * - Development: Uses local filesystem (public folder)
 */

import { put, del, head } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

const isVercel = !!(process.env.VERCEL || process.env.VERCEL_URL);
const BLOB_STORE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Upload a file to storage
 * @param buffer - File buffer
 * @param filename - Filename with extension
 * @param folder - Folder path (e.g., 'home-hero-images', 'property-images')
 * @returns Public URL to access the file
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  folder: string
): Promise<string> {
  if (isVercel && BLOB_STORE_TOKEN) {
    // Use Vercel Blob Storage
    const blobPath = `${folder}/${filename}`;
    const blob = await put(blobPath, buffer, {
      access: 'public',
      token: BLOB_STORE_TOKEN,
    });
    return blob.url;
  } else {
    // Use local filesystem (development)
    const publicDir = path.join(process.cwd(), 'public', folder);
    const filePath = path.join(publicDir, filename);

    // Ensure directory exists
    await fs.mkdir(publicDir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    // Return the public URL path
    return `/${folder}/${filename}`;
  }
}

/**
 * Delete a file from storage
 * @param url - Public URL of the file to delete
 */
export async function deleteFile(url: string): Promise<void> {
  if (isVercel && BLOB_STORE_TOKEN && url.startsWith('https://')) {
    // Extract blob URL from Vercel Blob
    try {
      await del(url, { token: BLOB_STORE_TOKEN });
    } catch (error) {
      console.error('Error deleting blob:', error);
      // Don't throw - file might not exist
    }
  } else if (url.startsWith('/')) {
    // Local filesystem path
    try {
      const filePath = path.join(process.cwd(), 'public', url);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting local file:', error);
      // Don't throw - file might not exist
    }
  }
}

/**
 * Check if a file exists
 * @param url - Public URL of the file
 */
export async function fileExists(url: string): Promise<boolean> {
  if (isVercel && BLOB_STORE_TOKEN && url.startsWith('https://')) {
    try {
      await head(url, { token: BLOB_STORE_TOKEN });
      return true;
    } catch {
      return false;
    }
  } else if (url.startsWith('/')) {
    try {
      const filePath = path.join(process.cwd(), 'public', url);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Move a file from one location to another
 * @param oldUrl - Current file URL
 * @param newFolder - New folder path
 * @param newFilename - New filename
 * @returns New public URL
 */
export async function moveFile(
  oldUrl: string,
  newFolder: string,
  newFilename: string
): Promise<string> {
  // Read the old file
  let buffer: Buffer;
  
  if (isVercel && BLOB_STORE_TOKEN && oldUrl.startsWith('https://')) {
    // Download from Blob
    const response = await fetch(oldUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else if (oldUrl.startsWith('/')) {
    // Read from local filesystem
    const oldPath = path.join(process.cwd(), 'public', oldUrl);
    buffer = await fs.readFile(oldPath);
  } else {
    throw new Error(`Invalid URL format: ${oldUrl}`);
  }

  // Upload to new location
  const newUrl = await uploadFile(buffer, newFilename, newFolder);

  // Delete old file
  await deleteFile(oldUrl);

  return newUrl;
}

