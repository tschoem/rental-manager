#!/usr/bin/env tsx

/**
 * Test script to simulate Vercel environment locally and test the scraper
 * Usage: SIMULATE_VERCEL=true tsx scripts/test-scraper.ts <airbnb-url> [gallery-url]
 */

import { scrapeAirbnbListing } from '../lib/airbnb-scraper';

const url = process.argv[2];
const galleryUrl = process.argv[3];

if (!url) {
  console.error('Usage: SIMULATE_VERCEL=true tsx scripts/test-scraper.ts <airbnb-url> [gallery-url]');
  process.exit(1);
}

console.log('Testing Airbnb scraper...');
console.log(`URL: ${url}`);
console.log(`Gallery URL: ${galleryUrl || 'none'}`);
console.log(`SIMULATE_VERCEL: ${process.env.SIMULATE_VERCEL || 'false'}`);
console.log('');

scrapeAirbnbListing(url, galleryUrl, (stage, message, progress, log) => {
  console.log(`[${stage}] ${progress}% - ${message}`);
  if (log) {
    console.log(`  Log: ${log}`);
  }
})
  .then((result) => {
    console.log('\n=== SCRAPING RESULT ===');
    console.log(`Title: ${result.title}`);
    console.log(`Description (${result.description.length} chars): ${result.description.substring(0, 200)}...`);
    console.log(`Price: ${result.price || 'N/A'}`);
    console.log(`Capacity: ${result.capacity || 'N/A'}`);
    console.log(`Amenities (${result.amenities.length}):`, result.amenities);
    console.log(`Images (${result.images.length}):`, result.images.slice(0, 5).map(url => url.substring(0, 80) + '...'));
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== SCRAPING ERROR ===');
    console.error(error);
    process.exit(1);
  });

