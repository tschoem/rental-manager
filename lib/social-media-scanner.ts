import puppeteer from 'puppeteer';

// Helper function to wait/delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface SocialMediaData {
    summary: string;
    images: string[];
    name?: string;
    bio?: string;
    bios?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        linkedin?: string;
        airbnb?: string;
        website?: string;
    };
    concatenatedBios?: string;
}

export async function scanSocialMediaProfiles(urls: {
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    airbnb?: string | null;
    website?: string | null;
}): Promise<SocialMediaData> {
    const results: SocialMediaData = {
        summary: '',
        images: [],
        bios: {}
    };

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // Try to scan each platform
        if (urls.instagram) {
            try {
                const instagramData = await scanInstagram(urls.instagram, browser);
                if (instagramData.summary) {
                    results.bios!.instagram = instagramData.summary;
                    if (!results.summary) results.summary = instagramData.summary;
                }
                if (instagramData.images.length > 0) {
                    results.images.push(...instagramData.images);
                }
            } catch (error) {
                console.warn('Failed to scan Instagram:', error);
            }
        }

        if (urls.facebook) {
            try {
                const facebookData = await scanFacebook(urls.facebook, browser);
                if (facebookData.summary) {
                    results.bios!.facebook = facebookData.summary;
                    if (!results.summary) results.summary = facebookData.summary;
                }
                if (facebookData.images.length > 0) {
                    results.images.push(...facebookData.images);
                }
            } catch (error) {
                console.warn('Failed to scan Facebook:', error);
            }
        }

        if (urls.twitter) {
            try {
                const twitterData = await scanTwitter(urls.twitter, browser);
                if (twitterData.summary) {
                    results.bios!.twitter = twitterData.summary;
                    if (!results.summary) results.summary = twitterData.summary;
                }
                if (twitterData.images.length > 0) {
                    results.images.push(...twitterData.images);
                }
            } catch (error) {
                console.warn('Failed to scan Twitter:', error);
            }
        }

        if (urls.linkedin) {
            try {
                const linkedinData = await scanLinkedIn(urls.linkedin, browser);
                if (linkedinData.summary) {
                    results.bios!.linkedin = linkedinData.summary;
                    if (!results.summary) results.summary = linkedinData.summary;
                }
                if (linkedinData.images.length > 0) {
                    results.images.push(...linkedinData.images);
                }
            } catch (error) {
                console.warn('Failed to scan LinkedIn:', error);
            }
        }

        if (urls.airbnb) {
            try {
                const airbnbData = await scanAirbnb(urls.airbnb, browser);
                if (airbnbData.summary) {
                    results.bios!.airbnb = airbnbData.summary;
                    if (!results.summary) results.summary = airbnbData.summary;
                }
                if (airbnbData.images.length > 0) {
                    results.images.push(...airbnbData.images);
                }
            } catch (error) {
                console.warn('Failed to scan Airbnb:', error);
            }
        }

        if (urls.website) {
            try {
                const websiteData = await scanWebsite(urls.website, browser);
                if (websiteData.summary) {
                    results.bios!.website = websiteData.summary;
                    if (!results.summary) results.summary = websiteData.summary;
                }
                if (websiteData.images.length > 0) {
                    results.images.push(...websiteData.images);
                }
            } catch (error) {
                console.warn('Failed to scan website:', error);
            }
        }

        // Concatenate all bios
        const bioArray: string[] = [];
        if (results.bios) {
            if (results.bios.instagram) bioArray.push(`Instagram: ${results.bios.instagram}`);
            if (results.bios.facebook) bioArray.push(`Facebook: ${results.bios.facebook}`);
            if (results.bios.twitter) bioArray.push(`Twitter: ${results.bios.twitter}`);
            if (results.bios.linkedin) bioArray.push(`LinkedIn: ${results.bios.linkedin}`);
            if (results.bios.airbnb) bioArray.push(`Airbnb: ${results.bios.airbnb}`);
            if (results.bios.website) bioArray.push(`Website: ${results.bios.website}`);
        }
        results.concatenatedBios = bioArray.join('\n\n');

        // Remove duplicate images
        results.images = [...new Set(results.images)];

    } catch (error) {
        console.error('Error in social media scanning:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    return results;
}

async function scanInstagram(url: string, browser: any): Promise<SocialMediaData> {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait a bit for dynamic content to load
        await delay(2000);
        
        // Try to extract bio - try multiple selectors
        const bio = await page.evaluate(() => {
            // Try meta description first
            const metaDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
            if (metaDesc?.content && metaDesc.content.length > 10) {
                return metaDesc.content;
            }
            
            // Try to find bio in page content
            const bioSelectors = [
                'meta[name="description"]',
                '[data-testid="user-bio"]',
                'h1 + div',
                'span[dir="auto"]'
            ];
            
            for (const selector of bioSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent?.trim() || '';
                    if (text.length > 10 && text.length < 500) {
                        return text;
                    }
                }
            }
            
            return '';
        });

        // Try to extract profile image
        const images: string[] = [];
        const profileImage = await page.evaluate(() => {
            const imgElement = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
            return imgElement?.content || '';
        });
        if (profileImage) images.push(profileImage);

        return { summary: bio, images };
    } finally {
        await page.close();
    }
}

