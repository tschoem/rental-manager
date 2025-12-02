import { PrismaClient } from '../generated/client/client';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
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

    // Run prisma db push to create the schema
    // This works in both local and Vercel environments
    // Note: In serverless environments, this runs on first request
    // IMPORTANT: Normalize DATABASE_URL to absolute path to ensure Prisma uses the correct path
    // Prisma resolves relative paths relative to prisma/ folder, so we use absolute paths
    const normalizedDatabaseUrl = databaseUrl.startsWith('file:')
      ? normalizeDatabaseUrl(databaseUrl)
      : databaseUrl;

    try {
      // Use --skip-generate since we already generated the client in postinstall
      // Pass normalized DATABASE_URL explicitly to ensure consistency
      execSync('npx prisma db push --accept-data-loss --skip-generate', {
        stdio: process.env.NODE_ENV === 'production' ? 'pipe' : 'inherit', // Suppress output in production
        env: { ...process.env, DATABASE_URL: normalizedDatabaseUrl },
        cwd: process.cwd(), // Run from project root, not prisma folder
        timeout: 30000, // 30 second timeout
      });

      setupCompleted = true;
      setupInProgress = false;
      return { success: true, message: 'Database schema created successfully' };
    } catch (error: any) {
      setupInProgress = false;
      const errorMessage = error?.stderr?.toString() || error?.stdout?.toString() || error?.message || String(error);
      return {
        success: false,
        message: `Failed to create database schema: ${errorMessage.substring(0, 200)}`
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

