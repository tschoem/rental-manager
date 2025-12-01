import { PrismaClient } from '../generated/client/client'
import { normalizeDatabaseUrl } from './db-path'

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

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
