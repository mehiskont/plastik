import { NextResponse } from "next/server"

export async function POST(req: Request) {
  console.log("Test webhook endpoint hit")
  const body = await req.text()
  console.log("Webhook body:", body)

  const signature = req.headers.get("stripe-signature")
  console.log("Stripe signature:", signature)

  return NextResponse.json({ received: true })
}

