# Troubleshooting Vercel Deployment Issues

## Accessing Vercel Logs

To see the full error message for your import issue:

1. **Via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Navigate to your project
   - Click on the **"Deployments"** tab
   - Click on the latest deployment
   - Click on the **"Functions"** tab
   - Click on any function that shows errors
   - Scroll down to see the **"Logs"** section
   - Look for entries prefixed with `[IMPORT]` - these are our detailed logs

2. **Via Vercel CLI:**
   ```bash
   npm install -g vercel
   vercel login
   vercel logs [your-project-url] --follow
   ```

3. **Real-time Logs:**
   - In Vercel dashboard, go to your project
   - Click **"Functions"** in the sidebar
   - Click on any function
   - View real-time logs as requests come in

## Common Import Errors on Vercel

### 1. Puppeteer/Chrome Issues

**Problem:** Puppeteer requires Chrome binaries which are large and may not work on Vercel by default.

**Symptoms:**
- Errors mentioning "browser", "Chrome", "puppeteer", or "executable"
- Errors about "brotli files" or "/var/task/node_modules/@sparticuz/chromium/bin" not existing
- Timeout errors during scraping
- Function size limit exceeded (50MB limit on Hobby plan)

**Solutions:**

**Option A: Use @sparticuz/chromium-min (✅ Already Implemented)**
The codebase now automatically uses `@sparticuz/chromium-min` on Vercel and regular Puppeteer locally. According to [Vercel's official guide](https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel), `chromium-min` is specifically designed to fit within Vercel's 250MB function limit and is smaller than the full `chromium` package.

**If you see "brotli files" error:**
This means the Chromium binary files aren't being included in the deployment. With `chromium-min`, this should be resolved, but if you still see errors:

1. **Check Function Size:** Vercel has a 250MB limit on Pro plan (50MB on Hobby). `chromium-min` is smaller (~20-30MB) than the full Chromium package. You may need to upgrade to Pro plan if on Hobby.

2. **Use External Service:** Consider using a browser automation service like:
   - Browserless.io
   - ScrapingBee
   - Puppeteer-as-a-Service
   
   These services handle the browser for you and you just make API calls.

3. **Move to Background Job:** Consider moving scraping to a separate service (like a Vercel Cron Job or external service) that runs on a schedule rather than on-demand.

**Current Status:**
- `@sparticuz/chromium-min` and `puppeteer-core` are installed (check `package.json`)
- The code automatically detects Vercel and uses `chromium-min` (smaller, Vercel-optimized)
- `chromium-min` is designed to fit within Vercel's 250MB function limit
- See [Vercel's official Puppeteer guide](https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel) for more details

**Option B: Use External Browser Service**
- Use a service like Browserless.io or ScrapingBee
- Modify the scraper to use their API instead of local Puppeteer

**Option C: Move to Edge Function**
- Consider using Vercel Edge Functions with a different scraping approach
- Or use a separate service/API route for scraping

### 2. Image Storage Issues

**Problem:** Missing `BLOB_READ_WRITE_TOKEN` environment variable.

**Symptoms:**
- Errors mentioning "BLOB", "storage", "ENOENT", or "no such file"
- Images fail to upload/download

**Solution:**
1. Go to Vercel Dashboard → Your Project → Storage
2. Create a Blob store if you haven't already
3. Go to Settings → Environment Variables
4. Add `BLOB_READ_WRITE_TOKEN` with your blob store token
5. Redeploy

### 3. Timeout Issues

**Problem:** Import takes too long (> 10 seconds on Hobby plan, > 60 seconds on Pro).

**Symptoms:**
- Request timeout errors
- Function execution time exceeded

**Solutions:**
- Upgrade to Vercel Pro plan for longer timeouts
- Optimize the scraper to be faster
- Process images in smaller batches
- Consider moving scraping to a background job

### 4. Function Size Limits

**Problem:** Puppeteer + Chrome binaries exceed Vercel's 50MB limit.

**Symptoms:**
- Deployment fails with size errors
- Function too large warnings

**Solutions:**
- Use `@sparticuz/chromium` (smaller than full Chrome)
- Use `puppeteer-core` instead of `puppeteer`
- Move scraping to an external service

## Debugging Steps

1. **Check Logs:** Use the methods above to access Vercel logs
2. **Look for `[IMPORT]` prefixes:** Our enhanced logging shows detailed progress
3. **Check Environment Variables:** Ensure all required vars are set
4. **Test Locally:** Try the import locally first to isolate Vercel-specific issues
5. **Check Function Logs:** Look for the specific error message in logs

## Quick Fixes

### Enable Detailed Logging

The import function now includes detailed logging. All log entries are prefixed with `[IMPORT]` and include:
- Step-by-step progress
- Error details with stack traces
- Environment information
- Image download progress

### Test Import Locally

```bash
# Make sure you have all environment variables set
cp .env.example .env
# Edit .env with your values

# Run the dev server
npm run dev

# Try importing a room
# Check terminal output for detailed logs
```

## Getting Help

When reporting issues, include:
1. Full error message from Vercel logs
2. Environment (Production/Preview)
3. Vercel plan (Hobby/Pro)
4. Any `[IMPORT]` log entries
5. Steps to reproduce

