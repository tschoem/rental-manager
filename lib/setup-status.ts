import { PrismaClient } from '../generated/client/client';
import { resolve, dirname } from 'path';
import { existsSync, statSync } from 'fs';
import { resolveDatabasePath } from './db-path';

/**
 * Checks the setup status of the application
 * Returns information about which environment variables and setup steps are configured
 */
export interface SetupStatus {
    databaseUrl: {
        configured: boolean;
        value?: string;
    };
    nextAuthSecret: {
        configured: boolean;
    };
    nextAuthUrl: {
        configured: boolean;
        value?: string;
    };
    databaseInitialized: {
        configured: boolean;
        message?: string;
    };
    adminUserExists: {
        configured: boolean;
    };
    smtp: {
        configured: boolean;
        message?: string;
    };
}

export async function getSetupStatus(): Promise<SetupStatus> {
    const databaseUrl = process.env.DATABASE_URL?.trim() || '';
    const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim() || '';
    const nextAuthUrl = process.env.NEXTAUTH_URL?.trim() || '';

    // Check if database is initialized by trying to connect
    let databaseInitialized = false;
    let dbInitMessage: string | undefined;
    let adminUserExists = false;

    if (databaseUrl) {
        // Validate DATABASE_URL format for SQLite
        if (!databaseUrl.startsWith('file:')) {
            dbInitMessage = `Invalid DATABASE_URL format. For SQLite, it should start with "file:". Current value: ${databaseUrl.substring(0, 20)}...`;
        } else {
            // Extract and validate the file path using the same logic as Prisma
            let absolutePath: string;
            
            try {
                // Use the same path resolution logic as Prisma (relative to prisma/ folder)
                absolutePath = resolveDatabasePath(databaseUrl);
                
                // Check if directory exists
                const dbDir = dirname(absolutePath);
                if (!existsSync(dbDir)) {
                    dbInitMessage = `Database directory does not exist: "${dbDir}". Run "npm run setup" to create it, or create the directory manually.`;
                } else {
                    // Check if the database file actually exists and has content
                    // IMPORTANT: Check file existence BEFORE attempting any connection
                    // SQLite will create an empty file if we try to connect to a non-existent path
                    if (!existsSync(absolutePath)) {
                        dbInitMessage = `Database file not found at "${absolutePath}". Run "npm run setup" to create it.`;
                        // Don't proceed with connection attempt - it would create an empty file
                    } else {
                        // Check if file is empty (0 bytes) - SQLite creates empty files on connect
                        const stats = statSync(absolutePath);
                        if (stats.size === 0) {
                            dbInitMessage = `Database file exists but is empty at "${absolutePath}". Run "npm run setup" to initialize it.`;
                            // Don't proceed with connection attempt
                        } else {
                            // File exists and has content - safe to try connecting
                            // Temporarily override DATABASE_URL with absolute path for this check
                            // Prisma resolves relative paths relative to prisma/ folder, so we use absolute path
                            const originalDbUrl = process.env.DATABASE_URL;
                            let testClient: PrismaClient | null = null;
                            try {
                                process.env.DATABASE_URL = `file:${absolutePath}`;
                                
                                testClient = new PrismaClient();
                                await testClient.$connect();
                                
                                // Check if database has tables by querying sqlite_master
                                const tables = await testClient.$queryRaw<Array<{ name: string }>>`
                                    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
                                `;
                                
                                // Database is initialized if it has at least one table
                                if (tables.length > 0) {
                                    databaseInitialized = true;
                                    
                                    // Check if admin user exists while client is connected
                                    try {
                                        const userCount = await testClient.user.count();
                                        adminUserExists = userCount > 0;
                                    } catch (userError) {
                                        // If we can't check users, assume none exist
                                        adminUserExists = false;
                                    }
                                } else {
                                    dbInitMessage = 'Database file exists but has no tables. Run "npm run setup" to create the schema.';
                                }
                            } catch (error: any) {
                                // Extract error details
                                const errorMsg = error?.message || String(error);
                                const errorCode = error?.code || '';
                                
                                // Handle Prisma initialization errors
                                if (error?.message?.includes('You must provide a nonempty URL') ||
                                    error?.message?.includes('datasource') ||
                                    error?.message?.includes('Error validating datasource')) {
                                    dbInitMessage = `Invalid DATABASE_URL format. For SQLite, use: DATABASE_URL="file:./dev.db" or DATABASE_URL="file:./prisma/dev.db"`;
                                } else if (error?.message?.includes('no such file') || 
                                    error?.message?.includes('does not exist') ||
                                    error?.code === 'ENOENT' ||
                                    error?.message?.includes('ENOENT')) {
                                    // Extract the file path from the error or DATABASE_URL
                                    const fileMatch = databaseUrl.match(/file:(.+)/);
                                    const filePath = fileMatch ? fileMatch[1] : 'database file';
                                    dbInitMessage = `Database file not found at "${filePath}". Run "npm run setup" to create it.`;
                                } else if (error?.message?.includes('no such table') ||
                                    error?.message?.includes('SQLITE_ERROR')) {
                                    dbInitMessage = 'Database file exists but tables are missing. Run "npm run setup" to create the schema.';
                                } else if (error?.message?.includes('SQLITE_CANTOPEN') ||
                                    error?.message?.includes('unable to open database') ||
                                    error?.message?.includes('Unable to open the database file') ||
                                    error?.message?.includes('Error code 14')) {
                                    // SQLite error code 14 = SQLITE_CANTOPEN
                                    // Use the resolved absolute path we already calculated
                                    const fileExists = existsSync(absolutePath);
                                    const dirExists = existsSync(dbDir);
                                    
                                    dbInitMessage = `Cannot open database file.\n` +
                                        `Expected location: ${absolutePath}\n` +
                                        `File exists: ${fileExists ? 'Yes' : 'No'}\n` +
                                        `Directory exists: ${dirExists ? 'Yes' : 'No'}\n` +
                                        `DATABASE_URL: ${databaseUrl}\n\n` +
                                        `Possible causes:\n` +
                                        `1. File path mismatch - Prisma resolves paths relative to prisma/ folder\n` +
                                        `2. If DATABASE_URL="file:./dev.db", Prisma looks for prisma/dev.db\n` +
                                        `3. Try using absolute path or "file:../dev.db" from prisma folder\n` +
                                        `4. Or move dev.db to prisma/ folder\n` +
                                        `5. Or use: DATABASE_URL="file:${absolutePath}"`;
                                } else if (error?.message?.includes('SQLITE_BUSY')) {
                                    dbInitMessage = 'Database is locked. Make sure no other process is using it.';
                                } else {
                                    // Provide more details about the error
                                    dbInitMessage = `Database connection failed: ${errorMsg.substring(0, 150)}.\n` +
                                        `Error code: ${errorCode || 'unknown'}\n` +
                                        `Check your DATABASE_URL format. For SQLite, use: DATABASE_URL="file:./dev.db"`;
                                }
                            } finally {
                                // Always disconnect and restore original DATABASE_URL
                                if (testClient) {
                                    try {
                                        await testClient.$disconnect();
                                    } catch (disconnectError) {
                                        // Ignore disconnect errors
                                    }
                                }
                                if (originalDbUrl) {
                                    process.env.DATABASE_URL = originalDbUrl;
                                }
                            }
                        }
                    }
                }
            } catch (pathError: any) {
                // Handle path resolution errors
                dbInitMessage = `Error resolving database path: ${pathError?.message || String(pathError)}`;
            }
        }
    }

    // Check SMTP configuration
    const smtpUser = process.env.SMTP_USER?.trim() || '';
    const smtpPassword = process.env.SMTP_PASSWORD?.trim() || '';
    const smtpConfigured = !!(smtpUser && smtpPassword);
    let smtpMessage: string | undefined;
    
    if (!smtpConfigured) {
        const missingFields: string[] = [];
        if (!smtpUser) missingFields.push('SMTP_USER');
        if (!smtpPassword) missingFields.push('SMTP_PASSWORD');
        smtpMessage = `Missing required SMTP fields: ${missingFields.join(', ')}. Email functionality (password reset, booking notifications) will not work without SMTP configuration.`;
    }

    return {
        databaseUrl: {
            configured: databaseUrl !== '',
            value: databaseUrl ? '***configured***' : undefined,
        },
        nextAuthSecret: {
            configured: nextAuthSecret !== '',
        },
        nextAuthUrl: {
            configured: nextAuthUrl !== '',
            value: nextAuthUrl || undefined,
        },
        databaseInitialized: {
            configured: databaseInitialized,
            message: dbInitMessage,
        },
        adminUserExists: {
            configured: adminUserExists,
        },
        smtp: {
            configured: smtpConfigured,
            message: smtpMessage,
        },
    };
}

export function getRemainingSteps(status: SetupStatus): string[] {
    const steps: string[] = [];

    if (!status.databaseUrl.configured) {
        steps.push('database_url');
    }

    if (!status.nextAuthSecret.configured) {
        steps.push('nextauth_secret');
    }

    if (!status.nextAuthUrl.configured) {
        steps.push('nextauth_url');
    }

    if (status.databaseUrl.configured && !status.databaseInitialized.configured) {
        steps.push('database_init');
    }

    if (!status.smtp.configured) {
        steps.push('smtp');
    }

    return steps;
}

export function isSetupComplete(status: SetupStatus): boolean {
    return (
        status.databaseUrl.configured &&
        status.nextAuthSecret.configured &&
        status.databaseInitialized.configured
    );
}

