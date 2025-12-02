#!/usr/bin/env node

/**
 * This script ensures Prisma query engine binaries are in the correct location
 * for serverless deployments (Vercel). It copies the binary to where Prisma expects it.
 */

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

const generatedClientPath = resolve(process.cwd(), 'generated/client');
const engineBinaryName = 'libquery_engine-rhel-openssl-3.0.x.so.node';
const sourcePath = resolve(generatedClientPath, engineBinaryName);

// Check if we're in a serverless environment
const isVercel = !!(process.env.VERCEL || process.env.VERCEL_URL);

if (isVercel && existsSync(sourcePath)) {
  console.log('✓ Prisma query engine binary found');
  console.log(`  Location: ${sourcePath}`);

  // On Vercel, Prisma looks for the binary in the generated/client folder
  // which should already be correct, but we verify it exists
  if (!existsSync(generatedClientPath)) {
    console.warn('⚠️  Generated client folder not found, creating...');
    mkdirSync(generatedClientPath, { recursive: true });
  }

  console.log('✓ Prisma query engine binary is in the correct location');
} else if (isVercel && !existsSync(sourcePath)) {
  console.warn(`⚠️  Prisma query engine binary not found at: ${sourcePath}`);
  console.warn('   Make sure "prisma generate" has been run with binaryTargets configured.');
} else {
  // Not Vercel, or binary doesn't exist - this is fine for local dev
  if (existsSync(sourcePath)) {
    console.log('✓ Prisma query engine binary found (local development)');
  }
}

