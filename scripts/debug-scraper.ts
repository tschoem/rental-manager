import { scrapeAirbnbListing } from "../lib/airbnb-scraper";

const url = "https://www.airbnb.ie/rooms/51243476";

async function main() {
    console.log("Starting debug scrape for:", url);
    try {
        const data = await scrapeAirbnbListing(url);
        console.log("Scrape result:", {
            title: data.title,
            imageCount: data.images.length,
            images: data.images.slice(0, 5) // Log first 5
        });
    } catch (error) {
        console.error("Scrape failed:", error);
    }
}

main();
