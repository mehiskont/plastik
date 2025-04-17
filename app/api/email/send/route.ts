import { NextResponse } from "next/server"
import { Resend } from "resend"
import { log } from "@/lib/logger"

// Direct endpoint for testing basic email functionality

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, subject, text } = body
    
    if (!to || !subject || !text) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: to, subject, text" 
      }, { status: 400 })
    }
    
    // Get API key from environment with a fallback for development
    const apiKey = process.env.RESEND_API_KEY || "re_U2Su4RXX_E72x5WeyUvBmJq3qu6SkV53d"
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: "RESEND_API_KEY is not configured" 
      }, { status: 500 })
    }
    
    log(`Direct email test: Using API key ${apiKey.substring(0, 8)}...`)
    
    // Initialize Resend directly
    const resend = new Resend(apiKey)
    
    // Simple HTML email
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #333; text-align: center;">Plastik Records Test Email</h1>
        <p>${text}</p>
        <p style="color: #666; text-align: center; margin-top: 30px; font-size: 12px;">
          This is a test email from Plastik Records.
        </p>
      </div>
    `
    
    try {
      // Send the email using Resend's verified onboarding domain
      const { data, error } = await resend.emails.send({
        from: "Plastik Records <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
        text: text,
      })
      
      if (error) {
        log(`Direct email test failed: ${JSON.stringify(error)}`, "error")
        return NextResponse.json({ success: false, error }, { status: 500 })
      }
      
      log(`Direct email test succeeded. ID: ${data?.id}`)
      
      return NextResponse.json({ 
        success: true, 
        message: `Email sent successfully to ${to}`,
        id: data?.id
      })
    } catch (sendError) {
      log(`Error sending email: ${sendError instanceof Error ? sendError.message : String(sendError)}`, "error")
      return NextResponse.json({ 
        success: false, 
        error: sendError instanceof Error ? sendError.message : "Unknown error sending email" 
      }, { status: 500 })
    }
  } catch (error) {
    log(`Error in direct email test: ${error instanceof Error ? error.message : String(error)}`, "error")
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 400 })
  }
}

// For direct browser testing
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const to = searchParams.get("to")
  const subject = searchParams.get("subject") || "Test Email from Plastik Records"
  const text = searchParams.get("text") || "This is a test email from the Plastik Records API."
  
  if (!to) {
    return NextResponse.json({ 
      success: false, 
      error: "Missing required 'to' parameter" 
    }, { status: 400 })
  }
  
  // Create a request body and call the POST handler
  const body = { to, subject, text }
  const mockRequest = new Request(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  
  return POST(mockRequest)
}