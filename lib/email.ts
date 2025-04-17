// This file is maintained for backward compatibility
// It redirects to the new implementation in /lib/email/ directory

import { getOrderConfirmationEmail } from "./email/templates";
import { log } from "./logger";

// Import and use Resend with improved error handling
import { Resend } from "resend";

// Get API key from environment with a fallback for hardcoded development
const API_KEY = process.env.RESEND_API_KEY || "re_U2Su4RXX_E72x5WeyUvBmJq3qu6SkV53d";

// Initialize the Resend client
let resend: Resend;
try {
  resend = new Resend(API_KEY);
  
  // Only log once per 100 initializations to reduce spam
  if (Math.random() < 0.01) {
    log(`Resend client initialized with API key: ${API_KEY.substring(0, 8)}...`);
  }
} catch (error) {
  log(`Failed to initialize Resend client: ${error instanceof Error ? error.message : String(error)}`, "error");
  // Create an empty client to prevent crashes - it will handle errors properly when called
  resend = new Resend("");
}

export async function sendOrderConfirmationEmail(to: string, orderDetails: any) {
  log(`Sending order confirmation email to ${to} for order ${orderDetails.orderId}`);
  
  try {
    // IMPORTANT: For development/testing with free Resend account, only send to your own email
    // Must use your own email address for testing as Resend's free tier only allows sending to your own email
    // In production, you would use the actual customer email
    // Always use the actual customer email in production
    const recipientEmail = to;
    
    log(`Using email recipient: ${recipientEmail} - production mode`);
    
    // Ensure we have cover_image field for all items (for email template)
    const enhancedItems = orderDetails.items.map((item: any) => ({
      ...item,
      cover_image: item.cover_image || "/placeholder.svg",
    }));

    const enhancedOrderDetails = {
      ...orderDetails,
      items: enhancedItems
    };

    // Get the HTML from the rich template
    const html = getOrderConfirmationEmail(enhancedOrderDetails);
    
    // Send the email using the verified onboarding domain from Resend
    const response = await resend.emails.send({
      from: "Plastik Records <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Your Order Confirmation - #${orderDetails.orderId}`,
      html: html,
      text: `Thank you for your order #${orderDetails.orderId}! Total: $${orderDetails.total.toFixed(2)}`,
    });
    
    // Extract data and error from response
    const { data, error } = response || { data: null, error: "No response from email service" };
    
    if (error) {
      log(`Failed to send order confirmation email: ${JSON.stringify(error)}`, "error");
      return { success: false, error };
    }
    
    if (!data) {
      log("Email service returned no data or ID", "error");
      return { success: false, error: "No email ID returned" };
    }
    
    log(`Order confirmation email sent successfully. ID: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    log(`Error sending order confirmation email: ${error instanceof Error ? error.message : String(error)}`, "error");
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