async function scanFacebook(url: string, browser: any): Promise<SocialMediaData> {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);
        
        const bio = await page.evaluate(() => {
            const metaDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
            if (metaDesc?.content && metaDesc.content.length > 10) {
                return metaDesc.content;
            }
            
            // Try other selectors
            const bioElement = document.querySelector('[data-testid="profile-bio"]') ||
                             document.querySelector('.profile-bio') ||
                             document.querySelector('meta[name="description"]') as HTMLMetaElement;
            
            if (bioElement) {
                const text = bioElement.textContent?.trim() || (bioElement as HTMLMetaElement).content || '';
                if (text.length > 10 && text.length < 500) {
                    return text;
                }
            }
            
            return '';
        });

        const images: string[] = [];
        const profileImage = await page.evaluate(() => {
            const imgElement = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
            return imgElement?.content || '';
        });
        if (profileImage) images.push(profileImage);

        return { summary: bio, images };
    } finally {
        await page.close();
    }
}

async function scanTwitter(url: string, browser: any): Promise<SocialMediaData> {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);
        
        const bio = await page.evaluate(() => {
            const metaDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
            if (metaDesc?.content && metaDesc.content.length > 10) {
                return metaDesc.content;
            }
            
            // Try Twitter-specific selectors
            const bioElement = document.querySelector('[data-testid="UserDescription"]') ||
                             document.querySelector('.ProfileHeaderCard-bio') ||
                             document.querySelector('meta[name="description"]') as HTMLMetaElement;
            
            if (bioElement) {
                const text = bioElement.textContent?.trim() || (bioElement as HTMLMetaElement).content || '';
                if (text.length > 10 && text.length < 500) {
                    return text;
                }
            }
            
            return '';
        });

        const images: string[] = [];
        const profileImage = await page.evaluate(() => {
            const imgElement = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
            return imgElement?.content || '';
        });
        if (profileImage) images.push(profileImage);

        return { summary: bio, images };
    } finally {
        await page.close();
    }
}

async function scanLinkedIn(url: string, browser: any): Promise<SocialMediaData> {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);
        
        const bio = await page.evaluate(() => {
            const metaDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
            if (metaDesc?.content && metaDesc.content.length > 10) {
                return metaDesc.content;
            }
            
            // Try LinkedIn-specific selectors
            const bioElement = document.querySelector('.text-body-medium.break-words') ||
                             document.querySelector('[data-testid="top-card-summary"]') ||
                             document.querySelector('.pv-about__summary-text') ||
                             document.querySelector('meta[name="description"]') as HTMLMetaElement;
            
            if (bioElement) {
                const text = bioElement.textContent?.trim() || (bioElement as HTMLMetaElement).content || '';
                if (text.length > 10 && text.length < 1000) {
                    return text;
                }
            }
            
            return '';
        });

        const images: string[] = [];
        const profileImage = await page.evaluate(() => {
            const imgElement = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
            return imgElement?.content || '';
        });
        if (profileImage) images.push(profileImage);

        return { summary: bio, images };
    } finally {
        await page.close();
    }
}

