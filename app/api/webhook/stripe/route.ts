// THIS WEBHOOK HANDLER IS DISABLED TO PREVENT CONFLICTS
// The active webhook handler is at /app/api/webhooks/stripe/route.ts
// Original content is saved in this file with .bak extension

import { NextResponse } from "next/server"

export async function POST(req: Request) {
  return NextResponse.json({ 
    message: "This webhook endpoint is disabled to prevent conflicts. Use /api/webhooks/stripe instead." 
  }, { status: 404 })
}
