#!/usr/bin/env node

/**
 * This script automatically updates the Prisma schema provider based on DATABASE_URL
 * It detects the database type from the DATABASE_URL format and updates schema.prisma accordingly
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');

// Get DATABASE_URL from environment (now includes .env file)
const databaseUrl = process.env.DATABASE_URL?.trim() || '';

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL is not set in environment variables.');
  console.error('   This script must run with DATABASE_URL set.');
  console.error('   On Vercel, ensure DATABASE_URL is set in project settings.');
  process.exit(1);
}

// Determine provider from DATABASE_URL format
let provider: string;
if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  provider = 'postgresql';
} else if (databaseUrl.startsWith('mysql://') || databaseUrl.startsWith('mysql2://')) {
  provider = 'mysql';
} else if (databaseUrl.startsWith('sqlite://') || databaseUrl.startsWith('file:')) {
  provider = 'sqlite';
} else if (databaseUrl.startsWith('mongodb://') || databaseUrl.startsWith('mongodb+srv://')) {
  provider = 'mongodb';
} else {
  // Default to sqlite if we can't determine (for local dev)
  provider = 'sqlite';
  console.warn(`⚠️  Could not determine database provider from DATABASE_URL. Defaulting to 'sqlite'.`);
  console.warn(`   DATABASE_URL format: ${databaseUrl.substring(0, 50)}...`);
  console.warn(`   Supported formats: postgresql://, mysql://, file:, sqlite://`);
}

// Read the current schema
let schemaContent = readFileSync(schemaPath, 'utf-8');

// Check current provider
const currentProviderMatch = schemaContent.match(/provider\s*=\s*["'](\w+)["']/);
const currentProvider = currentProviderMatch ? currentProviderMatch[1] : null;

// Only update if provider has changed
if (currentProvider !== provider) {
  // Replace the provider line
  schemaContent = schemaContent.replace(
    /provider\s*=\s*["']\w+["']/,
    `provider = "${provider}"`
  );

  // Write the updated schema
  writeFileSync(schemaPath, schemaContent, 'utf-8');

  console.log(`✅ Updated Prisma schema: ${currentProvider || 'unknown'} → ${provider}`);
  console.log(`   Detected from DATABASE_URL: ${databaseUrl.substring(0, 50)}...`);
  console.log(`   ⚠️  IMPORTANT: Prisma Client will be regenerated next in the build process`);
} else {
  console.log(`✓ Prisma schema already configured for ${provider}`);
}