async function scanAirbnb(url: string, browser: any): Promise<SocialMediaData> {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(3000); // Wait longer for Airbnb's dynamic content
        
        // Scroll down to trigger lazy loading
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await delay(1000);
        
        // Try to click "Show more" or "Read more" buttons to expand bio
        try {
            const showMoreButtons = await page.$$('button:has-text("Show more"), button:has-text("Read more"), [aria-label*="more"], [class*="ShowMore"]');
            for (const button of showMoreButtons) {
                try {
                    await button.click();
                    await delay(500);
                } catch (e) {
                    // Continue if button click fails
                }
            }
        } catch (e) {
            // Continue if button finding fails
        }
        
        // Also try clicking elements that might expand content
        try {
            const expandElements = await page.$$('[class*="expand"], [class*="Expand"], [class*="show-more"], [data-testid*="expand"]');
            for (const elem of expandElements) {
                try {
                    const text = await page.evaluate(el => el.textContent, elem);
                    if (text && (text.includes('more') || text.includes('Show') || text.includes('Read'))) {
                        await elem.click();
                        await delay(500);
                    }
                } catch (e) {
                    // Continue if click fails
                }
            }
        } catch (e) {
            // Continue if element finding fails
        }
        
        await delay(1000); // Wait for expanded content to load
        
        // Try to extract bio/description
        const bio = await page.evaluate(() => {
            // Try meta description first
            const metaDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
            if (metaDesc?.content && metaDesc.content.length > 10) {
                return metaDesc.content;
            }
            
            // Try meta name description
            const metaNameDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
            if (metaNameDesc?.content && metaNameDesc.content.length > 10) {
                return metaNameDesc.content;
            }
            
            // Try to find host description - Airbnb profile pages have various structures
            const descSelectors = [
                // Profile-specific selectors
                '[data-testid="host-profile-section"]',
                '[data-testid="user-profile-section"]',
                '[data-testid="profile-section"]',
                '[class*="HostProfileSection"]',
                '[class*="UserProfileSection"]',
                '[class*="ProfileSection"]',
                // Generic selectors
                'section[class*="about"]',
                'div[class*="about"]',
                'div[class*="About"]',
                'div[class*="bio"]',
                'div[class*="Bio"]',
                'div[class*="description"]',
                'div[class*="Description"]',
                // Look for paragraphs after headings
                'h2 + div p',
                'h3 + div p',
                'h2 + p',
                'h3 + p',
                // Look for text in common Airbnb structures
                '[class*="UserProfile"] p',
                '[class*="HostProfile"] p',
                '[class*="Profile"] p'
            ];
            
            for (const selector of descSelectors) {
                try {
                    const elements = document.querySelectorAll(selector);
                    for (const element of Array.from(elements)) {
                        const text = element.textContent?.trim() || '';
                        // Filter out very short text, navigation items, and UI elements
                        if (text.length > 20 && 
                            text.length < 2000 && 
                            !text.includes('Show more') &&
                            !text.includes('Show less') &&
                            !text.includes('Read more') &&
                            !text.match(/^\d+/) && // Doesn't start with numbers
                            !text.includes('Verified') &&
                            !text.includes('Joined') &&
                            !text.includes('Response rate')) {
                            return text;
                        }
                    }
                } catch (e) {
                    // Continue to next selector if this one fails
                }
            }
            
            // Filter out review-related elements first
            const reviewIndicators = [
                'review', 'Review', 'rating', 'Rating', 'stars', 'Stars',
                'guest', 'Guest', 'hosted', 'Hosted', 'stay', 'Stay',
                '★★★★', '★★★★★', '★★★★', '★★★', '★★', '★'
            ];
            
            // Look for divs or spans that might contain the bio (Airbnb often uses these)
            // Prioritize elements that are likely to contain narrative bios
            const allElements = document.querySelectorAll('div, span, p, section');
            let bestMatch = '';
            let bestScore = 0;
            
            for (const elem of Array.from(allElements)) {
                // Skip if element has many children (likely a container, not the bio itself)
                if (elem.children.length > 5) continue;
                
                // Skip if element is in a review section
                let parent = elem.parentElement;
                let isInReviewSection = false;
                while (parent) {
                    const parentClass = parent.className?.toLowerCase() || '';
                    const parentId = parent.id?.toLowerCase() || '';
                    if (parentClass.includes('review') || 
                        parentId.includes('review') ||
                        parentClass.includes('rating') ||
                        parentId.includes('rating') ||
                        parent.getAttribute('data-testid')?.toLowerCase().includes('review')) {
                        isInReviewSection = true;
                        break;
                    }
                    parent = parent.parentElement;
                }
                if (isInReviewSection) continue;
                
                const text = elem.textContent?.trim() || '';
                
                // Skip if text contains review indicators
                const hasReviewIndicators = reviewIndicators.some(indicator => 
                    text.includes(indicator)
                );
                if (hasReviewIndicators) continue;
                
                // Skip if text looks like a review (mentions dates, "stayed", "would recommend", etc.)
                const reviewPatterns = [
                    /stayed in/i,
                    /would recommend/i,
                    /great host/i,
                    /wonderful stay/i,
                    /clean and/i,
                    /perfect location/i,
                    /\d+\s*(star|stars)/i,
                    /response time/i,
                    /communication/i
                ];
                if (reviewPatterns.some(pattern => pattern.test(text))) continue;
                
                // Look for longer narrative text (like the user's bio - 100+ characters, 15+ words)
                if (text.length > 100 && 
                    text.length < 2000 &&
                    !text.includes('Show more') &&
                    !text.includes('Show less') &&
                    !text.includes('Read more') &&
                    !text.match(/^[A-Z\s]{1,20}$/) && // Not all caps short text
                    text.split(' ').length > 15 && // Has many words (narrative bio)
                    !text.includes('Verified') &&
                    !text.includes('Response rate') &&
                    !text.includes('Response time') &&
                    !text.includes('Joined in') &&
                    !text.includes('Languages:') &&
                    !text.includes('Work:') &&
                    !text.includes('Location:') &&
                    !text.match(/^\d+/) && // Doesn't start with numbers
                    // Look for narrative patterns (contains periods, commas, narrative words)
                    (text.includes('.') || text.includes(',')) &&
                    // Bonus points for narrative indicators
                    (text.toLowerCase().includes('i ') || 
                     text.toLowerCase().includes('my ') ||
                     text.toLowerCase().includes('then ') ||
                     text.toLowerCase().includes('started') ||
                     text.toLowerCase().includes('ended') ||
                     text.toLowerCase().includes('grew'))) {
                    
                    // Score based on length, word count, and narrative indicators
                    const wordCount = text.split(' ').length;
                    const hasNarrativeIndicators = (
                        text.toLowerCase().includes('then') ||
                        text.toLowerCase().includes('started') ||
                        text.toLowerCase().includes('ended') ||
                        text.toLowerCase().includes('grew') ||
                        text.toLowerCase().includes('decided')
                    ) ? 50 : 0;
                    
                    // Penalize if it mentions review-like things
                    const hasReviewLikeText = (
                        text.toLowerCase().includes('stay') ||
                        text.toLowerCase().includes('guest') ||
                        text.toLowerCase().includes('hosted')
                    ) ? -30 : 0;
                    
                    const score = text.length + (wordCount * 10) + hasNarrativeIndicators + hasReviewLikeText;
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = text;
                    }
                }
            }
            
            if (bestMatch) {
                return bestMatch;
            }
            
            // Last resort: look for any paragraph with substantial text (but exclude reviews)
            const allParagraphs = document.querySelectorAll('p');
            for (const p of Array.from(allParagraphs)) {
                // Skip if in review section
                let parent = p.parentElement;
                let isInReviewSection = false;
                while (parent) {
                    const parentClass = parent.className?.toLowerCase() || '';
                    if (parentClass.includes('review') || parentClass.includes('rating')) {
                        isInReviewSection = true;
                        break;
                    }
                    parent = parent.parentElement;
                }
                if (isInReviewSection) continue;
                
                const text = p.textContent?.trim() || '';
                // Skip review-like text
                if (/stayed|would recommend|great host|wonderful stay|clean and|perfect location/i.test(text)) {
                    continue;
                }
                
                if (text.length > 100 && 
                    text.length < 2000 &&
                    !text.includes('Show more') &&
                    !text.includes('Show less') &&
                    !text.match(/^[A-Z\s]{1,20}$/) && // Not all caps short text
                    text.split(' ').length > 15 && // Has many words (narrative)
                    !text.includes('Response rate') &&
                    !text.includes('Response time') &&
                    (text.includes('.') || text.includes(','))) { // Has narrative structure
                    return text;
                }
            }
            
            return '';
        });

        // Extract images
        const images: string[] = [];
        
        // Profile image
        const profileImage = await page.evaluate(() => {
            const imgElement = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
            return imgElement?.content || '';
        });
        if (profileImage) images.push(profileImage);

        // Try to get additional images from the profile
        const additionalImages = await page.evaluate(() => {
            const imgElements = Array.from(document.querySelectorAll('img[src*="a0.muscache"]'));
            return imgElements
                .map(img => img.src)
                .filter(src => src && src.startsWith('http'))
                .slice(0, 5);
        });
        images.push(...additionalImages);

        return { summary: bio, images };
    } finally {
        await page.close();
    }
}

async function scanWebsite(url: string, browser: any): Promise<SocialMediaData> {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Try to find about/bio section
        const bio = await page.evaluate(() => {
            // Look for common about/bio selectors
            const selectors = [
                'meta[name="description"]',
                'meta[property="og:description"]',
                '.about',
                '#about',
                '[class*="bio"]',
                '[id*="bio"]'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    if (element instanceof HTMLMetaElement) {
                        return element.content;
                    }
                    return element.textContent?.trim() || '';
                }
            }
            return '';
        });

        // Extract images
        const images: string[] = [];
        const pageImages = await page.evaluate(() => {
            const imgElements = Array.from(document.querySelectorAll('img'));
            return imgElements
                .map(img => img.src)
                .filter(src => src && !src.includes('data:') && src.startsWith('http'))
                .slice(0, 10); // Limit to first 10 images
        });
        images.push(...pageImages);

        return { summary: bio, images };
    } finally {
        await page.close();
    }
}

