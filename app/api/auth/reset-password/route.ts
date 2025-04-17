import { NextResponse } from "next/server";
import { z } from 'zod';
// import { createPasswordResetToken, resetPassword } from "@/lib/user"; // REMOVE THESE
import { log } from "@/lib/logger";
// import { Resend } from "resend"; // REMOVE - Email sending handled by external API

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// // REMOVE RESEND SETUP
// const apiKey = process.env.RESEND_API_KEY || "";
// log(`Using Resend API key: ${apiKey.substring(0, 8)}...`);
// let resend: Resend;
// try {
//   resend = new Resend(apiKey);
// } catch (error) {
//   log(`Failed to initialize Resend: ${error instanceof Error ? error.message : String(error)}`, "error");
//   resend = new Resend("");
// }

// Validation schema for password reset request
const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

// Validation schema for password reset
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters")
});

// Request a password reset (POST)
export async function POST(request: Request) {
  if (!EXTERNAL_API_URL) {
     log("External API URL not configured", "error");
     return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const result = requestResetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { email } = result.data;

    try {
      // Call the external API to handle reset request and email sending
      const apiResponse = await fetch(`${EXTERNAL_API_URL}/api/auth/reset-password-request`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email }),
      });

      // Log the outcome but don't reveal specifics to the client for security
      if (!apiResponse.ok) {
         const errorBody = await apiResponse.text();
         log(`External API password reset request failed for ${email}: ${apiResponse.status} - ${errorBody}`, "warn");
      } else {
         log(`External API password reset request successful for ${email}`);
      }

      // Always return a generic success message regardless of the API outcome
      return NextResponse.json({
        success: true,
        message: "If your email is registered, you will receive a password reset link shortly"
      });

    } catch (error) {
      log(`Error calling external password reset request API: ${error instanceof Error ? error.message : String(error)}`, "error");
      // Still return generic success for security
      return NextResponse.json({
        success: true,
        message: "If your email is registered, you will receive a password reset link shortly"
      });
    }
  } catch (error) {
    log(`Password reset request processing error: ${error instanceof Error ? error.message : String(error)}`, "error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Complete password reset with token (PUT - should probably be POST based on API endpoint)
// Let's keep PUT for now to match the original structure, but the fetch call will be POST
export async function PUT(request: Request) {
 if (!EXTERNAL_API_URL) {
     log("External API URL not configured", "error");
     return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    try {
      // Call the external API to reset the password
      // NOTE: Using POST as assumed for the external API endpoint structure
      const apiResponse = await fetch(`${EXTERNAL_API_URL}/api/auth/reset-password`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ token, password }),
      });

      if (apiResponse.ok) {
         log(`Password reset successful via external API for token: ${token.substring(0, 6)}...`);
         return NextResponse.json({
           success: true,
           message: "Password has been reset successfully"
         });
      } else {
         // Handle specific errors from the external API if possible
         const errorBody = await apiResponse.json().catch(() => ({ message: "Failed to parse error response" }));
         const errorMessage = errorBody?.message || `External API error ${apiResponse.status}`;
         log(`External API password reset failed for token ${token.substring(0, 6)}...: ${apiResponse.status} - ${errorMessage}`, "error");

         // Map external API errors to frontend responses
         if (apiResponse.status === 400 || apiResponse.status === 404) { // Assuming 400/404 for invalid/expired token
            return NextResponse.json(
               { error: "Invalid token", message: "Password reset link is invalid or has expired" },
               { status: 400 }
            );
         } else {
            // Generic error for other issues
            return NextResponse.json(
               { error: "Password reset failed", message: "Failed to reset your password. Please try again later." },
               { status: 500 } // Internal server error status
            );
         }
      }
    } catch (error) {
      log(`Error calling external password reset API: ${error instanceof Error ? error.message : String(error)}`, "error");
      return NextResponse.json(
        { error: "Password reset failed", message: "An unexpected error occurred." },
        { status: 500 }
      );
    }
  } catch (error) {
    log(`Password reset completion processing error: ${error instanceof Error ? error.message : String(error)}`, "error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}