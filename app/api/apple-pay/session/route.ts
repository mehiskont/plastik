import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { total } = await req.json()

    // These values should be stored securely and not hard-coded
    const merchantIdentifier = process.env.APPLE_PAY_MERCHANT_IDENTIFIER
    const merchantCapabilities = ["supports3DS"]
    const supportedNetworks = ["visa", "masterCard", "amex"]

    return NextResponse.json({
      merchantIdentifier,
      merchantCapabilities,
      supportedNetworks,
    })
  } catch (error) {
    console.error("Error creating Apple Pay session:", error)
    return NextResponse.json({ error: "Failed to create Apple Pay session" }, { status: 500 })
  }
}

