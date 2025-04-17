import { Resend } from "resend"
import { getOrderConfirmationEmail } from "./templates"
import type { OrderDetails } from "@/types/order"
import { log } from "@/lib/logger"

// Get API key from environment with a fallback for hardcoded development
const API_KEY = process.env.RESEND_API_KEY || "re_U2Su4RXX_E72x5WeyUvBmJq3qu6SkV53d"

// Initialize the Resend client
let resend: Resend
try {
  resend = new Resend(API_KEY)
  log(`Resend client initialized with API key: ${API_KEY.substring(0, 8)}...`)
} catch (error) {
  log(`Failed to initialize Resend client: ${error instanceof Error ? error.message : String(error)}`, "error")
  // Create an empty client to prevent crashes - it will handle errors properly when called
  resend = new Resend("")
}

export async function sendOrderConfirmationEmail(to: string, orderDetails: OrderDetails) {
  log(`Sending order confirmation email to ${to} for order ${orderDetails.orderId}`)
  
  try {
    // Validate the API key is set
    if (!process.env.RESEND_API_KEY) {
      log("RESEND_API_KEY is not set in environment variables", "error")
      return { success: false, error: "Email API key is not configured" }
    }
    
    // Logs for debugging
    log(`Using Resend with API key: ${process.env.RESEND_API_KEY.substring(0, 8)}...`)
    
    // Send the email using the verified onboarding domain from Resend
    const response = await resend.emails.send({
      from: "Plastik Records <onboarding@resend.dev>",
      to: [to],
      subject: `Your Order Confirmation - #${orderDetails.orderId}`,
      html: getOrderConfirmationEmail(orderDetails),
      text: `Thank you for your order #${orderDetails.orderId}! We've received your order and are processing it. Total: $${orderDetails.total.toFixed(2)}`,
    })
    
    // Extract data and error from response
    const { data, error } = response || { data: null, error: "No response from email service" }
    
    if (error) {
      log(`Failed to send order confirmation email: ${JSON.stringify(error)}`, "error")
      return { success: false, error }
    }
    
    if (!data) {
      log("Email service returned no data or ID", "error")
      return { success: false, error: "No email ID returned" }
    }
    
    log(`Order confirmation email sent successfully. ID: ${data.id}`)
    return { success: true, id: data.id }
  } catch (error) {
    log(`Error sending order confirmation email: ${error instanceof Error ? error.message : String(error)}`, "error")
    // Don't throw error - return failure status instead
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}


