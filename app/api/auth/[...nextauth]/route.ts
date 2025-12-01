import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Prisma } from "@/generated/client/client"
import { NextRequest, NextResponse } from "next/server"

// Automatically set NEXTAUTH_URL if not provided
// This fixes "Invalid URL" errors once and for all
if (!process.env.NEXTAUTH_URL) {
  if (process.env.NODE_ENV === 'production') {
    // In production, we should have NEXTAUTH_URL set, but if not, try to infer from VERCEL_URL
    if (process.env.VERCEL_URL) {
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
    } else {
      // Fallback - should be set in production, but this prevents crashes
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      console.warn('NEXTAUTH_URL not set in production. Using fallback. Please set NEXTAUTH_URL in your environment variables.');
    }
  } else {
    // In development, default to localhost
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }
}

// Check if database is configured (just checks if DATABASE_URL is set)
function isDatabaseConfigured(): boolean {
  return !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');
}

// Check if NextAuth can be initialized (database is required, secret can have fallback)
// This is a synchronous check that only verifies DATABASE_URL is set
// Actual database connectivity is checked in route handlers
function canInitializeNextAuth(): boolean {
  return isDatabaseConfigured();
}

// Async function to check if database is actually accessible
async function isDatabaseAccessible(): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }

  try {
    // Try a simple query to verify the database is accessible
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error: any) {
    // If connection fails, database is not accessible
    // Log the error for debugging but don't throw
    console.warn('Database accessibility check failed:', error?.message || error);
    return false;
  }
}

// Try to create adapter, but handle errors gracefully
let adapter: any = undefined;
try {
  if (isDatabaseConfigured()) {
    adapter = PrismaAdapter(prisma);
  }
} catch (error) {
  // If adapter creation fails, we'll proceed without it
  // Since we're using JWT strategy, adapter is optional
  console.warn('PrismaAdapter initialization failed, proceeding without adapter:', error);
}

export function createAuthOptions(): NextAuthOptions {
  return {
    ...(adapter && { adapter }),
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
    providers: [
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Check if database is configured before trying to query
          if (!isDatabaseConfigured()) {
            throw new Error('Database not configured. Please run setup first.');
          }

          try {
            // Find user by email
            const user = await prisma.user.findUnique({
              where: { email: credentials.email }
            });

            if (!user || !user.password) {
              return null;
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              user.password
            );

            if (!isValidPassword) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name
            };
          } catch (error) {
            // Handle database errors
            if (error instanceof Prisma.PrismaClientInitializationError ||
              (error instanceof Error && (
                error.message.includes('DATABASE_URL') ||
                error.message.includes('datasource') ||
                error.message.includes('You must provide a nonempty URL')
              ))) {
              throw new Error('Database not configured. Please run setup first.');
            }
            throw error;
          }
        }
      })
    ],
    callbacks: {
      session: async ({ session, token }) => {
        if (session?.user && token?.sub) {
          // @ts-ignore
          session.user.id = token.sub;
        }
        return session;
      },
      jwt: async ({ token, user }) => {
        if (user) {
          token.sub = user.id;
        }
        return token;
      }
    },
    pages: {
      signIn: '/auth/signin',
    },
    session: {
      strategy: 'jwt'
    }
  }
}

// Only create authOptions and handler if we can initialize NextAuth
let authOptions: NextAuthOptions | null = null;
let handler: any = null;

if (canInitializeNextAuth()) {
  try {
    authOptions = createAuthOptions();
    handler = NextAuth(authOptions);
  } catch (error) {
    // If NextAuth initialization fails, we'll handle it in the route handlers
    console.error('NextAuth initialization error:', error);
    authOptions = null;
    handler = null;
  }
}

// Export authOptions for use in other routes (may be null if not configured)
export { authOptions };

// Helper to check if error is a database configuration error
function isDatabaseConfigError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Error && (
      error.message.includes('DATABASE_URL') ||
      error.message.includes('datasource') ||
      error.message.includes('You must provide a nonempty URL') ||
      error.message.includes('Invalid URL')
    ));
}

