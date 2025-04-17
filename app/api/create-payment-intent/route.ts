import { NextResponse } from "next/server"
import Stripe from "stripe"
import { log } from "@/lib/logger"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(req: Request) {
  const requestTime = new Date().toISOString();
  log(`Payment intent creation request received at ${requestTime}`);
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Missing STRIPE_SECRET_KEY environment variable")
    return NextResponse.json({ error: "Stripe is not properly configured" }, { status: 500 })
  }

  try {
    const { amount, customer, items } = await req.json()

    if (!amount || !customer || !items) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    // Extract tax details and shipping preferences if available
    const taxDetails = customer.taxDetails || false
    const organization = customer.organization || ''
    const taxId = customer.taxId || ''
    const localPickup = customer.localPickup || false

    log("Creating payment intent with items:", JSON.stringify(items));
    
    // Check for client-side refresh tracking
    const refreshCount = req.headers.get('x-refresh-count') || '0';
    const clientId = req.headers.get('x-client-id') || 'unknown';
    log(`Payment intent request metrics: refreshCount=${refreshCount}, clientId=${clientId}, time=${requestTime}`);

    // Create products for each item
    const lineItems = await Promise.all(
      items.map(async (item: any) => {
        const product = await stripe.products.create({
          name: item.title,
          metadata: {
            discogs_id: item.id.toString(),
          },
        })

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(item.price * 100),
          currency: "usd",
        })

        return {
          price: price.id,
          quantity: item.quantity,
        }
      }),
    )

    // Get user info for metadata
    const customerId = req.headers.get('x-user-id') || 'anonymous';
    
    // Create a checkout session first - this will be used on success page
    // Get the origin from the request headers for proper URL construction
    const origin = req.headers.get('origin');
    
    // Implement multiple fallbacks to ensure we always have a valid URL
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://plastik.komeh.tech';
    // Fallback to origin header if available
    if (origin && (!baseUrl || baseUrl === 'undefined')) {
      baseUrl = origin;
      log(`Using origin header for base URL: ${origin}`);
    }
    
    log(`Creating Stripe session with base URL: ${baseUrl}`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
      metadata: {
        userId: customerId,
        customerEmail: customer.email,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerAddress: `${customer.address}, ${customer.city}, ${customer.state} ${customer.postalCode}, ${customer.country}`,
        taxDetails: taxDetails ? "true" : "false",
        organization: organization,
        taxId: taxId,
        localPickup: localPickup ? "true" : "false",
        items: JSON.stringify(
          items.map((item) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            condition: item.condition || 'Used',
          })),
        ),
      },
    });
    
    log("Created checkout session:", session.id);
    
    // Create the payment intent connected to the session
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        sessionId: session.id, // Link to checkout session
        userId: customerId,
        customerEmail: customer.email,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerAddress: `${customer.address}, ${customer.city}, ${customer.state} ${customer.postalCode}, ${customer.country}`,
        taxDetails: taxDetails ? "true" : "false",
        organization: organization,
        taxId: taxId,
        localPickup: localPickup ? "true" : "false",
        items: JSON.stringify(
          items.map((item) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            condition: item.condition || 'Used',
          })),
        ),
      },
    })

    log("Payment intent created:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      items: items.length,
      sessionId: session.id
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      sessionId: session.id // Also return the session ID
    })
  } catch (error) {
    log("Error creating payment intent", error, "error")
    return NextResponse.json(
      { error: "Failed to create payment intent", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

