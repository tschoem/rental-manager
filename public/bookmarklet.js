/**
 * Airbnb Import Bookmarklet
 * 
 * Instructions:
 * 1. Copy this entire file content
 * 2. Create a new bookmark in your browser
 * 3. Edit the bookmark and paste this code as the URL (prefixed with javascript:)
 * 4. When on an Airbnb listing page, click the bookmarklet
 * 5. It will extract data and show a form to send to your rental manager
 * 
 * Usage: javascript:(function(){...})();
 */

(function() {
  // Configuration - Update this with your app URL
  const APP_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://your-app.vercel.app'; // Update this!

  // Extract data from the page
  function extractData() {
    const data = {
      title: '',
      description: '',
      price: null,
      capacity: null,
      amenities: [],
      images: [],
      airbnbUrl: window.location.href,
    };

    // Extract title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const h1 = document.querySelector('h1');
    data.title = ogTitle?.getAttribute('content') || h1?.textContent?.trim() || 'Imported Room';

    // Extract description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    data.description = ogDesc?.getAttribute('content') || 'Imported from Airbnb';

    // Extract images
    const ogImages = document.querySelectorAll('meta[property="og:image"]');
    ogImages.forEach(meta => {
      const url = meta.getAttribute('content');
      if (url && !data.images.includes(url)) {
        data.images.push(url.split('?')[0]);
      }
    });

    // Try to extract from JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach(script => {
      try {
        const json = JSON.parse(script.textContent || '{}');
        if (json['@type'] === 'Product' || json['@type'] === 'LodgingBusiness') {
          if (json.name) data.title = json.name;
          if (json.description && json.description.length > data.description.length) {
            data.description = json.description;
          }
          if (json.image) {
            const images = Array.isArray(json.image) ? json.image : [json.image];
            images.forEach(img => {
              if (img && !data.images.includes(img)) {
                data.images.push(img.split('?')[0]);
              }
            });
          }
          if (json.offers?.price) {
            data.price = parseFloat(String(json.offers.price).replace(/[^0-9.]/g, ''));
          }
          if (json.occupancy?.maxOccupancy) {
            data.capacity = parseInt(json.occupancy.maxOccupancy);
          }
          if (json.amenityFeature) {
            json.amenityFeature.forEach((amenity) => {
              if (amenity.name) {
                data.amenities.push(amenity.name);
              }
            });
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    // Try to extract amenities from the page
    const amenityElements = document.querySelectorAll('[data-testid*="amenity"], [class*="amenity"]');
    amenityElements.forEach(elem => {
      const text = elem.textContent?.trim();
      if (text && text.length > 2 && text.length < 100 && !data.amenities.includes(text)) {
        data.amenities.push(text);
      }
    });

    return data;
  }

  // Show form overlay
  function showForm(data) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    const form = document.createElement('div');
    form.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    `;

    form.innerHTML = `
      <h2 style="margin-top: 0;">Import to Rental Manager</h2>
      <p style="color: #666; margin-bottom: 1.5rem;">Review the extracted data and click "Import" to send to your rental manager.</p>
      
      <div style="margin-bottom: 1rem;">
        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Property ID:</label>
        <input type="text" id="propertyId" placeholder="Enter your property ID" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;" required />
      </div>

      <div style="margin-bottom: 1rem;">
        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Title:</label>
        <input type="text" id="title" value="${data.title.replace(/"/g, '&quot;')}" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;" />
      </div>

      <div style="margin-bottom: 1rem;">
        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Description:</label>
        <textarea id="description" rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">${data.description.replace(/"/g, '&quot;')}</textarea>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Price:</label>
          <input type="number" id="price" value="${data.price || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;" />
        </div>
        <div>
          <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Capacity:</label>
          <input type="number" id="capacity" value="${data.capacity || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;" />
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Amenities (${data.amenities.length} found):</label>
        <textarea id="amenities" rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">${data.amenities.join('\\n')}</textarea>
      </div>

      <div style="margin-bottom: 1rem;">
        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Images (${data.images.length} found):</label>
        <textarea id="images" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.875rem; font-family: monospace;">${data.images.slice(0, 10).join('\\n')}</textarea>
      </div>

      <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
        <button type="button" id="cancelBtn" style="flex: 1; padding: 0.75rem; background: #f0f0f0; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;">Cancel</button>
        <button type="button" id="importBtn" style="flex: 1; padding: 0.75rem; background: #0070f3; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">Import</button>
      </div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    // Handle cancel
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Handle import
    document.getElementById('importBtn')?.addEventListener('click', async () => {
      const propertyId = (document.getElementById('propertyId') as HTMLInputElement)?.value;
      if (!propertyId) {
        alert('Please enter a Property ID');
        return;
      }

      const importData = {
        propertyId,
        title: (document.getElementById('title') as HTMLInputElement)?.value || data.title,
        description: (document.getElementById('description') as HTMLTextAreaElement)?.value || data.description,
        price: (document.getElementById('price') as HTMLInputElement)?.value || data.price,
        capacity: (document.getElementById('capacity') as HTMLInputElement)?.value || data.capacity,
        amenities: (document.getElementById('amenities') as HTMLTextAreaElement)?.value.split('\\n').filter(a => a.trim()),
        images: (document.getElementById('images') as HTMLTextAreaElement)?.value.split('\\n').filter(i => i.trim()),
        airbnbUrl: data.airbnbUrl,
      };

      try {
        // Open new window with import form
        const importUrl = `${APP_URL}/admin/properties/${propertyId}/import/manual?data=${encodeURIComponent(JSON.stringify(importData))}`;
        window.open(importUrl, '_blank');
        document.body.removeChild(overlay);
      } catch (e) {
        alert('Error: ' + (e instanceof Error ? e.message : String(e)));
      }
    });
  }

  // Extract and show form
  try {
    const data = extractData();
    showForm(data);
  } catch (e) {
    alert('Error extracting data: ' + (e instanceof Error ? e.message : String(e)));
  }
})();

