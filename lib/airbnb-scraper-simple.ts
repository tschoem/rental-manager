/**
 * Simplified Airbnb scraper using fetch + Cheerio
 * No browser automation needed - works reliably on Vercel
 * Extracts basic metadata from HTML meta tags and structured data
 */

import * as cheerio from 'cheerio';
import axios from 'axios';

export interface AirbnbListingData {
  title: string;
  description: string;
  price: number | null;
  capacity: number | null;
  amenities: string[];
  images: string[];
}

export type ProgressCallback = (stage: string, message: string, progress: number, log?: string) => void | Promise<void>;

/**
 * Extract basic data from Airbnb listing using server-side fetch
 * This is much more reliable than Puppeteer but extracts less data
 */
export async function scrapeAirbnbListingSimple(
  url: string,
  progressCallback?: ProgressCallback
): Promise<AirbnbListingData> {
  progressCallback?.('scraping', 'Fetching page HTML...', 20, 'Fetching page HTML...');

  try {
    // Fetch the HTML page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    progressCallback?.('scraping', 'Parsing HTML...', 40, 'Parsing HTML...');
    const $ = cheerio.load(response.data);

    // Debug: Log HTML size and script tag count
    console.log(`[SIMPLE-SCRAPER] HTML size: ${response.data.length} bytes`);
    console.log(`[SIMPLE-SCRAPER] Script tags found: ${$('script').length}`);

    // Check for __NEXT_DATA__ in raw HTML
    if (response.data.includes('__NEXT_DATA__')) {
      console.log(`[SIMPLE-SCRAPER] Found __NEXT_DATA__ in HTML`);
    } else {
      console.log(`[SIMPLE-SCRAPER] __NEXT_DATA__ NOT found in HTML`);
    }

    // Extract title
    let title = $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      $('h1').first().text() ||
      'Imported Room';

    title = title.trim().replace(/\s+/g, ' ');

    // Extract description
    let description = $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      'Imported from Airbnb';

    description = description.trim();

    // Try to extract from JSON-LD structured data
    const jsonLdScripts = $('script[type="application/ld+json"]');
    jsonLdScripts.each((_, elem) => {
      try {
        const json = JSON.parse($(elem).html() || '{}');
        if (json['@type'] === 'Product' || json['@type'] === 'LodgingBusiness' || json['@type'] === 'Place') {
          if (json.name && !title.includes('Airbnb')) {
            title = json.name;
          }
          if (json.description && json.description.length > description.length) {
            description = json.description;
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    progressCallback?.('scraping', 'Extracting images...', 60, 'Extracting images from gallery...');

    // Extract images - multiple strategies for comprehensive gallery import
    const images: string[] = [];
    const seenImages = new Set<string>();

    // Helper function to add image if valid
    const addImage = (imgUrl: string | null | undefined) => {
      if (!imgUrl) return;
      // Clean URL - remove query params and normalize
      const cleanUrl = imgUrl.split('?')[0].split('#')[0].trim();
      // Only add Airbnb image URLs (from their CDN)
      if (cleanUrl && 
          cleanUrl.length > 50 && 
          (cleanUrl.includes('airbnb') || cleanUrl.includes('muscache') || cleanUrl.includes('a0.muscache') || cleanUrl.includes('a1.muscache')) &&
          !cleanUrl.includes('icon') &&
          !cleanUrl.includes('logo') &&
          !cleanUrl.includes('avatar') &&
          !cleanUrl.includes('placeholder') &&
          !seenImages.has(cleanUrl)) {
        seenImages.add(cleanUrl);
        images.push(cleanUrl);
      }
    };

    // Strategy 1: From og:image meta tags
    $('meta[property="og:image"]').each((_, elem) => {
      addImage($(elem).attr('content'));
    });

    // Strategy 2: From JSON-LD structured data
    jsonLdScripts.each((_, elem) => {
      try {
        const json = JSON.parse($(elem).html() || '{}');
        if (json.image) {
          const imageUrls = Array.isArray(json.image) ? json.image : [json.image];
          imageUrls.forEach((imgUrl: any) => {
            if (typeof imgUrl === 'string') {
              addImage(imgUrl);
            } else if (imgUrl && typeof imgUrl === 'object' && imgUrl.url) {
              addImage(imgUrl.url);
            }
          });
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Strategy 3: Try to fetch the gallery page directly
    try {
      progressCallback?.('extracting-images', 'Fetching gallery page...', 65, 'Attempting to fetch gallery page...');
      const galleryUrl = url.endsWith('/') ? `${url}photos` : `${url}/photos`;
      console.log(`[SIMPLE-SCRAPER] Attempting to fetch gallery page: ${galleryUrl}`);
      
      const galleryResponse = await axios.get(galleryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000,
        maxRedirects: 3,
      });

      const $gallery = cheerio.load(galleryResponse.data);
      console.log(`[SIMPLE-SCRAPER] Gallery page fetched successfully, HTML length: ${galleryResponse.data.length}`);

      // Extract images from gallery page
      $gallery('img').each((_, elem) => {
        const src = $gallery(elem).attr('src') || $gallery(elem).attr('data-src') || $gallery(elem).attr('data-lazy-src');
        addImage(src);
      });

      // Extract from meta tags on gallery page
      $gallery('meta[property="og:image"]').each((_, elem) => {
        addImage($gallery(elem).attr('content'));
      });

      // Extract from JSON-LD on gallery page
      $gallery('script[type="application/ld+json"]').each((_, elem) => {
        try {
          const json = JSON.parse($gallery(elem).html() || '{}');
          if (json.image) {
            const imageUrls = Array.isArray(json.image) ? json.image : [json.image];
            imageUrls.forEach((imgUrl: any) => {
              if (typeof imgUrl === 'string') {
                addImage(imgUrl);
              } else if (imgUrl && typeof imgUrl === 'object' && imgUrl.url) {
                addImage(imgUrl.url);
              }
            });
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      });

      console.log(`[SIMPLE-SCRAPER] Found ${images.length} images from gallery page`);
    } catch (galleryError) {
      console.log(`[SIMPLE-SCRAPER] Could not fetch gallery page: ${galleryError instanceof Error ? galleryError.message : String(galleryError)}`);
    }

    // Strategy 4: Extract from script tags containing React/Redux state or __NEXT_DATA__
    progressCallback?.('extracting-images', 'Searching script tags for images...', 70, 'Searching script tags for image data...');
    $('script').each((_, elem) => {
      const scriptContent = $(elem).html() || '';
      
      // Look for large script tags that might contain listing data
      if (scriptContent.length > 5000 && 
          (scriptContent.includes('__NEXT_DATA__') || 
           scriptContent.includes('listing') || 
           scriptContent.includes('pdp') ||
           scriptContent.includes('image') ||
           scriptContent.includes('photo'))) {
        
        try {
          // Try to extract JSON from script tags
          let jsonData: any = null;

          // Try __NEXT_DATA__ pattern
          const nextDataPatterns = [
            /__NEXT_DATA__\s*=\s*({[\s\S]*?})(?:\s*;|\s*$)/,
            /__NEXT_DATA__\s*=\s*({[\s\S]*})/,
            /"__NEXT_DATA__"\s*:\s*({[\s\S]*?})(?:\s*,|\s*})/,
          ];

          for (const pattern of nextDataPatterns) {
            const match = scriptContent.match(pattern);
            if (match && match[1]) {
              try {
                jsonData = JSON.parse(match[1]);
                break;
              } catch (e) {
                // Try next pattern
              }
            }
          }

          // If no __NEXT_DATA__, try to find large JSON objects
          if (!jsonData && scriptContent.length > 10000) {
            const jsonMatches = scriptContent.match(/\{[\s\S]{1000,500000}\}/g);
            if (jsonMatches) {
              // Sort by size (largest first)
              jsonMatches.sort((a, b) => b.length - a.length);
              
              for (const match of jsonMatches) {
                try {
                  const parsed = JSON.parse(match);
                  if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 5) {
                    // Check if it looks like listing data
                    const keys = Object.keys(parsed).map(k => k.toLowerCase());
                    const hasListingKeys = keys.some(k => k.includes('listing') || k.includes('pdp') || k.includes('room'));
                    const hasImageKeys = JSON.stringify(parsed).includes('image') || JSON.stringify(parsed).includes('photo');
                    
                    if (hasListingKeys || hasImageKeys) {
                      jsonData = parsed;
                      break;
                    }
                  }
                } catch (e) {
                  // Try next match
                }
              }
            }
          }

          // Recursively search for image URLs in the JSON data
          if (jsonData) {
            const findImagesInObject = (obj: any, depth: number = 0): void => {
              if (depth > 15) return; // Prevent infinite recursion
              
              if (typeof obj === 'string') {
                // Check if it looks like an image URL
                if (obj.includes('airbnb') || obj.includes('muscache') || obj.includes('a0.muscache') || obj.includes('a1.muscache')) {
                  if (obj.length > 50 && (obj.includes('.jpg') || obj.includes('.jpeg') || obj.includes('.png') || obj.includes('.webp'))) {
                    addImage(obj);
                  }
                }
              } else if (Array.isArray(obj)) {
                obj.forEach(item => findImagesInObject(item, depth + 1));
              } else if (typeof obj === 'object' && obj !== null) {
                // Check for common image-related keys
                const keys = Object.keys(obj);
                const imageKeys = keys.filter(k => 
                  k.toLowerCase().includes('image') || 
                  k.toLowerCase().includes('photo') || 
                  k.toLowerCase().includes('picture') ||
                  k.toLowerCase().includes('url') ||
                  k === 'src'
                );

                // If we find image-related keys, prioritize those
                if (imageKeys.length > 0) {
                  imageKeys.forEach(key => {
                    const value = obj[key];
                    if (typeof value === 'string') {
                      addImage(value);
                    } else if (Array.isArray(value)) {
                      value.forEach(item => {
                        if (typeof item === 'string') {
                          addImage(item);
                        } else if (item && typeof item === 'object' && item.url) {
                          addImage(item.url);
                        }
                      });
                    } else if (value && typeof value === 'object' && value.url) {
                      addImage(value.url);
                    }
                  });
                }

                // Also recurse into all properties
                Object.values(obj).forEach(value => findImagesInObject(value, depth + 1));
              }
            };

            findImagesInObject(jsonData);
          }
        } catch (e) {
          // Ignore parse errors
          console.log(`[SIMPLE-SCRAPER] Error parsing script tag for images:`, e instanceof Error ? e.message : String(e));
        }
      }
    });

    // Strategy 5: Extract from img tags in the HTML
    $('img').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-lazy-src');
      addImage(src);
    });

    // Strategy 6: Extract from background-image CSS
    $('[style*="background-image"]').each((_, elem) => {
      const style = $(elem).attr('style') || '';
      const match = style.match(/url\(["']?([^"')]+)["']?\)/);
      if (match && match[1]) {
        addImage(match[1]);
      }
    });

    console.log(`[SIMPLE-SCRAPER] Total images found: ${images.length}`);

    // Extract price from JSON-LD or meta tags
    let price: number | null = null;
    jsonLdScripts.each((_, elem) => {
      try {
        const json = JSON.parse($(elem).html() || '{}');
        if (json.offers && json.offers.price) {
          const priceValue = typeof json.offers.price === 'string'
            ? parseFloat(json.offers.price.replace(/[^0-9.]/g, ''))
            : json.offers.price;
          if (!isNaN(priceValue)) {
            price = priceValue;
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Extract capacity/guests from JSON-LD
    let capacity: number | null = null;
    jsonLdScripts.each((_, elem) => {
      try {
        const json = JSON.parse($(elem).html() || '{}');
        if (json.occupancy && json.occupancy.maxOccupancy) {
          capacity = parseInt(json.occupancy.maxOccupancy);
        } else if (json.numberOfRooms) {
          capacity = parseInt(json.numberOfRooms);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Amenities - not extracted (too unreliable without browser automation)
    const amenities: string[] = [];

    progressCallback?.('scraping', 'Extraction complete', 80, `Extracted: ${title}, ${images.length} images`);

    return {
      title,
      description,
      price,
      capacity,
      amenities: [], // Not extracted - use Puppeteer scraper for amenities
      images: images.slice(0, 50), // Limit to 50 images
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    progressCallback?.('error', `Scraping failed: ${errorMessage}`, 0, `Error: ${errorMessage}`);
    throw new Error(`Failed to scrape Airbnb listing: ${errorMessage}`);
  }
}

// Removed all amenities extraction code - it was too unreliable
// Use Puppeteer scraper (lib/airbnb-scraper.ts) for amenities extraction
