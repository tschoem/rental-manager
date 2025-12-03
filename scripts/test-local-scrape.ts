
import { scrapeAirbnbListing } from '../lib/airbnb-scraper';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

const url = process.argv[2];

if (!url) {
  console.error('Please provide an Airbnb URL as an argument');
  console.log('Usage: tsx scripts/test-local-scrape.ts <airbnb-url>');
  process.exit(1);
}

async function run() {
  try {
    console.log('----------------------------------------');
    console.log('🧪 Testing Airbnb Scraper Locally');
    console.log(`TARGET: ${url}`);
    console.log('SIMULATING VERCEL OPTIMIZATIONS: true');
    console.log('----------------------------------------');

    // Force the scraper to use the memory optimizations
    process.env.SIMULATE_VERCEL = 'true';

    const startTime = Date.now();
    const data = await scrapeAirbnbListing(url);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('----------------------------------------');
    console.log(`✅ Scrape Successful in ${duration}s`);
    console.log('----------------------------------------');
    console.log('Title:', data.title);
    console.log('Price:', data.price);
    console.log('Capacity:', data.capacity);
    console.log('Description Length:', data.description.length);
    console.log('Amenities Found:', data.amenities.length);
    console.log('Images Found:', data.images.length);
    console.log('First 3 Images:', data.images.slice(0, 3));
    console.log('----------------------------------------');

  } catch (error) {
    console.error('❌ Scrape Failed:', error);
    if (error instanceof Error) {
        console.error('Stack:', error.stack);
    }
  }
}

run();

