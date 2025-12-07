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
  console.log(`[STORAGE] Uploading file: ${folder}/${filename} (${buffer.length} bytes)`);
  console.log(`[STORAGE] Environment: isVercel=${isVercel}, hasToken=${!!BLOB_STORE_TOKEN}`);

  // Use Vercel Blob Storage if token is available (works both locally and on Vercel)
  if (BLOB_STORE_TOKEN) {
    try {
      const blobPath = `${folder}/${filename}`;
      const location = isVercel ? 'Vercel' : 'local machine';
      console.log(`[STORAGE] Uploading to Vercel Blob from ${location}: ${blobPath}`);
      const blob = await put(blobPath, buffer, {
        access: 'public',
        token: BLOB_STORE_TOKEN,
      });
      console.log(`[STORAGE] Successfully uploaded to Blob. URL: ${blob.url}`);
      return blob.url;
    } catch (error) {
      console.error(`[STORAGE] Failed to upload to Vercel Blob:`, error);
      throw new Error(`Vercel Blob upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else if (isVercel) {
    // On Vercel but no token - this is an error
    console.error(`[STORAGE] ERROR: Running on Vercel but BLOB_READ_WRITE_TOKEN is not set!`);
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required on Vercel. Please set it in your Vercel project settings.');
  } else {
    // Use local filesystem (development)
    try {
      const publicDir = path.join(process.cwd(), 'public', folder);
      const filePath = path.join(publicDir, filename);

      console.log(`[STORAGE] Saving to local filesystem: ${filePath}`);

      // Ensure directory exists
      await fs.mkdir(publicDir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, buffer);

      const publicUrl = `/${folder}/${filename}`;
      console.log(`[STORAGE] Successfully saved to local filesystem. URL: ${publicUrl}`);

      // Return the public URL path
      return publicUrl;
    } catch (error) {
      console.error(`[STORAGE] Failed to save to local filesystem:`, error);
      throw new Error(`Local filesystem save failed: ${error instanceof Error ? error.message : String(error)}`);
    }
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
  if (BLOB_STORE_TOKEN && url.startsWith('https://')) {
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

  if (BLOB_STORE_TOKEN && oldUrl.startsWith('https://')) {
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


