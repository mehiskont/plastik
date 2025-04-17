import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { log } from "@/lib/logger"

export async function GET() {
  try {
    // Debug logging
    log("Testing auth configuration", {}, "info");
    
    // Log key environment variables (without exposing values)
    log("Environment variables check:", {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID, 
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET
    }, "info");
    
    // Try to get the current session
    let sessionError = null;
    let session = null;
    
    try {
      session = await getServerSession(authOptions);
    } catch (error) {
      sessionError = error instanceof Error ? error.message : String(error);
      log("Session fetch error", error, "error");
    }
    
    // Get essential auth configuration for debugging
    const config = {
      envVars: {
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        apiBaseUrl: process.env.API_BASE_URL,
        publicApiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        useStandaloneMode: process.env.NEXTAUTH_STANDALONE === "true" || process.env.AUTH_FORCE_FALLBACK === "true",
      },
      session: {
        exists: !!session,
        error: sessionError,
        expires: session?.expires || null,
        user: session?.user ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        } : null,
      },
      auth: {
        debug: authOptions.debug,
        providersConfigured: authOptions.providers.length
      }
    };
    
    log("Auth test complete", {
      sessionExists: !!session,
      userAuthenticated: !!session?.user,
      providers: authOptions.providers.length
    }, "info");
    
    return NextResponse.json({ status: "success", config });
  } catch (error) {
    log("Auth test error:", error, "error");
    return NextResponse.json(
      { 
        status: "error", 
        message: "Failed to fetch auth information",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}