/**
 * Ensures the Prisma schema provider matches the DATABASE_URL
 * This must run before any Prisma Client is instantiated
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

let schemaChecked = false;

export function ensureSchemaProvider(): void {
  // Only check once per process
  if (schemaChecked) {
    return;
  }
  schemaChecked = true;

  // Only run in Node.js environment (not browser)
  if (typeof window !== 'undefined') {
    return;
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return; // Can't determine provider without DATABASE_URL
  }

  try {
    const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');

    // Determine provider from DATABASE_URL
    let provider: string;
    if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
      provider = 'postgresql';
    } else if (databaseUrl.startsWith('mysql://') || databaseUrl.startsWith('mysql2://')) {
      provider = 'mysql';
    } else if (databaseUrl.startsWith('sqlite://') || databaseUrl.startsWith('file:')) {
      provider = 'sqlite';
    } else {
      provider = 'sqlite'; // Default
    }

    // Read current schema
    let schemaContent = readFileSync(schemaPath, 'utf-8');
    const currentProviderMatch = schemaContent.match(/provider\s*=\s*["'](\w+)["']/);
    const currentProvider = currentProviderMatch ? currentProviderMatch[1] : null;

    // Update if needed
    if (currentProvider !== provider) {
      schemaContent = schemaContent.replace(
        /provider\s*=\s*["']\w+["']/,
        `provider = "${provider}"`
      );
      writeFileSync(schemaPath, schemaContent, 'utf-8');

      // Check if generated Prisma Client has wrong provider embedded
      try {
        const fs = require('fs');
        const generatedClassPath = resolve(process.cwd(), 'generated/client/internal/class.ts');
        if (fs.existsSync(generatedClassPath)) {
          const generatedContent = fs.readFileSync(generatedClassPath, 'utf-8');
          // Check if the generated client has the wrong provider
          const wrongProviderMatch = generatedContent.match(/"activeProvider":\s*"(\w+)"/);
          const generatedProvider = wrongProviderMatch ? wrongProviderMatch[1] : null;

          if (generatedProvider && generatedProvider !== provider) {
            // Prisma Client was generated with wrong provider - needs regeneration
            console.error(`\n❌ CRITICAL: Prisma Client was generated with "${generatedProvider}" provider but DATABASE_URL is "${provider}"`);
            console.error(`   The generated Prisma Client has the wrong provider embedded.`);
            console.error(`   Solution: Delete the generated folder and rebuild:`);
            console.error(`   1. Delete: rm -rf generated`);
            console.error(`   2. Rebuild: npm run build`);
            console.error(`   Or on Vercel: Trigger a new deployment\n`);

            // Throw error to prevent using wrong Prisma Client
            throw new Error(`Prisma Client provider mismatch: generated with "${generatedProvider}" but DATABASE_URL is "${provider}". Please regenerate Prisma Client by deleting the 'generated' folder and rebuilding.`);
          }
        }
      } catch (checkError: any) {
        // If check fails, throw the error to prevent using wrong client
        if (checkError.message.includes('provider mismatch')) {
          throw checkError;
        }
        // Otherwise, just log warning
        console.warn(`⚠️  Schema provider updated from "${currentProvider}" to "${provider}"`);
        console.warn(`   Prisma Client may need to be regenerated. Run: prisma generate`);
      }
    }
  } catch (error) {
    // Silently fail - schema might not be accessible or already correct
  }
}

