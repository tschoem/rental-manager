import { resolve, dirname } from 'path';
import { existsSync } from 'fs';

/**
 * Resolves a SQLite DATABASE_URL to an absolute path.
 * 
 * IMPORTANT: Prisma resolves relative paths relative to the prisma/ folder,
 * not the project root. This function mimics that behavior for consistency.
 * 
 * @param databaseUrl - The DATABASE_URL from environment (e.g., "file:./dev.db")
 * @returns The absolute path to the database file
 */
export function resolveDatabasePath(databaseUrl: string): string {
    if (!databaseUrl.startsWith('file:')) {
        throw new Error('DATABASE_URL must start with "file:" for SQLite');
    }

    const filePath = databaseUrl.replace(/^file:/, '');
    
    // If it's already an absolute path, return it
    if (filePath.startsWith('/')) {
        return filePath;
    }

    // Prisma resolves relative paths relative to the prisma/ folder
    // So we need to resolve from the prisma directory
    const prismaDir = resolve(process.cwd(), 'prisma');
    const absolutePath = resolve(prismaDir, filePath);
    
    return absolutePath;
}

/**
 * Converts a relative or absolute path to a DATABASE_URL format.
 * If the path is relative, it's kept relative (Prisma will resolve it from prisma/ folder).
 * If the path is absolute, it's converted to absolute DATABASE_URL.
 * 
 * @param filePath - Relative path (e.g., "./dev.db") or absolute path
 * @returns DATABASE_URL format string
 */
export function toDatabaseUrl(filePath: string): string {
    if (filePath.startsWith('/')) {
        // Absolute path
        return `file:${filePath}`;
    } else {
        // Relative path - keep it relative, Prisma will resolve from prisma/ folder
        return `file:${filePath}`;
    }
}

/**
 * Normalizes a DATABASE_URL to use absolute path.
 * This ensures both setup script and runtime Prisma use the same path.
 * 
 * @param databaseUrl - The DATABASE_URL (can be relative or absolute)
 * @returns Absolute DATABASE_URL
 */
export function normalizeDatabaseUrl(databaseUrl: string): string {
    if (!databaseUrl.startsWith('file:')) {
        return databaseUrl; // Not a file URL, return as-is
    }

    const absolutePath = resolveDatabasePath(databaseUrl);
    return `file:${absolutePath}`;
}

/**
 * Alias for resolveDatabasePath for backward compatibility
 */
export function normalizeDatabasePath(databaseUrl: string): string {
    return resolveDatabasePath(databaseUrl);
}

