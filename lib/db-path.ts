import { resolve, dirname, basename } from 'path';
import { existsSync } from 'fs';

/**
 * Checks if we're running in a serverless environment (Vercel, AWS Lambda, etc.)
 * where the file system is read-only except for /tmp
 */
function isServerlessEnvironment(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.VERCEL_URL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    // Check if we're in a read-only filesystem by trying to detect /var/task
    process.cwd().startsWith('/var/task')
  );
}

/**
 * Resolves a SQLite DATABASE_URL to an absolute path.
 * 
 * IMPORTANT: Prisma resolves relative paths relative to the prisma/ folder,
 * not the project root. This function mimics that behavior for consistency.
 * 
 * On serverless platforms (Vercel, AWS Lambda), automatically uses /tmp directory
 * since the regular file system is read-only.
 * 
 * @param databaseUrl - The DATABASE_URL from environment (e.g., "file:./dev.db")
 * @returns The absolute path to the database file
 */
export function resolveDatabasePath(databaseUrl: string): string {
  if (!databaseUrl.startsWith('file:')) {
    throw new Error('DATABASE_URL must start with "file:" for SQLite');
  }

  const filePath = databaseUrl.replace(/^file:/, '');

  // If it's already an absolute path, check if we need to redirect to /tmp
  if (filePath.startsWith('/')) {
    // On serverless, if the path is not in /tmp, redirect it there
    if (isServerlessEnvironment() && !filePath.startsWith('/tmp')) {
      const dbName = basename(filePath);
      return `/tmp/${dbName}`;
    }
    return filePath;
  }

  // On serverless environments, use /tmp directory
  if (isServerlessEnvironment()) {
    const dbName = filePath.replace(/^\.\//, ''); // Remove leading ./
    return `/tmp/${dbName}`;
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

