// Use puppeteer-core for serverless, puppeteer for local dev
import puppeteerCore from 'puppeteer-core';
import chromiumMin from '@sparticuz/chromium-min';

// Dynamic import for puppeteer (only used locally)
// Using 'any' type to avoid TypeScript issues with dynamic imports
let puppeteer: any = null;

export interface AirbnbListingData {
  title: string;
  description: string;
  price: number | null;
  capacity: number | null;
  amenities: string[];
  images: string[];
}

// Progress callback type
export type ProgressCallback = (stage: string, message: string, progress: number, log?: string) => void | Promise<void>;

// Detect if we're running on Vercel or similar serverless environment
const isVercel = !!(process.env.VERCEL || process.env.VERCEL_URL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Cache for Chromium executable path (to avoid re-downloading)
let cachedExecutablePath: string | undefined = undefined;

export async function scrapeAirbnbListing(
  url: string,
  galleryUrl?: string,
  progressCallback?: ProgressCallback
): Promise<AirbnbListingData> {
  let browser;

  // Declare variables outside try block so they're accessible in catch
  let title = 'Imported Room';
  let description = 'Imported from Airbnb';
  const images: string[] = [];
  const amenities: string[] = [];
  let price: number | null = null;
  let capacity: number | null = null;

  try {
    progressCallback?.('initializing', 'Launching browser...', 5, 'Launching browser...');
    console.log('Launching browser...');
    console.log(`Environment: ${isVercel ? 'Vercel/Serverless' : 'Local'}`);

    if (isVercel) {
      // Use @sparticuz/chromium-min for Vercel/serverless environments
      // The Chromium binaries are packaged at build time into public/chromium-pack.tar
      // chromium-min downloads and extracts from the hosted tar file at runtime
      console.log('Using @sparticuz/chromium-min for serverless environment');

      try {
        // Use cached path if available, otherwise download and extract from tar
        let executablePath: string | undefined = cachedExecutablePath;

        if (!executablePath) {
          // Get the base URL for the deployment
          // Preview URLs (VERCEL_URL) require authentication, so we need the production/public URL
          // Try to read from filesystem first (if available in serverless function)
          let tarBuffer: Buffer | null = null;

          try {
            // Try to read directly from filesystem (public folder is included in deployment)
            const { readFileSync, existsSync } = await import('fs');
            const { join } = await import('path');
            const tarPath = join(process.cwd(), 'public', 'chromium-pack.tar');

            if (existsSync(tarPath)) {
              console.log(`Reading Chromium tar from filesystem: ${tarPath}`);
              tarBuffer = readFileSync(tarPath);
            }
          } catch (fsError) {
            console.log('Could not read from filesystem, will download from URL:', fsError);
          }

          // If not available from filesystem, download from public URL
          if (!tarBuffer) {
            // Use production/public URL - avoid preview URLs that require auth
            let baseUrl: string;

            if (process.env.NEXT_PUBLIC_APP_URL) {
              // Custom domain or configured public URL (best option)
              baseUrl = process.env.NEXT_PUBLIC_APP_URL;
            } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
              // Production deployment URL
              baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
            } else {
              // Fallback: construct production URL from project name
              // VERCEL_URL is preview URL, but we can try to get production
              // For now, use localhost for development
              baseUrl = process.env.VERCEL ? 'https://rental-manager.vercel.app' : 'http://localhost:3000';
            }

            const tarUrl = `${baseUrl}/chromium-pack.tar`;
            console.log(`Downloading Chromium from: ${tarUrl}`);
            console.log(`Environment: NEXT_PUBLIC_APP_URL=${process.env.NEXT_PUBLIC_APP_URL}, VERCEL_PROJECT_PRODUCTION_URL=${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);

            // Download the tar file
            const response = await fetch(tarUrl);
            if (!response.ok) {
              throw new Error(`Failed to download chromium-pack.tar from ${tarUrl}: ${response.status} ${response.statusText}. Make sure NEXT_PUBLIC_APP_URL is set to your public domain.`);
            }

            tarBuffer = Buffer.from(await response.arrayBuffer());
          }

          // Extract to /tmp (writable directory on Vercel)
          const { extract } = await import('tar');
          const { mkdirSync, writeFileSync } = await import('fs');
          const { join } = await import('path');

          const extractPath = '/tmp/chromium-bin';
          const tarFilePath = '/tmp/chromium-pack.tar';

          mkdirSync(extractPath, { recursive: true });

          // Write tar buffer to temporary file
          writeFileSync(tarFilePath, tarBuffer);

          // Extract from the file
          await extract({
            file: tarFilePath,
            cwd: extractPath,
          });

          // Point chromium-min to the extracted bin directory
          // chromium-min expects the bin directory to exist with brotli files
          const binPath = join(extractPath, 'bin');
          console.log(`Chromium extracted to: ${binPath}`);

          // Use chromium-min but point it to our extracted location
          // We need to set an environment variable or use chromium-min's API
          // Actually, chromium-min looks for bin in node_modules, so we might need to symlink
          // Or we can directly use the executable from the extracted location

          // Find and decompress the chromium executable
          const { readdirSync, statSync, chmodSync, readFileSync, writeFileSync: fsWriteFileSync, existsSync } = await import('fs');
          const brotli = await import('brotli');
          const files = readdirSync(binPath);

          console.log(`Files in bin directory: ${files.join(', ')}`);

          // Look for the chromium executable (usually chromium.br which needs decompression)
          // Ignore tar files, swiftshader, and other non-executable files
          let chromiumBrFile: string | undefined;
          let chromiumExecutable: string | undefined;

          // Extract all brotli files to ensure we have dependencies (libs, fonts, swiftshader)
          const brotliFiles = files.filter(f => f.endsWith('.br'));

          for (const file of brotliFiles) {
            const filePath = join(binPath, file);
            const decompressedFilename = file.replace('.br', '');
            const decompressedPath = join(binPath, decompressedFilename);

            // Skip if already decompressed
            if (!existsSync(decompressedPath)) {
              console.log(`Decompressing ${file}...`);
              const compressedData = readFileSync(filePath);
              const decompressedData = (brotli as any).decompress(compressedData);
              if (!decompressedData) {
                console.error(`Failed to decompress ${file}`);
                continue;
              }
              fsWriteFileSync(decompressedPath, Buffer.from(decompressedData));
              console.log(`Decompressed to: ${decompressedPath}`);
            } else {
              console.log(`${decompressedFilename} already exists.`);
            }

            // If it's a tar file, extract it
            if (decompressedFilename.endsWith('.tar')) {
              console.log(`Extracting ${decompressedFilename}...`);
              await extract({
                file: decompressedPath,
                cwd: binPath,
              });
            }
          }

          // Find the chromium executable again after extraction
          const updatedFiles = readdirSync(binPath);
          console.log(`Files after extraction: ${updatedFiles.join(', ')}`);

          chromiumExecutable = updatedFiles.find(f => f === 'chromium');

          if (!chromiumExecutable) {
            // Try to find it again if it wasn't found before
            chromiumExecutable = 'chromium';
            // Check if it actually exists now
            if (!updatedFiles.includes(chromiumExecutable)) {
              throw new Error(`Chromium executable not found after extraction. Available files: ${updatedFiles.join(', ')}`);
            }
          }

          // Assign to the outer variable
          executablePath = join(binPath, chromiumExecutable);

          // Setup environment variables for libraries
          // Add the bin directory itself to LD_LIBRARY_PATH as some libs might be there
          const currentLdLibraryPath = process.env.LD_LIBRARY_PATH || '';
          const libPath = join(binPath, 'lib');

          let newLdLibraryPath = binPath;
          if (existsSync(libPath)) {
            console.log(`Found lib folder, adding to LD_LIBRARY_PATH`);
            newLdLibraryPath = `${libPath}:${newLdLibraryPath}`;
          }

          process.env.LD_LIBRARY_PATH = `${newLdLibraryPath}:${currentLdLibraryPath}`;
          console.log(`Set LD_LIBRARY_PATH to include: ${newLdLibraryPath}`);


          // Verify the file exists and is a file (not a directory)
          const finalStats = statSync(executablePath);
          if (!finalStats.isFile()) {
            throw new Error(`Chromium executable path exists but is not a file: ${executablePath}`);
          }

          // Make the executable file executable
          chmodSync(executablePath, 0o755); // rwxr-xr-x
          console.log(`Made executable: ${executablePath}`);

          cachedExecutablePath = executablePath;
          console.log(`Chromium executable ready: ${executablePath}`);
        } else {
          console.log(`Using cached Chromium executable path: ${executablePath}`);
        }

        // Final verification that executablePath is set before launching
        if (!executablePath) {
          throw new Error('Chromium executable path is not set. This should not happen.');
        }

        // Verify the file exists and is accessible
        const { accessSync, constants } = await import('fs');
        try {
          accessSync(executablePath, constants.F_OK | constants.X_OK);
        } catch (err) {
          throw new Error(`Chromium executable not accessible at ${executablePath}: ${err instanceof Error ? err.message : String(err)}`);
        }

        console.log(`Launching browser with executable: ${executablePath}`);

        // Add memory-saving flags
        const minimalArgs = [
          ...chromiumMin.args,
          '--disable-dev-shm-usage', // Use /tmp instead of /dev/shm
          '--no-zygote', // Disable zygote process to save memory
          '--single-process', // Run in single process (risky but saves memory)
          '--disable-gpu',
          '--no-sandbox',
        ];

        browser = await puppeteerCore.launch({
          args: minimalArgs,
          defaultViewport: { width: 1920, height: 1080 },
          executablePath: executablePath, // Explicitly set to ensure TypeScript knows it's defined
          headless: true,
          ignoreHTTPSErrors: true,
        });
        console.log('Chromium browser launched successfully');
      } catch (chromiumError) {
        console.error('Failed to launch Chromium:', chromiumError);
        console.error('Chromium error details:', JSON.stringify(chromiumError, Object.getOwnPropertyNames(chromiumError)));
        throw new Error(`Failed to launch browser on Vercel: ${chromiumError instanceof Error ? chromiumError.message : String(chromiumError)}. Make sure chromium-pack.tar is available at /chromium-pack.tar`);
      }
    } else {
      // Use regular Puppeteer for local development
      console.log('Using regular Puppeteer for local development');
      try {
        // Dynamically import puppeteer only when needed (local dev)
        if (!puppeteer) {
          const puppeteerModule = await import('puppeteer');
          puppeteer = puppeteerModule.default || puppeteerModule;
        }
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('Puppeteer browser launched successfully');
      } catch (puppeteerError) {
        console.error('Failed to launch Puppeteer:', puppeteerError);
        throw new Error(`Failed to launch browser locally: ${puppeteerError instanceof Error ? puppeteerError.message : String(puppeteerError)}. Try running: npx puppeteer browsers install chrome`);
      }
    }

    const page = await browser.newPage();

    // Optimize for low memory environments (Vercel) OR if simulating locally
    const shouldOptimize = isVercel || process.env.SIMULATE_VERCEL === 'true';

    if (shouldOptimize) {
      console.log('Applying memory optimizations (request interception)...');
      // Block images, fonts, and stylesheets to save resources
      await page.setRequestInterception(true);
      page.on('request', (req: any) => {
        const resourceType = req.resourceType();
        // Only block images and media. Allow stylesheets/fonts as blocking them can break the app.
        if (['image', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navigating to:', url);

    // Capture browser console logs
    page.on('console', (msg: any) => console.log('PAGE LOG:', msg.text()));

    // Use domcontentloaded for faster navigation and to avoid networkidle timeouts/issues
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Page loaded (domcontentloaded)');

    // Wait for body to be present
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('Body selector found');

    // Small delay to allow basic hydration
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract title
    title = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const ogTitle = document.querySelector('meta[property="og:title"]');
      return h1?.textContent?.trim() || ogTitle?.getAttribute('content') || 'Imported Room';
    });

    console.log('Title:', title);

    // Click "Show more" button for full description
    description = '';
    try {
      console.log('Looking for "Show more" button...');

      // Wait for page to be fully ready
      try {
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
      } catch (e) {
        console.log('Page ready state check timed out, continuing...');
      }

      // Find and click "Show more" button using evaluate
      // Wrap in try-catch to handle frame errors
      let clicked = false;
      try {
        clicked = await page.evaluate(() => {
          try {
            const buttons = Array.from(document.querySelectorAll('button'));
            const showMoreButton = buttons.find(btn =>
              btn.textContent?.includes('Show more') ||
              btn.textContent?.includes('Read more')
            );

            if (showMoreButton) {
              showMoreButton.click();
              return true;
            }
            return false;
          } catch (e) {
            console.error('Error in evaluate:', e);
            return false;
          }
        });
      } catch (frameError: any) {
        // Handle "Requesting main frame too early" and similar errors
        if (frameError?.message?.includes('main frame') || frameError?.message?.includes('frame')) {
          console.log('Frame not ready, waiting and retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            clicked = await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const showMoreButton = buttons.find(btn =>
                btn.textContent?.includes('Show more') ||
                btn.textContent?.includes('Read more')
              );
              if (showMoreButton) {
                showMoreButton.click();
                return true;
              }
              return false;
            });
          } catch (retryError) {
            console.log('Retry also failed, skipping "Show more" button');
          }
        } else {
          throw frameError;
        }
      }

      if (clicked) {
        console.log('Clicked "Show more" button');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Extract full description from the modal or expanded section
      // Wrap in try-catch to handle frame errors
      try {
        description = await page.evaluate(() => {
          // First, try to find the description in a more targeted way
          // Look for the actual description paragraphs, not the whole container

          // Strategy 1: Look for specific description divs/sections
          const descriptionSelectors = [
            'div[data-section-id*="description"]',
            'div[data-testid*="description"]',
            'section[data-section-id*="description"]',
          ];

          for (const selector of descriptionSelectors) {
            const elem = document.querySelector(selector);
            if (elem) {
              // Get only direct text nodes and paragraph text
              const paragraphs: string[] = [];
              const pElements = elem.querySelectorAll('p, div > span');
              pElements.forEach(p => {
                const text = p.textContent?.trim() || '';
                if (text.length > 20 && !text.includes('{') && !text.includes('[')) {
                  paragraphs.push(text);
                }
              });

              if (paragraphs.length > 0) {
                return paragraphs.join('\n\n');
              }
            }
          }

          // Strategy 2: Look for "About this space" heading and get following paragraphs
          const allElements = Array.from(document.querySelectorAll('h2, h3, div, span'));
          for (let i = 0; i < allElements.length; i++) {
            const elem = allElements[i];
            const text = elem.textContent || '';

            if (text.trim() === 'About this space' || text.trim() === 'About this place') {
              // Found the heading, now collect following paragraph elements
              const paragraphs: string[] = [];
              let current = elem.nextElementSibling;
              let count = 0;

              while (current && count < 10) {
                // Look for paragraph-like elements
                const pTags = current.querySelectorAll('span, div');
                pTags.forEach(p => {
                  const pText = p.textContent?.trim() || '';
                  // Filter out JSON, short text, and navigation elements
                  if (pText.length > 30 &&
                    pText.length < 2000 &&
                    !pText.includes('{') &&
                    !pText.includes('[') &&
                    !pText.includes('http') &&
                    !pText.includes('Show more') &&
                    !paragraphs.includes(pText)) {
                    paragraphs.push(pText);
                  }
                });

                if (paragraphs.length > 0) {
                  break;
                }

                current = current.nextElementSibling;
                count++;
              }

              if (paragraphs.length > 0) {
                return paragraphs.slice(0, 5).join('\n\n'); // Limit to first 5 paragraphs
              }
            }
          }

          // Fallback to meta description
          const metaDesc = document.querySelector('meta[property="og:description"]');
          return metaDesc?.getAttribute('content') || 'Imported from Airbnb';
        });
      } catch (evalError: any) {
        // Handle frame errors during description extraction
        if (evalError?.message?.includes('main frame') || evalError?.message?.includes('frame')) {
          console.log('Frame error during description extraction, using fallback...');
          try {
            // Wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, 1000));
            description = await page.evaluate(() => {
              const metaDesc = document.querySelector('meta[property="og:description"]');
              return metaDesc?.getAttribute('content') || 'Imported from Airbnb';
            });
          } catch (retryError) {
            console.log('Retry failed, using simple fallback');
            description = 'Imported from Airbnb';
          }
        } else {
          throw evalError;
        }
      }
    } catch (error) {
      console.log('Could not expand description:', error);
      try {
        description = await page.evaluate(() => {
          const metaDesc = document.querySelector('meta[property="og:description"]');
          return metaDesc?.getAttribute('content') || 'Imported from Airbnb';
        });
      } catch (fallbackError) {
        console.log('Fallback description extraction also failed');
        description = 'Imported from Airbnb';
      }
    }

    console.log('Description length:', description.length);

    // Wait for page to be stable after description extraction
    // This is critical to avoid "Requesting main frame too early!" errors
    console.log('Waiting for page to stabilize after description extraction...');
    try {
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 });
    } catch (e) {
      console.log('Page ready state check timed out, waiting anyway...');
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Additional wait for stability

    // Extract images - if gallery URL provided, use it directly
    // Clear images array before starting (in case of retry)
    images.length = 0;

    // If gallery URL is provided, try to extract images from it
    // Instead of opening a new page (which uses more memory), navigate the current page
    if (galleryUrl) {
      try {
        progressCallback?.('extracting-images', 'Navigating to gallery...', 35, `Scraping images from provided gallery URL: ${galleryUrl}`);
        console.log('Scraping images from provided gallery URL:', galleryUrl);

        // Ensure page is ready before navigation
        try {
          // Wait for any pending operations to complete
          await page.waitForFunction(() => {
            return document.readyState === 'complete' &&
              !document.querySelector('[aria-busy="true"]') &&
              document.body !== null;
          }, { timeout: 5000 });
        } catch (e) {
          console.log('Page readiness check timed out, continuing...');
        }

        // Close any modals first
        try {
          await page.keyboard.press('Escape'); // Close any open modals
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          // Ignore if no modal
        }

        // Navigate to gallery URL on the same page
        // Use a longer wait to ensure page is ready
        await page.goto(galleryUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for page to be fully ready after navigation
        try {
          await page.waitForSelector('body', { timeout: 10000 });
          await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
        } catch (e) {
          console.log('Page readiness check after navigation timed out, continuing...');
        }

        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for gallery to load

        // Helper function to extract images from page
        const extractImagesFromPage = async (): Promise<string[]> => {
          return await page.evaluate(() => {
            // @ts-nocheck
            const imgs: string[] = [];
            const uniqueUrls = new Set<string>();

            // Helper function to extract image URL
            function extractImageUrl(element: any) {
              let src = element.src || element.getAttribute('src');
              if (src && src.length > 50 && !src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
                return src.split('?')[0];
              }

              src = element.getAttribute('data-src') || element.getAttribute('data-lazy-src') || element.getAttribute('data-original-uri');
              if (src && src.length > 50 && !src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
                return src.split('?')[0];
              }

              const style = element.style ? element.style.backgroundImage : '';
              if (style) {
                const match = style.match(/url\(["']?([^"')]+)["']?\)/);
                if (match && match[1] && match[1].length > 50) {
                  return match[1].split('?')[0];
                }
              }

              return null;
            }

            // Extract all visible images
            const allImageElements = Array.from(document.querySelectorAll('img, picture, [style*="background-image"]'));

            allImageElements.forEach(element => {
              const imgUrl = extractImageUrl(element);
              if (imgUrl &&
                (imgUrl.includes('airbnb') || imgUrl.includes('muscache') || imgUrl.includes('a0.muscache') || imgUrl.includes('a1.muscache')) &&
                !imgUrl.includes('icon') &&
                !imgUrl.includes('logo') &&
                !imgUrl.includes('avatar') &&
                !imgUrl.includes('placeholder')) {
                if (!uniqueUrls.has(imgUrl)) {
                  uniqueUrls.add(imgUrl);
                  imgs.push(imgUrl);
                }
              }
            });

            return imgs;
          });
        };

        // Navigate through gallery using keyboard and extract images
        let previousCount = 0;
        let noChangeCount = 0;
        const allGalleryImages = new Set<string>();

        for (let i = 0; i < 50; i++) { // Reduced from 150 to save memory
          // Extract images from current view
          const currentImages = await extractImagesFromPage();
          currentImages.forEach(img => allGalleryImages.add(img));

          const currentCount = allGalleryImages.size;
          progressCallback?.('extracting-images', `Found ${currentCount} images so far...`, 35 + Math.min(i * 2, 10), `Gallery navigation ${i + 1}: Found ${currentCount} unique images`);
          console.log(`Gallery navigation ${i + 1}: Found ${currentCount} unique images`);

          if (currentCount === previousCount) {
            noChangeCount++;
            if (noChangeCount >= 3) { // Reduced from 5 to stop sooner
              console.log('No new images found for 3 navigations, stopping');
              break;
            }
          } else {
            noChangeCount = 0;
          }

          previousCount = currentCount;

          // Navigate to next image using arrow key
          await page.keyboard.press('ArrowRight');
          await new Promise(resolve => setTimeout(resolve, 500));

          // Also try scrolling as backup
          await page.evaluate(() => {
            window.scrollBy(0, 500);
            const scrollableContainers = document.querySelectorAll('div, section');
            scrollableContainers.forEach((container: Element) => {
              const style = window.getComputedStyle(container);
              if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                (container as HTMLElement).scrollTop += 500;
              }
            });
          });

          await new Promise(resolve => setTimeout(resolve, 300));
        }

        Array.from(allGalleryImages).forEach(img => images.push(img));
        progressCallback?.('extracting-images', `Found ${images.length} images from gallery`, 45, `Found ${images.length} images from gallery URL`);
        console.log(`Found ${images.length} images from gallery URL`);

        // Navigate back to main listing page for fallback image extraction
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // Don't fail the entire import if gallery scraping fails
        progressCallback?.('extracting-images', 'Gallery scraping failed, using fallback...', 35, `Error scraping gallery URL: ${error instanceof Error ? error.message : String(error)}`);
        console.log('Error scraping gallery URL:', error);
        // Continue with regular extraction as fallback
      }
    }

    // If no images found from gallery URL, try the regular method
    if (images.length === 0) {
      try {
        console.log('Opening photo gallery...');

        // Ensure page is ready before trying to open gallery
        try {
          await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 });
          await new Promise(resolve => setTimeout(resolve, 1000)); // Additional stability wait
        } catch (e) {
          console.log('Page readiness check timed out, continuing...');
        }

        // Try multiple selectors to find and click the main image/gallery button
        const clickSelectors = [
          'button[aria-label*="Show all photos"]',
          'button[aria-label*="photo"]',
          'img[data-original-uri]',
          'button[data-testid*="photo"]',
          'div[role="button"][aria-label*="photo"]',
          'picture button',
          'div[class*="gallery"] button',
          'div[class*="photo"] button'
        ];

        let galleryOpened = false;
        for (const selector of clickSelectors) {
          try {
            // Wait for selector with retry logic
            let element = null;
            let retries = 3;
            while (retries > 0 && !element) {
              try {
                element = await page.$(selector);
                if (!element) {
                  await new Promise(resolve => setTimeout(resolve, 500));
                  retries--;
                }
              } catch (frameError: any) {
                if (frameError?.message?.includes('main frame') || frameError?.message?.includes('frame')) {
                  console.log(`Frame not ready for selector ${selector}, waiting...`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  retries--;
                } else {
                  throw frameError;
                }
              }
            }

            if (element) {
              console.log(`Trying to click gallery with selector: ${selector}`);
              try {
                await element.click();
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer for gallery to open
              } catch (clickError: any) {
                if (clickError?.message?.includes('main frame') || clickError?.message?.includes('frame')) {
                  console.log(`Frame error when clicking ${selector}, waiting and retrying...`);
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  try {
                    await element.click();
                    await new Promise(resolve => setTimeout(resolve, 3000));
                  } catch (retryError) {
                    console.log(`Retry click also failed for ${selector}`);
                    continue;
                  }
                } else {
                  throw clickError;
                }
              }

              // Check if gallery modal is open (with retry for frame errors)
              let modalOpen = false;
              try {
                modalOpen = await page.evaluate(() => {
                  return !!document.querySelector('[role="dialog"], [data-testid*="modal"], [class*="modal"]');
                });
              } catch (evalError: any) {
                if (evalError?.message?.includes('main frame') || evalError?.message?.includes('frame')) {
                  console.log('Frame error checking modal, waiting and retrying...');
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  try {
                    modalOpen = await page.evaluate(() => {
                      return !!document.querySelector('[role="dialog"], [data-testid*="modal"], [class*="modal"]');
                    });
                  } catch (retryError) {
                    console.log('Retry modal check also failed');
                  }
                } else {
                  throw evalError;
                }
              }

              if (modalOpen) {
                console.log('Gallery modal opened successfully');
                galleryOpened = true;
                break;
              }
            }
          } catch (e: any) {
            if (e?.message?.includes('main frame') || e?.message?.includes('frame')) {
              console.log(`Selector ${selector} failed with frame error: ${e.message}, waiting and retrying...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              // Try one more time
              try {
                const retryElement = await page.$(selector);
                if (retryElement) {
                  await retryElement.click();
                  await new Promise(resolve => setTimeout(resolve, 3000));
                  // Check modal again with retry
                  let retryModalOpen = false;
                  try {
                    retryModalOpen = await page.evaluate(() => {
                      return !!document.querySelector('[role="dialog"], [data-testid*="modal"], [class*="modal"]');
                    });
                  } catch (retryEvalError: any) {
                    if (retryEvalError?.message?.includes('main frame') || retryEvalError?.message?.includes('frame')) {
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      try {
                        retryModalOpen = await page.evaluate(() => {
                          return !!document.querySelector('[role="dialog"], [data-testid*="modal"], [class*="modal"]');
                        });
                      } catch (finalError) {
                        // Ignore
                      }
                    }
                  }
                  if (retryModalOpen) {
                    galleryOpened = true;
                    break;
                  }
                }
              } catch (retryError) {
                console.log(`Retry for ${selector} also failed`);
              }
            } else {
              console.log(`Selector ${selector} failed:`, e);
            }
            continue;
          }
        }

        if (galleryOpened) {
          // First, try using keyboard navigation to go through all images
          console.log('Using keyboard navigation to navigate through gallery...');
          let previousImageCount = 0;
          let stableCount = 0;

          // Navigate through images using arrow keys
          for (let nav = 0; nav < 100; nav++) {
            const currentImages = await page.evaluate(() => {
              const imgs: string[] = [];
              const uniqueUrls = new Set<string>();

              document.querySelectorAll('img, picture').forEach(element => {
                const src = (element as HTMLImageElement).src ||
                  element.getAttribute('src') ||
                  element.getAttribute('data-src') ||
                  element.getAttribute('data-original-uri');

                if (src &&
                  (src.includes('airbnb') || src.includes('muscache')) &&
                  !src.includes('icon') &&
                  !src.includes('logo') &&
                  !src.includes('avatar') &&
                  src.length > 50) {
                  const highResSrc = src.split('?')[0];
                  if (!uniqueUrls.has(highResSrc)) {
                    uniqueUrls.add(highResSrc);
                    imgs.push(highResSrc);
                  }
                }
              });
              return imgs;
            });

            if (currentImages.length === previousImageCount) {
              stableCount++;
              if (stableCount >= 3) {
                console.log(`Image count stable at ${currentImages.length}, stopping keyboard navigation`);
                break;
              }
            } else {
              stableCount = 0;
            }

            previousImageCount = currentImages.length;

            // Press right arrow to go to next image
            await page.keyboard.press('ArrowRight');
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Now scroll and extract all images with improved logic
          const galleryImages = await page.evaluate(() => {
            const imgs: string[] = [];
            const uniqueUrls = new Set<string>();

            // Helper function to extract image URL from various sources
            function extractImageUrl(element: Element): string | null {
              // Try src attribute
              let src = (element as HTMLImageElement).src || element.getAttribute('src');
              if (src && src.length > 50 && !src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
                return src.split('?')[0]; // Remove query params for high-res
              }

              // Try data-src
              src = element.getAttribute('data-src') || element.getAttribute('data-lazy-src');
              if (src && src.length > 50 && !src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
                return src.split('?')[0];
              }

              // Try data-original-uri
              src = element.getAttribute('data-original-uri');
              if (src && src.length > 50) {
                return src.split('?')[0];
              }

              // Try background-image from style
              const style = (element as HTMLElement).style?.backgroundImage;
              if (style) {
                const match = style.match(/url\(["']?([^"')]+)["']?\)/);
                if (match && match[1] && match[1].length > 50) {
                  return match[1].split('?')[0];
                }
              }

              return null;
            }

            // Scroll loop with improved navigation
            let previousCount = 0;
            let noChangeCount = 0;
            const maxScrolls = 50; // Increased from 30

            console.log('Starting enhanced gallery extraction. Initial count:', uniqueUrls.size);

            for (let i = 0; i < maxScrolls; i++) {
              // Find all image elements in various ways
              const allImageElements = Array.from(document.querySelectorAll('img, picture, [style*="background-image"]'));

              allImageElements.forEach(element => {
                const imgUrl = extractImageUrl(element);
                if (imgUrl &&
                  (imgUrl.includes('airbnb') || imgUrl.includes('a0.muscache') || imgUrl.includes('a1.muscache')) &&
                  !imgUrl.includes('icon') &&
                  !imgUrl.includes('logo') &&
                  !imgUrl.includes('avatar') &&
                  !imgUrl.includes('placeholder')) {
                  if (!uniqueUrls.has(imgUrl)) {
                    uniqueUrls.add(imgUrl);
                    imgs.push(imgUrl);
                  }
                }
              });

              console.log(`Scroll ${i + 1}: Found ${uniqueUrls.size} unique images`);

              if (uniqueUrls.size === previousCount) {
                noChangeCount++;
              } else {
                noChangeCount = 0;
              }

              previousCount = uniqueUrls.size;

              // If no new images found for 5 consecutive scrolls, assume we're done
              if (noChangeCount >= 5 && uniqueUrls.size > 5) {
                console.log('No new images found for 5 scrolls, stopping.');
                break;
              }

              // Try multiple scrolling strategies
              // 1. Scroll the modal container
              const modalContainer = document.querySelector('[role="dialog"], [data-testid*="modal"], [class*="modal"]');
              if (modalContainer) {
                // Find the actual scrollable container
                const scrollableContainers = modalContainer.querySelectorAll('div, section');
                scrollableContainers.forEach((container: Element) => {
                  const style = window.getComputedStyle(container);
                  if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') {
                    (container as HTMLElement).scrollTop += 500;
                  }
                });

                // Also scroll the modal itself
                (modalContainer as HTMLElement).scrollTop += 500;
              }

              // 2. Use arrow keys to navigate (if gallery supports it)
              if (i % 3 === 0) {
                // Press right arrow every 3 scrolls to navigate through images
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
                // Small delay using setTimeout (no await in browser context)
                setTimeout(() => { }, 200);
              }

              // 3. Scroll window as backup
              window.scrollBy(0, 500);

              // 4. Scroll last image into view
              const lastImg = allImageElements[allImageElements.length - 1];
              if (lastImg) {
                (lastImg as HTMLElement).scrollIntoView({ behavior: 'auto', block: 'nearest' });
              }

              // Wait for images to load (using setTimeout, no await in browser context)
              setTimeout(() => { }, 1000);
            }

            console.log(`Final image count: ${uniqueUrls.size}`);
            return imgs;
          });

          images.push(...galleryImages);
          console.log('Found images in gallery:', images.length);

          // Close gallery
          const closeSelectors = [
            'button[aria-label*="Close"]',
            'button[aria-label*="close"]',
            'button[data-testid*="close"]',
            '[role="button"][aria-label*="Close"]'
          ];

          for (const selector of closeSelectors) {
            try {
              const closeButton = await page.$(selector);
              if (closeButton) {
                await closeButton.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                break;
              }
            } catch (e) {
              continue;
            }
          }
        } else {
          console.log('Could not open gallery modal, trying fallback...');
        }
      } catch (error) {
        console.log('Could not open photo gallery:', error);
      }
    } // Close if (images.length === 0)

    // Fallback: get additional images from page (always check, even if gallery worked)
    // This ensures we don't miss any images that might be visible on the page
    const existingUrls = new Set(images);
    const pageImages = await page.evaluate(() => {
      const imgs: string[] = [];
      const uniqueUrls = new Set<string>();

      // Check all image sources
      document.querySelectorAll('img, picture, [style*="background-image"]').forEach(element => {
        // Try multiple attributes
        const src = (element as HTMLImageElement).src ||
          element.getAttribute('src') ||
          element.getAttribute('data-src') ||
          element.getAttribute('data-lazy-src') ||
          element.getAttribute('data-original-uri');

        if (src &&
          (src.includes('airbnb') || src.includes('muscache') || src.startsWith('http')) &&
          !src.includes('icon') &&
          !src.includes('logo') &&
          !src.includes('avatar') &&
          !src.includes('placeholder') &&
          src.length > 50) {
          const highResSrc = src.split('?')[0];
          if (!uniqueUrls.has(highResSrc)) {
            uniqueUrls.add(highResSrc);
            imgs.push(highResSrc);
          }
        }

        // Also check background-image from style
        const style = (element as HTMLElement).style?.backgroundImage;
        if (style) {
          const match = style.match(/url\(["']?([^"')]+)["']?\)/);
          if (match && match[1]) {
            const bgSrc = match[1].split('?')[0];
            if (bgSrc &&
              (bgSrc.includes('airbnb') || bgSrc.includes('muscache')) &&
              !bgSrc.includes('icon') &&
              !bgSrc.includes('logo') &&
              bgSrc.length > 50 &&
              !uniqueUrls.has(bgSrc)) {
              uniqueUrls.add(bgSrc);
              imgs.push(bgSrc);
            }
          }
        }
      });
      return imgs;
    });

    // Add page images that aren't already in our collection
    pageImages.forEach((imgUrl: string) => {
      if (!existingUrls.has(imgUrl)) {
        images.push(imgUrl);
        existingUrls.add(imgUrl);
      }
    });

    console.log(`Total images found (gallery + page): ${images.length}`);

    // Extract amenities from the dedicated /amenities page
    // Clear amenities array before starting (in case of retry)
    amenities.length = 0;
    try {
      progressCallback?.('extracting-amenities', 'Extracting amenities...', 80, 'Extracting amenities from /amenities page...');
      console.log('Extracting amenities from /amenities page...');

      // Navigate to the amenities page (reuse existing page to save memory)
      const amenitiesUrl = url.endsWith('/') ? `${url}amenities` : `${url}/amenities`;
      console.log('Navigating to:', amenitiesUrl);

      // Check if page is still valid before navigating
      try {
        // Navigate current page to amenities URL
        await page.goto(amenitiesUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for page to load
      } catch (navError: any) {
        // If navigation fails (page detached, etc.), skip amenities extraction
        if (navError?.message?.includes('detached') || navError?.message?.includes('frame')) {
          console.log('Page detached during navigation, skipping amenities extraction');
          throw navError; // Re-throw to trigger fallback
        }
        throw navError;
      }

      // Extract amenities from the amenities page
      const allAmenities = await page.evaluate(() => {
        const amenitiesList: string[] = [];
        const seen = new Set<string>();

        // Find the dialog with "What this place offers"
        const dialog = document.querySelector('[role="dialog"][aria-label*="What this place offers"], [role="dialog"][aria-label*="amenities"]');

        if (!dialog) {
          console.log('Dialog not found, trying alternative selectors...');
          // Fallback: try to find any dialog
          const anyDialog = document.querySelector('[role="dialog"]');
          if (anyDialog) {
            console.log('Found dialog without specific aria-label');
            // Use this dialog
            const lists = anyDialog.querySelectorAll('ul[role="list"]');
            lists.forEach(list => {
              const items = list.querySelectorAll('li');
              items.forEach(item => {
                // Find the amenity name - it's in a div with class containing "row-title" or "twad414"
                const nameElement = item.querySelector('div[id*="row-title"], div.twad414, div[class*="row-title"]');
                if (nameElement) {
                  let text = nameElement.textContent?.trim() || '';
                  // Skip if it's "Unavailable:" or starts with unavailable
                  if (text.toLowerCase().startsWith('unavailable:')) {
                    return;
                  }
                  // Clean up
                  text = text.replace(/^Unavailable:\s*/i, '').trim();
                  text = text.split('\n')[0].split('–')[0].split('—')[0].trim();
                  text = text.replace(/\s+/g, ' ');

                  const textLower = text.toLowerCase();
                  if (text &&
                    text.length > 2 &&
                    text.length < 150 &&
                    !seen.has(textLower) &&
                    !textLower.match(/^(share|save|close|show|hide|more|less|×|back|what this place offers|amenities)$/i) &&
                    /[a-zA-Z]/.test(text)) {
                    seen.add(textLower);
                    amenitiesList.push(text);
                  }
                }
              });
            });
          }
        } else {
          console.log('Found amenities dialog');

          // Find all ul[role="list"] elements inside the dialog
          const lists = dialog.querySelectorAll('ul[role="list"]');
          console.log(`Found ${lists.length} amenity lists`);

          lists.forEach((list, listIndex) => {
            const items = list.querySelectorAll('li');
            console.log(`List ${listIndex + 1} has ${items.length} items`);

            items.forEach((item, itemIndex) => {
              // Find the amenity name element
              // It's typically in a div with id containing "row-title" or class "twad414"
              const nameElement = item.querySelector('div[id*="row-title"], div.twad414, div[class*="row-title"]');

              if (nameElement) {
                let text = nameElement.textContent?.trim() || '';

                // Skip "Unavailable:" items
                if (text.toLowerCase().startsWith('unavailable:')) {
                  return;
                }

                // Remove "Unavailable:" prefix if present
                text = text.replace(/^Unavailable:\s*/i, '').trim();

                // Clean up - get just the amenity name, not descriptions
                text = text.split('\n')[0].split('–')[0].split('—')[0].trim();
                text = text.replace(/\s+/g, ' ');

                const textLower = text.toLowerCase();

                // Filter for valid amenities
                if (text &&
                  text.length > 2 &&
                  text.length < 150 &&
                  !seen.has(textLower) &&
                  !textLower.match(/^(share|save|close|show|hide|more|less|×|back|what this place offers|amenities|not included)$/i) &&
                  !textLower.includes('unavailable') &&
                  /[a-zA-Z]/.test(text)) {

                  seen.add(textLower);
                  amenitiesList.push(text);
                  console.log(`Added amenity: ${text}`);
                }
              } else {
                // Fallback: try to get text from the item itself if it has an SVG
                const hasIcon = item.querySelector('svg') !== null;
                if (hasIcon) {
                  // Try to find text in spans or divs that might contain the name
                  const textElements = item.querySelectorAll('span, div');
                  for (const elem of Array.from(textElements)) {
                    const elemText = elem.textContent?.trim() || '';
                    if (elemText &&
                      elemText.length > 2 &&
                      elemText.length < 150 &&
                      !elemText.toLowerCase().startsWith('unavailable') &&
                      !elemText.match(/^(share|save|close|show|hide|more|less|×|back)$/i)) {
                      const textLower = elemText.toLowerCase();
                      if (!seen.has(textLower) && /[a-zA-Z]/.test(elemText)) {
                        seen.add(textLower);
                        amenitiesList.push(elemText);
                        break; // Found one, move to next item
                      }
                    }
                  }
                }
              }
            });
          });
        }

        console.log(`Found ${amenitiesList.length} amenities from /amenities page`);
        return amenitiesList;
      });

      amenities.push(...allAmenities);
      progressCallback?.('extracting-amenities', `Found ${amenities.length} amenities`, 85, `Found ${amenities.length} amenities`);
      console.log('Found amenities:', amenities.length);

      // Navigate back to main listing page before continuing
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to stabilize
      } catch (navBackError) {
        console.log('Failed to navigate back to main page, but continuing...', navBackError);
        // Try to continue anyway - page might still be usable
      }
    } catch (error) {
      progressCallback?.('extracting-amenities', 'Amenities extraction failed, continuing...', 80, `Could not extract amenities: ${error instanceof Error ? error.message : String(error)}`);
      console.log('Could not extract amenities:', error);

      // Ensure we're back on the main page before trying fallback
      try {
        // Check if page is still valid
        const pageUrl = page.url();
        if (!pageUrl.includes(url.split('/').pop() || '')) {
          console.log('Page is not on main listing, navigating back...');
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (navError) {
        console.log('Could not navigate back to main page, skipping amenities fallback');
      }

      // Try to extract amenities from the main page as fallback (only if page is valid)
      try {
        const mainPageAmenities = await page.evaluate(() => {
          const amenitiesList: string[] = [];
          const seen = new Set<string>();

          // Look for amenities on the main page
          const amenitySelectors = [
            'div[data-section-id*="amenities"]',
            'div[data-testid*="amenity"]',
            'section[data-section-id*="amenities"]',
          ];

          for (const selector of amenitySelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(elem => {
              const text = elem.textContent?.trim() || '';
              if (text && text.length > 3 && text.length < 100 && !seen.has(text)) {
                seen.add(text);
                amenitiesList.push(text);
              }
            });
          }

          return amenitiesList;
        });
        amenities.push(...mainPageAmenities);
        console.log(`Found ${mainPageAmenities.length} amenities from main page fallback`);
      } catch (fallbackError) {
        console.log('Fallback amenities extraction also failed - continuing without amenities');
        // Don't throw - amenities are optional, continue with import
      }
    }

    // Extract price and capacity - ensure we're on the main page first
    try {
      // Make sure we're on the main listing page before extracting price/capacity
      const currentUrl = page.url();
      if (!currentUrl.includes(url.split('/').pop() || '') || currentUrl.includes('/amenities')) {
        console.log('Not on main page, navigating back for price/capacity extraction...');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Extract price
      try {
        const priceText = await page.evaluate(() => {
          const priceElements = Array.from(document.querySelectorAll('span, div'));
          for (const elem of priceElements) {
            const text = elem.textContent || '';
            if ((text.includes('€') || text.includes('$')) && text.includes('night')) {
              return text;
            }
          }
          return '';
        });

        const priceMatch = priceText.match(/[€$](\d+)/);
        if (priceMatch) {
          price = parseInt(priceMatch[1]);
        }
      } catch (priceError) {
        console.log('Price extraction failed:', priceError);
      }

      // Extract capacity
      try {
        const capacityText = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('li, span, div'));
          for (const elem of elements) {
            const text = elem.textContent || '';
            if (text.match(/\d+\s*guest/i)) {
              return text;
            }
          }
          return '';
        });

        const guestMatch = capacityText.match(/(\d+)\s*guest/i);
        if (guestMatch) {
          capacity = parseInt(guestMatch[1]);
        }
      } catch (capacityError) {
        console.log('Capacity extraction failed:', capacityError);
      }
    } catch (extractError) {
      console.log('Price/capacity extraction failed, continuing with defaults:', extractError);
      // Don't throw - price and capacity are optional
    }

    console.log('Scraping complete:', {
      title,
      descriptionLength: description.length,
      price,
      capacity,
      amenitiesCount: amenities.length,
      imagesCount: images.length
    });

    return {
      title,
      description,
      price,
      capacity,
      amenities: Array.from(new Set(amenities)).slice(0, 30), // Dedupe and limit
      images: Array.from(new Set(images)).slice(0, 50) // Dedupe and limit to 50 images
    };

  } catch (error) {
    console.error('Scraping error:', error);
    // Only throw if we don't have any data at all
    // If we have at least title and some images, return what we have
    if (title && images.length > 0) {
      console.log('Partial scrape successful, returning available data');
      return {
        title: title || 'Imported Room',
        description: description || 'Imported from Airbnb',
        price: price || null,
        capacity: capacity || null,
        amenities: amenities || [],
        images: images || [],
      };
    }
    throw new Error('Failed to scrape Airbnb listing. The page may have changed or be inaccessible.');
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.log('Error closing browser:', closeError);
      }
    }
  }
}
