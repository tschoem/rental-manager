import { uploadFile } from './storage';

/**
 * Downloads an image from a URL and saves it to storage (Vercel Blob or local filesystem)
 * Returns the public URL path to the saved image
 * @param imageUrl - The URL of the image to download
 * @param folder - The folder name where to store the image (default: 'owner-images')
 */
export async function downloadAndStoreImage(imageUrl: string, folder: string = 'owner-images'): Promise<string> {
    try {
        // Fetch the image
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine file extension from URL or content type
        const contentType = response.headers.get('content-type') || '';
        let extension = 'jpg';
        
        if (contentType.includes('png')) {
            extension = 'png';
        } else if (contentType.includes('gif')) {
            extension = 'gif';
        } else if (contentType.includes('webp')) {
            extension = 'webp';
        } else {
            // Try to get extension from URL
            const urlExtension = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
            if (urlExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(urlExtension)) {
                extension = urlExtension === 'jpeg' ? 'jpg' : urlExtension;
            }
        }

        // Create a unique filename
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

        // Upload using storage abstraction (Vercel Blob or local filesystem)
        const url = await uploadFile(buffer, filename, folder);

        // Return the public URL
        return url;
    } catch (error) {
        console.error('Error downloading image:', error);
        // If download fails, return the original URL
        return imageUrl;
    }
}

