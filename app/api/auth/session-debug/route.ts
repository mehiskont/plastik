import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Create a safe session object with debug info
    const debugSession = {
      authenticated: !!session,
      hasUser: !!session?.user,
      email: session?.user?.email || null,
      userId: session?.user?.id || null,
      expires: session?.expires || null,
      authFlowUsed: "lib/auth.ts integrated config",
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasUrl: !!process.env.NEXTAUTH_URL,
        hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      }
    }
    
    return NextResponse.json({ status: "success", session: debugSession })
  } catch (error) {
    console.error("Session debug error:", error)
    return NextResponse.json(
      { 
        status: "error", 
        message: "Failed to get session information",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}