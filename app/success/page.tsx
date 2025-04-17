import { redirect } from "next/navigation"
import Link from "next/link"
import Stripe from "stripe"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { log } from "@/lib/logger"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

// Manual testing flag - kept for now, might need adjustment
const MANUAL_TEST_MODE = true;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id: string }
}) {
  const sessionId = searchParams.session_id

  if (!sessionId && !MANUAL_TEST_MODE) {
    redirect("/")
  }
  
  log(`Success page loaded with session ID: ${sessionId || 'MANUAL_TEST_MODE'}`);

  let session;
  
  if (MANUAL_TEST_MODE && !sessionId) {
    // Create a mock session for testing
    log("MANUAL TEST MODE: Creating mock session");
    session = {
      id: "test_" + Date.now(),
      payment_status: "paid",
      status: "complete",
      metadata: {
        userId: "cm7niharu0000pvp2o2pd9ebv", // Your user ID from logs
        items: JSON.stringify([{
          id: "123456",
          title: "Test Record",
          price: 29.99,
          quantity: 1,
          condition: "Near Mint",
          cover_image: "/placeholder.svg"
        }])
      },
      customer_details: {
        email: "mehiskont@gmail.com", // Your email for testing
        name: "Test Customer"
      },
      shipping_details: {
        name: "Test Customer",
        address: {
          line1: "123 Test St",
          city: "Test City",
          state: "TS",
          postal_code: "12345",
          country: "US"
        }
      },
      amount_total: 2999,
      line_items: {
        data: [{
          amount_subtotal: 2999,
          quantity: 1,
          price: {
            product: {
              name: "Test Record",
              metadata: {
                discogsId: "123456"
              }
            }
          }
        }]
      }
    };
  } else {
    try {
      // Retrieve the real session from Stripe
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "payment_intent", "line_items.data.price.product"],
      });
    } catch (stripeError) {
      log(`Error retrieving Stripe session: ${stripeError instanceof Error ? stripeError.message : String(stripeError)}`, "error");
      // For test mode, create a mock session instead of failing
      if (MANUAL_TEST_MODE) {
        log("Falling back to mock session");
        session = {
          id: sessionId || "test_" + Date.now(),
          payment_status: "paid",
          status: "complete",
          metadata: {
            userId: "cm7niharu0000pvp2o2pd9ebv", 
            items: JSON.stringify([{
              id: "123456",
              title: "Test Record",
              price: 29.99,
              quantity: 1,
              condition: "Near Mint",
              cover_image: "/placeholder.svg"
            }])
          },
          customer_details: {
            email: "mehiskont@gmail.com",
            name: "Test Customer"
          },
          shipping_details: {
            name: "Test Customer",
            address: {
              line1: "123 Test St",
              city: "Test City",
              state: "TS",
              postal_code: "12345",
              country: "US"
            }
          },
          amount_total: 2999
        };
      } else {
        // In production, redirect on error
        redirect("/checkout?error=session_error");
      }
    }
  }

  if (!session) {
    log(`No session found for ID: ${sessionId}`)
    redirect("/")
  }

  // Extract necessary information for display
  const customerName = session.customer_details?.name || "Valued Customer";
  const customerEmail = session.customer_details?.email;
  const orderTotal = session.amount_total ? session.amount_total / 100 : 0;

  // Display confirmation message
  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-green-600">Payment Successful!</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Thank you for your order, {customerName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center">
            Your order confirmation and details have been sent to <span className="font-medium">{customerEmail || "your email address"}</span>.
          </p>
          <div className="text-center text-lg font-medium">
            Order Total: ${orderTotal.toFixed(2)}
          </div>
          <div className="text-center pt-4">
            <Button asChild>
              <Link href="/records">Continue Shopping</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

