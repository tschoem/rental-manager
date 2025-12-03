import { ensureSchemaProvider } from './ensure-schema-provider';
// Ensure schema provider is correct before importing PrismaClient
ensureSchemaProvider();

import { PrismaClient } from '../generated/client/client';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { resolveDatabasePath, normalizeDatabaseUrl } from './db-path';

// Cache to prevent multiple simultaneous setup attempts
let setupInProgress = false;
let setupCompleted = false;

/**
 * Checks if the database has been initialized (has tables)
 */
async function isDatabaseInitialized(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return false;
  }

  // For SQLite, ensure the directory exists
  if (databaseUrl.startsWith('file:')) {
    try {
      const absolutePath = resolveDatabasePath(databaseUrl);
      const dbDir = dirname(absolutePath);

      // Ensure the directory exists
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }
    } catch (error) {
      // If we can't resolve the path, database isn't ready
      return false;
    }
  }

  // Use normalized absolute path for Prisma Client to ensure consistency
  // This prevents path resolution issues between Prisma CLI and Prisma Client
  const normalizedUrl = databaseUrl.startsWith('file:')
    ? normalizeDatabaseUrl(databaseUrl)
    : databaseUrl;

  // Temporarily override DATABASE_URL with normalized path for this check
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = normalizedUrl;

  try {
    const prisma = new PrismaClient();
    await prisma.$connect();

    // Check if database has tables by querying sqlite_master (SQLite) or information_schema (PostgreSQL/MySQL)
    let tables: Array<{ name: string }> = [];

    if (databaseUrl.startsWith('file:')) {
      // SQLite
      tables = await prisma.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `;
    } else {
      // PostgreSQL or MySQL - try to query information_schema
      try {
        if (databaseUrl.startsWith('postgresql:') || databaseUrl.startsWith('postgres:')) {
          const pgTables = await prisma.$queryRaw<Array<{ name: string }>>`
            SELECT table_name as name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          `;
          tables = pgTables;
        } else if (databaseUrl.startsWith('mysql:')) {
          const mysqlTables = await prisma.$queryRaw<Array<{ name: string }>>`
            SELECT table_name as name FROM information_schema.tables 
            WHERE table_schema = DATABASE()
          `;
          tables = mysqlTables;
        }
      } catch (error) {
        // If we can't query information_schema, try a simple query to see if any tables exist
        // This is a fallback - we'll try to query a table that should exist
        try {
          await prisma.user.findFirst({ take: 1 });
          // If this succeeds, database is likely initialized
          await prisma.$disconnect();
          // Restore original DATABASE_URL
          if (originalUrl) process.env.DATABASE_URL = originalUrl;
          return true;
        } catch {
          // If this fails, database is not initialized
        }
      }
    }

    await prisma.$disconnect();
    // Restore original DATABASE_URL
    if (originalUrl) process.env.DATABASE_URL = originalUrl;
    return tables.length > 0;
  } catch (error) {
    // Restore original DATABASE_URL on error
    if (originalUrl) process.env.DATABASE_URL = originalUrl;
    // If connection fails or query fails, database is not initialized
    return false;
  }
}

/**
 * Automatically sets up the database schema if DATABASE_URL is detected and database is not initialized
 * This works in both local development and Vercel deployments
 */
export async function autoSetupDatabase(): Promise<{ success: boolean; message?: string }> {
  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return { success: false, message: 'DATABASE_URL is not set' };
  }

  // Don't auto-setup SQLite on Vercel - it's not recommended
  const isSQLite = databaseUrl.startsWith('file:');
  const isVercel = !!(process.env.VERCEL || process.env.VERCEL_URL);
  if (isSQLite && isVercel) {
    return {
      success: false,
      message: 'SQLite is not recommended on Vercel. Please use PostgreSQL instead. See setup page for details.'
    };
  }

  // Prevent multiple simultaneous setup attempts
  if (setupInProgress) {
    return { success: false, message: 'Database setup already in progress' };
  }

  // If we've already completed setup in this process, skip
  if (setupCompleted) {
    return { success: true, message: 'Database already initialized' };
  }

  try {
    // Check if database is already initialized
    const initialized = await isDatabaseInitialized();
    if (initialized) {
      setupCompleted = true;
      return { success: true, message: 'Database already initialized' };
    }

    // Mark setup as in progress
    setupInProgress = true;

    // For SQLite, ensure the directory exists before running db push
    if (databaseUrl.startsWith('file:')) {
      try {
        const absolutePath = resolveDatabasePath(databaseUrl);
        const dbDir = dirname(absolutePath);

        // On serverless (Vercel), /tmp always exists, but we should still try to create it
        // In case the directory structure is needed
        if (!existsSync(dbDir)) {
          mkdirSync(dbDir, { recursive: true });
        }
      } catch (error) {
        setupInProgress = false;
        return {
          success: false,
          message: `Failed to create database directory: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    // For PostgreSQL/MySQL, use Prisma's programmatic API to push schema
    // This is more reliable than execSync in serverless environments
    const normalizedDatabaseUrl = databaseUrl.startsWith('file:')
      ? normalizeDatabaseUrl(databaseUrl)
      : databaseUrl;

    try {
      // Use Prisma binary directly from node_modules to avoid npx/npm issues
      // This is more reliable in serverless environments like Vercel
      const { execSync } = await import('child_process');
      const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');

      // Try to find prisma CLI in node_modules
      const prismaBinPath = resolve(process.cwd(), 'node_modules/.bin/prisma');
      const prismaCliPath = resolve(process.cwd(), 'node_modules/prisma/build/index.js');

      let command: string;
      if (existsSync(prismaBinPath)) {
        // Use the .bin/prisma script
        command = `"${prismaBinPath}" db push --accept-data-loss --skip-generate --schema="${schemaPath}"`;
      } else if (existsSync(prismaCliPath)) {
        // Use prisma CLI directly
        command = `node "${prismaCliPath.replace('/build/index.js', '/cli.js')}" db push --accept-data-loss --skip-generate --schema="${schemaPath}"`;
      } else {
        // Fallback to npx (may fail on Vercel)
        command = `npx prisma db push --accept-data-loss --skip-generate --schema="${schemaPath}"`;
      }

      execSync(command, {
        stdio: process.env.NODE_ENV === 'production' ? 'pipe' : 'inherit',
        env: { ...process.env, DATABASE_URL: normalizedDatabaseUrl },
        cwd: process.cwd(),
        timeout: 30000,
      });

      setupCompleted = true;
      setupInProgress = false;
      return { success: true, message: 'Database schema created successfully' };
    } catch (error: any) {
      setupInProgress = false;
      const errorMessage = error?.stderr?.toString() || error?.stdout?.toString() || error?.message || String(error);
      return {
        success: false,
        message: `Failed to create database schema: ${errorMessage.substring(0, 300)}`
      };
    }
  } catch (error) {
    setupInProgress = false;
    return {
      success: false,
      message: `Database setup error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Ensures the database is set up, running auto-setup if needed
 * This is the main function to call from your app
 */
export async function ensureDatabaseSetup(): Promise<boolean> {
  const result = await autoSetupDatabase();
  return result.success;
}

