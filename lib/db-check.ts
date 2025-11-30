import { PrismaClient } from '../generated/client/client';

/**
 * Checks if the database is properly configured and accessible
 * @returns true if database is configured, false otherwise
 */
export async function isDatabaseConfigured(): Promise<boolean> {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
    return false;
  }

  try {
    // Try to create a Prisma client and connect
    const testClient = new PrismaClient();
    await testClient.$connect();
    // Try a simple query to verify the database exists and is accessible
    await testClient.$queryRaw`SELECT 1`;
    await testClient.$disconnect();
    return true;
  } catch (error) {
    // If any error occurs, database is not properly configured
    return false;
  }
}

/**
 * Gets a user-friendly error message for database configuration issues
 */
export function getDatabaseErrorMessage(): string {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
    return 'DATABASE_URL environment variable is not set.';
  }
  return 'Database connection failed. Please check your DATABASE_URL and ensure the database file exists.';
}

