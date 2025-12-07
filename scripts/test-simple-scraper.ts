#!/usr/bin/env tsx

/**
 * Quick test script for the simple scraper
 * Usage: tsx scripts/test-simple-scraper.ts <airbnb-url>
 */

import { scrapeAirbnbListingSimple } from '../lib/airbnb-scraper-simple';

const url = process.argv[2];

if (!url) {
  console.error('Usage: tsx scripts/test-simple-scraper.ts <airbnb-url>');
  console.error('Example: tsx scripts/test-simple-scraper.ts "https://www.airbnb.ie/rooms/51243476"');
  process.exit(1);
}

console.log('Testing Simple Airbnb Scraper...');
console.log(`URL: ${url}`);
console.log('');

scrapeAirbnbListingSimple(url, (stage, message, progress, log) => {
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
    console.log(`\nAmenities (${result.amenities.length}):`);
    if (result.amenities.length > 0) {
      result.amenities.forEach((amenity, idx) => {
        console.log(`  ${idx + 1}. ${amenity}`);
      });
    } else {
      console.log('  (none found)');
    }
    console.log(`\nImages (${result.images.length}):`);
    result.images.slice(0, 5).forEach((url, idx) => {
      console.log(`  ${idx + 1}. ${url.substring(0, 80)}...`);
    });
    if (result.images.length > 5) {
      console.log(`  ... and ${result.images.length - 5} more`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== SCRAPING ERROR ===');
    console.error(error);
    if (error instanceof Error) {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  });

