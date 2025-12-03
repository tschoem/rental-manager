#!/usr/bin/env node

/**
 * Extracts Chromium binaries from @sparticuz/chromium and packages them into public/chromium-pack.tar
 * This runs at build time on Vercel
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { createWriteStream } from 'fs';
import { create } from 'tar';

const chromiumPackagePath = resolve(process.cwd(), 'node_modules/@sparticuz/chromium');
const binPath = join(chromiumPackagePath, 'bin');
const publicDir = resolve(process.cwd(), 'public');
const outputTar = join(publicDir, 'chromium-pack.tar');

async function extractChromium() {
  try {
    console.log('🔍 Checking Chromium package...');

    if (!existsSync(chromiumPackagePath)) {
      console.error('❌ @sparticuz/chromium not found. Make sure it is installed.');
      process.exit(1);
    }

    if (!existsSync(binPath)) {
      console.error('❌ Chromium bin directory not found:', binPath);
      process.exit(1);
    }

    console.log('📦 Extracting Chromium binaries...');

    // Ensure public directory exists
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    // Create tar archive of the bin directory
    await create(
      {
        file: outputTar,
        cwd: chromiumPackagePath,
        gzip: false, // Don't compress, chromium-min will handle it
      },
      ['bin']
    );

    const stats = statSync(outputTar);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Chromium binaries packaged: ${outputTar} (${sizeMB} MB)`);
    console.log('   This file will be served from /chromium-pack.tar at runtime');
  } catch (error) {
    console.error('❌ Failed to extract Chromium:', error);
    process.exit(1);
  }
}

extractChromium();

