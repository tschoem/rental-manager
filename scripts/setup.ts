#!/usr/bin/env node

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolveDatabasePath } from '../lib/db-path';

// Load environment variables from .env file
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

console.log('🚀 Setting up rental manager...\n');

// Check if DATABASE_URL is set
let databaseUrl = process.env.DATABASE_URL?.trim() || '';
if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL is not set in your .env file.');
  console.log('\nPlease create a .env file in the root directory with:');
  console.log('DATABASE_URL="file:./dev.db"\n');
  console.log('Or for other databases:');
  console.log('DATABASE_URL="postgresql://user:password@localhost:5432/dbname"');
  console.log('DATABASE_URL="mysql://user:password@localhost:3306/dbname"\n');
  process.exit(1);
}

// Normalize DATABASE_URL to use absolute path (same logic Prisma uses)
let finalDatabaseUrl = databaseUrl;
if (databaseUrl.startsWith('file:')) {
  try {
    // Resolve the path the same way Prisma does (relative to prisma/ folder)
    const absolutePath = resolveDatabasePath(databaseUrl);
    const dbDir = dirname(absolutePath);
    
    // Ensure the directory exists
    if (!existsSync(dbDir)) {
      console.log(`📁 Creating directory: ${dbDir}`);
      mkdirSync(dbDir, { recursive: true });
    }
    
    // Use absolute path to ensure consistency
    finalDatabaseUrl = `file:${absolutePath}`;
    console.log(`📂 Database will be created/used at: ${absolutePath}`);
    console.log(`   (Resolved using same logic as Prisma)\n`);
    
    // Update .env file with absolute path for consistency
    if (existsSync(envPath)) {
      let envContent = readFileSync(envPath, 'utf-8');
      // Update DATABASE_URL if it's different
      if (envContent.includes('DATABASE_URL=')) {
        const updatedContent = envContent.replace(
          /DATABASE_URL=.*/,
          `DATABASE_URL="${finalDatabaseUrl}"`
        );
        if (updatedContent !== envContent) {
          writeFileSync(envPath, updatedContent, 'utf-8');
          console.log(`📝 Updated .env file with absolute DATABASE_URL for consistency\n`);
        }
      }
    }
  } catch (error: any) {
    console.error(`❌ Error resolving database path: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log(`📂 Using database URL: ${databaseUrl.substring(0, 50)}...`);
}

// Set DATABASE_URL in environment for Prisma commands
process.env.DATABASE_URL = finalDatabaseUrl;

try {
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: finalDatabaseUrl }
  });
  console.log('✓ Prisma Client generated\n');

  console.log('🗄️  Creating database schema...');
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: finalDatabaseUrl }
  });
  console.log('✓ Database schema created\n');
  
  // Verify the database was created in the correct location
  if (finalDatabaseUrl.startsWith('file:')) {
    const dbPath = finalDatabaseUrl.replace(/^file:/, '');
    if (existsSync(dbPath)) {
      console.log(`✅ Verified: Database file exists at ${dbPath}\n`);
    } else {
      console.warn(`⚠️  Warning: Database file not found at expected location: ${dbPath}`);
      console.warn('   It may have been created in a different location. Check your DATABASE_URL.\n');
    }
  }

  console.log('✅ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run "npm run setup-admin" to create an admin user (optional)');
  console.log('2. Start your development server with "npm run dev"\n');
} catch (error) {
  console.error('\n❌ Setup failed:', error);
  process.exit(1);
}

