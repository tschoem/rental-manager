import { PrismaClient } from '../generated/client/client'
import { normalizeDatabaseUrl } from './db-path'
import { resolve } from 'path'
import { existsSync } from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Normalize DATABASE_URL to absolute path if it's a SQLite file path
// This ensures consistency between Prisma CLI and Prisma Client
// Prisma resolves relative paths relative to prisma/ folder, so we normalize to absolute
if (process.env.DATABASE_URL?.startsWith('file:')) {
  try {
    process.env.DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL);
  } catch (error) {
    // If normalization fails, use original DATABASE_URL
    // This can happen if the path is already absolute or invalid
  }
}

// For serverless environments (Vercel), help Prisma find the query engine binary
// Prisma looks for the binary in multiple locations, but we can set the path explicitly
if (process.env.VERCEL || process.env.VERCEL_URL) {
  const enginePath = resolve(process.cwd(), 'generated/client/libquery_engine-rhel-openssl-3.0.x.so.node');

  // Set environment variable that Prisma uses to locate the query engine
  // This is the most reliable way to ensure Prisma finds the binary on Vercel
  if (existsSync(enginePath)) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
  } else {
    // Try alternative paths that Prisma might use
    const altPaths = [
      resolve(process.cwd(), 'node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node'),
      resolve(process.cwd(), 'node_modules/@prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node'),
    ];

    for (const altPath of altPaths) {
      if (existsSync(altPath)) {
        process.env.PRISMA_QUERY_ENGINE_LIBRARY = altPath;
        break;
      }
    }
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
