import { NextResponse } from "next/server"
import { z } from "zod"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { log } from "@/lib/logger"

const testEmailSchema = z.object({
  email: z.string().email(),
  type: z.enum(["confirmation", "simple"]),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Add more logging for debug
    console.log("Email test request body:", body)
    
    const { email, type } = testEmailSchema.parse(body)
    
    // Sample order data for test emails
    const testOrderDetails = {
      orderId: "TEST1234",
      items: [
        {
          title: "Test Vinyl Record - Awesome Album",
          quantity: 1,
          price: 24.99,
          condition: "Mint (M)",
          cover_image: "/placeholder.svg",
          artist: "Test Artist",
          label: "Test Label",
          format: "Vinyl, LP, Album"
        },
        {
          title: "Another Great Record - Limited Edition",
          quantity: 2,
          price: 29.99,
          condition: "Near Mint (NM)",
          cover_image: "/placeholder.svg",
          artist: "Another Artist",
          label: "Great Label",
          format: "Vinyl, 12\", EP"
        }
      ],
      total: 84.97,
      shippingAddress: {
        name: "Test Customer",
        line1: "123 Test Street",
        line2: "Apt 5",
        city: "Test City",
        state: "TS",
        postal_code: "12345",
        country: "Estonia"
      }
    }
    
    let result;
    try {
      if (type === "confirmation") {
        log(`Sending test order confirmation email to ${email}`)
        result = await sendOrderConfirmationEmail(email, testOrderDetails)
      } else if (type === "simple") {
        // Use the direct Resend API for a simple test
        const Resend = require('resend').Resend;
        const apiKey = process.env.RESEND_API_KEY || "re_U2Su4RXX_E72x5WeyUvBmJq3qu6SkV53d";
        const resend = new Resend(apiKey);
        
        log(`Sending simple test email to ${email} using direct Resend API`)
        
        try {
          const { data, error } = await resend.emails.send({
            from: 'Plastik Records <onboarding@resend.dev>',
            to: [email],
            subject: 'Simple Test Email',
            html: '<strong>This is a test email from Plastik Records</strong>',
            text: 'This is a test email from Plastik Records',
          });
          
          if (error) {
            log(`Direct Resend API error: ${JSON.stringify(error)}`, "error")
            return NextResponse.json({ 
              success: false, 
              error: `Direct API error: ${JSON.stringify(error)}`
            }, { status: 500 })
          }
          
          log(`Direct email sent successfully, ID: ${data?.id}`)
          return NextResponse.json({ 
            success: true, 
            message: `Simple test email sent to ${email}`,
            id: data?.id
          })
        } catch (directError) {
          log(`Exception in direct Resend API call: ${directError instanceof Error ? directError.message : String(directError)}`, "error")
          return NextResponse.json({ 
            success: false, 
            error: `Direct API exception: ${directError instanceof Error ? directError.message : String(directError)}`
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({ 
          success: false, 
          error: `Invalid email type: ${type}`
        }, { status: 400 })
      }
      
      // Make sure result has required properties
      if (!result || typeof result.success === 'undefined') {
        log("Email function returned invalid result object", "error")
        return NextResponse.json({ 
          success: false, 
          error: "Invalid response from email service" 
        }, { status: 500 })
      }
      
      if (!result.success) {
        return NextResponse.json({ 
          success: false, 
          error: result.error || "Unknown email error" 
        }, { status: 500 })
      }
    } catch (emailError) {
      log(`Unexpected error in email send process: ${emailError instanceof Error ? emailError.message : String(emailError)}`, "error")
      return NextResponse.json({ 
        success: false, 
        error: emailError instanceof Error ? emailError.message : "Unexpected email error" 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Test ${type} email sent successfully to ${email}`,
      id: result.id
    })
  } catch (error) {
    log(`Error sending test email: ${error instanceof Error ? error.message : String(error)}`, "error")
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 400 })
  }
}