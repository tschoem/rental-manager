import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

// Import the same check function used in the route
// We'll duplicate the logic to avoid circular dependencies
function isDatabaseConfigured(): boolean {
    return !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');
}

/**
 * Checks if authentication is properly configured
 * Uses the same check as the NextAuth route handler
 */
function isAuthConfigured(): boolean {
    // First check: database must be configured (same as canInitializeNextAuth in route)
    if (!isDatabaseConfigured()) {
        return false;
    }
    
    // Second check: authOptions must be available
    if (!authOptions) {
        return false;
    }
    
    // Third check: NEXTAUTH_SECRET should be set (though route has fallback)
    // We'll be lenient here since the route handles it
    
    return true;
}

/**
 * Safely gets the server session, checking if authOptions is available.
 * Redirects to home page if database/auth is not configured.
 */
export async function getAuthSession() {
    // Check if auth is configured before attempting to use it
    if (!isAuthConfigured() || !authOptions) {
        // Return null instead of redirecting here - let requireAuth handle it
        return null;
    }
    
    // Additional validation: check if authOptions has valid structure
    // This helps catch issues before calling getServerSession
    if (!authOptions.secret || !authOptions.providers || authOptions.providers.length === 0) {
        return null;
    }
    
    // NEXTAUTH_URL should now always be set (set automatically in route.ts)
    // Wrap the entire call in a try-catch to handle any errors
    // getServerSession internally makes an API call which may fail
    try {
        // Call getServerSession - it may throw synchronously or asynchronously
        const session = await getServerSession(authOptions);
        return session;
    } catch (error: any) {
        // Handle "Invalid URL" errors or other NextAuth configuration errors
        const errorMessage = String(error?.message || error || '');
        const errorCode = error?.code;
        const errorName = error?.name;
        
        // Check for various error patterns that indicate auth is not configured
        const isConfigError = 
            errorMessage.includes('Invalid URL') || 
            errorCode === 'ERR_INVALID_URL' ||
            errorMessage.includes('DATABASE_URL') ||
            errorMessage.includes('datasource') ||
            errorMessage.includes('You must provide a nonempty URL') ||
            errorMessage.includes('CLIENT_FETCH_ERROR') ||
            (errorName === 'TypeError' && (errorMessage.includes('URL') || errorMessage.includes('Invalid')));
        
        if (isConfigError) {
            // Database/auth not properly configured, return null
            // requireAuth will handle the redirect
            // Only log in development to avoid noise in production
            if (process.env.NODE_ENV === 'development') {
                console.warn('Auth configuration error caught:', errorMessage.substring(0, 100));
            }
            return null;
        }
        // Re-throw other errors
        throw error;
    }
}

/**
 * Gets the server session and redirects to signin if not authenticated.
 * @param callbackUrl - Optional callback URL after signin
 */
export async function requireAuth(callbackUrl?: string) {
    const session = await getAuthSession();
    
    if (!session) {
        // If no session, check if it's because auth isn't configured
        // If so, redirect to home page (setup page)
        if (!isAuthConfigured() || !authOptions) {
            redirect("/");
        }
        
        // Otherwise, redirect to the sign-in page (not the API route)
        // This avoids the 503 error when database isn't configured
        const url = callbackUrl 
            ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
            : "/auth/signin";
        redirect(url);
    }
    
    return session;
}