// Helper to create error response
function createErrorResponse(message: string, status: number = 503) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest, context: any) {
  // Check if this is a session request - return empty session instead of error
  const url = new URL(req.url);
  const isSessionRequest = url.pathname.includes('/api/auth/session');
  const isSignInRequest = url.pathname.includes('/api/auth/signin');
  const isErrorRequest = url.pathname.includes('/api/auth/error');
  const isProvidersRequest = url.pathname.includes('/api/auth/providers');

  // For error requests, redirect to sign-in page with error message
  if (isErrorRequest) {
    const errorParam = url.searchParams.get('error') || '';
    const callbackUrl = url.searchParams.get('callbackUrl') || '/admin';
    let redirectUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    if (errorParam) {
      redirectUrl += `&error=${encodeURIComponent(errorParam)}`;
    }
    const baseUrl = new URL(req.url).origin;
    return NextResponse.redirect(new URL(redirectUrl, baseUrl), { status: 307 });
  }

  // For sign-in requests, do a quick check first and redirect if database URL is not set
  if (isSignInRequest && !canInitializeNextAuth()) {
    const callbackUrl = url.searchParams.get('callbackUrl') || '/admin';
    const redirectUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    const baseUrl = new URL(req.url).origin;
    return NextResponse.redirect(new URL(redirectUrl, baseUrl), { status: 307 });
  }

  // Check if database is actually accessible (not just configured)
  let dbAccessible = false;
  try {
    dbAccessible = await isDatabaseAccessible();
  } catch (error) {
    // If database check fails, treat as not accessible
    dbAccessible = false;
  }

  // Early return if NextAuth can't be initialized
  if (!canInitializeNextAuth() || !dbAccessible) {
    // For session requests, return a valid empty session response instead of an error
    if (isSessionRequest) {
      return NextResponse.json({ user: null, expires: null });
    }
    // For providers request, return empty providers object so NextAuth client doesn't fail
    if (isProvidersRequest) {
      return NextResponse.json({});
    }
    // For sign-in requests, redirect to the sign-in page so user can see setup instructions
    if (isSignInRequest) {
      const callbackUrl = url.searchParams.get('callbackUrl') || '/admin';
      const redirectUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      const baseUrl = new URL(req.url).origin;
      return NextResponse.redirect(new URL(redirectUrl, baseUrl), { status: 307 });
    }
    return createErrorResponse('Authentication service unavailable. Database or environment not configured. Please run setup first.');
  }

  if (!handler) {
    // For session requests, return a valid empty session response instead of an error
    if (isSessionRequest) {
      return NextResponse.json({ user: null, expires: null });
    }
    return createErrorResponse('Authentication service unavailable. Please run setup first.');
  }

  try {
    return await handler(req, context);
  } catch (error: any) {
    // Handle JWT decryption errors (usually means session cookie is invalid/encrypted with different secret)
    const isJwtError = error?.message?.includes('decryption operation failed') ||
      error?.code === 'JWT_SESSION_ERROR' ||
      (error instanceof Error && error.message.includes('decryption'));
    
    if (isJwtError) {
      // For session requests with JWT errors, return empty session and clear invalid cookie
      if (isSessionRequest) {
        const response = NextResponse.json({ user: null, expires: null });
        // Clear the invalid session cookie
        response.cookies.delete('next-auth.session-token');
        response.cookies.delete('__Secure-next-auth.session-token');
        return response;
      }
      // For other requests, redirect to sign-in to clear the invalid session
      const callbackUrl = url.searchParams.get('callbackUrl') || '/admin';
      const redirectUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      const baseUrl = new URL(req.url).origin;
      return NextResponse.redirect(new URL(redirectUrl, baseUrl), { status: 307 });
    }

    // For session requests, return empty session on error instead of error response
    if (isSessionRequest) {
      return NextResponse.json({ user: null, expires: null });
    }

    // Catch "Invalid URL" errors which can occur when NextAuth tries to construct URLs
    if (error?.code === 'ERR_INVALID_URL' ||
      (error instanceof Error && error.message.includes('Invalid URL')) ||
      isDatabaseConfigError(error)) {
      return createErrorResponse('Database or environment not configured. Please run setup first.');
    }
    // Re-throw to let NextAuth handle other errors
    throw error;
  }
}

export async function POST(req: NextRequest, context: any) {
  const url = new URL(req.url);
  const isSignInRequest = url.pathname.includes('/api/auth/signin');

  // Check if database is actually accessible (not just configured)
  let dbAccessible = false;
  try {
    dbAccessible = await isDatabaseAccessible();
  } catch (error) {
    // If database check fails, treat as not accessible
    dbAccessible = false;
  }

  // Early return if NextAuth can't be initialized
  if (!canInitializeNextAuth() || !dbAccessible) {
    // For sign-in requests, redirect to sign-in page instead of returning error
    if (isSignInRequest) {
      const callbackUrl = url.searchParams.get('callbackUrl') || '/admin';
      const redirectUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&error=Database not configured`;
      const baseUrl = new URL(req.url).origin;
      return NextResponse.redirect(new URL(redirectUrl, baseUrl), { status: 307 });
    }
    // For signin/signout requests, return an error, but for other requests try to handle gracefully
    return createErrorResponse('Authentication service unavailable. Database or environment not configured. Please run setup first.');
  }

  if (!handler) {
    return createErrorResponse('Authentication service unavailable. Please run setup first.');
  }

  try {
    return await handler(req, context);
  } catch (error: any) {
    // Handle JWT decryption errors (usually means session cookie is invalid/encrypted with different secret)
    const isJwtError = error?.message?.includes('decryption operation failed') ||
      error?.code === 'JWT_SESSION_ERROR' ||
      (error instanceof Error && error.message.includes('decryption'));
    
    if (isJwtError) {
      // For sign-in requests with JWT errors, redirect to sign-in page to clear invalid session
      if (isSignInRequest) {
        const callbackUrl = url.searchParams.get('callbackUrl') || '/admin';
        const redirectUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        const baseUrl = new URL(req.url).origin;
        const response = NextResponse.redirect(new URL(redirectUrl, baseUrl), { status: 307 });
        // Clear the invalid session cookie
        response.cookies.delete('next-auth.session-token');
        response.cookies.delete('__Secure-next-auth.session-token');
        return response;
      }
      // For other requests, return error but suggest clearing cookies
      return createErrorResponse('Session expired or invalid. Please clear your browser cookies and sign in again.', 401);
    }

    // Catch "Invalid URL" errors which can occur when NextAuth tries to construct URLs
    if (error?.code === 'ERR_INVALID_URL' ||
      (error instanceof Error && error.message.includes('Invalid URL')) ||
      isDatabaseConfigError(error)) {
      return createErrorResponse('Database or environment not configured. Please run setup first.');
    }
    // Re-throw to let NextAuth handle other errors
    throw error;
  }
}
