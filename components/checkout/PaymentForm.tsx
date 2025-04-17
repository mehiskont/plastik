"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  clientSecret: string
  total: number
  subtotal: number
  shippingCost: number
  onSuccess: () => void
}

function StripePaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mountTimestamp] = useState(() => new Date().getTime())
  
  // Setup effect to monitor for component remounts and expirations
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side rendering
    
    console.log(`StripePaymentForm mounted at ${new Date().toISOString()}`);
    
    // Check if there was a previous instance
    const lastRender = localStorage.getItem('stripe_payment_form_last_render');
    if (lastRender) {
      const timeDiff = mountTimestamp - parseInt(lastRender, 10);
      console.log(`Time since last StripePaymentForm render: ${timeDiff}ms`);
      
      if (timeDiff < 5000) {
        console.log(`⚠️ Rapid re-rendering detected in StripePaymentForm - possible reload loop`);
      }
    }
    
    // Store current render timestamp
    localStorage.setItem('stripe_payment_form_last_render', mountTimestamp.toString());
    
    // Check for payment intent expiration - usually Stripe payment intents expire after 1 hour
    // but we can detect if something is triggering more frequent reloads
    const checkExpirationInterval = setInterval(() => {
      const now = new Date().getTime();
      const uptime = now - mountTimestamp;
      console.log(`StripePaymentForm uptime: ${uptime}ms (${uptime/1000}s)`);
      
      // If we're approaching the 1 minute mark, log this for debugging
      if (uptime > 55000 && uptime < 65000) {
        console.log(`⚠️ StripePaymentForm approaching 1 minute uptime - watch for potential refresh`);
      }
    }, 10000); // Check every 10 seconds
    
    // Add event listener for tab visibility changes
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      console.log(`Page visibility changed: ${isVisible ? 'visible' : 'hidden'} at ${new Date().toISOString()}`);
      
      if (isVisible) {
        // Tab is now visible again - check if we need to preserve the form state
        console.log(`Tab became visible again - preserving payment form state`);
        // Set a flag to indicate we've detected a tab visibility change
        sessionStorage.setItem('payment_form_tab_switch_detected', 'true');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      console.log(`StripePaymentForm unmounting at ${new Date().toISOString()} - uptime: ${(new Date().getTime() - mountTimestamp)/1000}s`);
      clearInterval(checkExpirationInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mountTimestamp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError(null)
    console.log("Payment submission started");

    try {
      console.log("Calling elements.submit()");
      const { error: submitError } = await elements.submit()
      if (submitError) {
        console.error("Submit error:", submitError);
        throw new Error(submitError.message)
      }

      // Get stored session ID if available
      const storedSessionId = localStorage.getItem('checkout_session_id');
      console.log("Retrieved stored session ID:", storedSessionId ? "Available" : "Not available");
      
      console.log("Calling stripe.confirmPayment()");
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Include session_id query parameter to help success page create order
          return_url: `${window.location.origin}/success?session_id=${encodeURIComponent(storedSessionId || '')}`,
        },
        redirect: 'if_required', // Only redirect if 3D Secure is required
      })

      if (paymentError) {
        console.error("Payment error:", paymentError);
        throw new Error(paymentError.message)
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment complete without redirect, manually navigate to success page
        console.log("Payment succeeded without redirect, navigating to success page");
        window.location.href = "/checkout/success";
      } else if (paymentIntent) {
        console.log(`Payment status: ${paymentIntent.status}`);
        // For other statuses, call the success handler which might redirect
        onSuccess();
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setIsLoading(false)
      console.log("Payment submission completed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="mt-6">
        <Button type="submit" disabled={!stripe || isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </div>
    </form>
  )
}

export function PaymentForm({ clientSecret, total, subtotal, shippingCost, onSuccess }: PaymentFormProps) {
  // Extract session ID from URL - it's appended to the URL after successful payment intent creation
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  
  // Use state for tracking mount time rather than just a variable
  const [componentMountTime] = useState(() => new Date().getTime());
  // Track whether a tab switch has occurred
  const [tabSwitchOccurred, setTabSwitchOccurred] = useState(false);
  
  // Add debugging to track component mount time and detect reloads
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side rendering
    
    const mountTime = new Date().toISOString();
    console.log(`PaymentForm mounted at ${mountTime} with clientSecret: ${clientSecret?.substring(0, 10)}...`);
    
    // Record mount time in localStorage to detect reloads
    localStorage.setItem('payment_form_mount_time', mountTime);
    localStorage.setItem('payment_form_client_secret_prefix', clientSecret?.substring(0, 10) || 'none');
    
    // Check if this is a reload
    const previousMountTime = localStorage.getItem('payment_form_previous_mount');
    if (previousMountTime) {
      const timeDiff = new Date().getTime() - new Date(previousMountTime).getTime();
      console.log(`PaymentForm reload detected. Previous mount was ${timeDiff}ms ago (${previousMountTime})`);
    }
    
    // Store current mount time as previous for next reload detection
    localStorage.setItem('payment_form_previous_mount', mountTime);
    
    // Add visibility change detection for tab switching at parent form level
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      console.log(`Page visibility changed in payment form: ${isVisible ? 'visible' : 'hidden'} at ${new Date().toISOString()}`);
      
      if (isVisible) {
        setTabSwitchOccurred(true);
        // Add a flag to indicate tab switching has occurred
        sessionStorage.setItem('payment_form_tab_switched', 'true');
        // Preserve payment intent data
        localStorage.setItem('payment_form_preserved_client_secret', clientSecret?.substring(0, 10) || 'none');
        localStorage.setItem('payment_form_preserved_time', new Date().toISOString());
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clientSecret]);
  
  // Store the session ID in localStorage so we can use it on redirect
  if (sessionId) {
    localStorage.setItem('checkout_session_id', sessionId);
    console.log("Stored checkout session ID:", sessionId);
  }
  
  const options: any = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#dc2626",
      },
    },
  }

  // Monitor component initialization timing for Stripe Elements
  const [elementsInitTimestamp] = useState(() => new Date().getTime());
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side rendering
    
    console.log(`Stripe Elements about to initialize at ${new Date().toISOString()}`);
    
    // Check if Stripe options have changed since last render
    const lastOptionsJson = localStorage.getItem('stripe_elements_last_options');
    const currentOptionsJson = JSON.stringify({
      clientSecretPrefix: clientSecret?.substring(0, 10),
      total,
    });
    
    if (lastOptionsJson && lastOptionsJson !== currentOptionsJson) {
      console.log(`Stripe Elements options changed since last render. This could indicate a payment intent refresh.`);
    }
    
    // Store current options for comparison on next render
    localStorage.setItem('stripe_elements_last_options', currentOptionsJson);
    
    return () => {
      console.log(`Stripe Elements container unmounting at ${new Date().toISOString()} - lifetime: ${(new Date().getTime() - elementsInitTimestamp)/1000}s`);
    };
  }, [clientSecret, total, elementsInitTimestamp]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-6">Payment Information</h2>

      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <p className="text-sm text-muted-foreground">
          Test Card: 4242 4242 4242 4242
          <br />
          Expiry: Any future date
          <br />
          CVC: Any 3 digits
        </p>
      </div>

      {/* Use a memoized wrapper with a stable key to prevent recreation */}
      <div className="stripe-elements-container" id={`stripe-container-${clientSecret?.substring(0, 10)}`}>
        <Elements 
          stripe={stripePromise} 
          options={{
            ...options,
            // Add flags to improve stability
            loader: 'always',
            // Enforce 'auto' mode which matches the Elements appearance to its container
            appearance: {
              ...options.appearance,
              theme: 'stripe',
              variables: {
                ...options.appearance?.variables,
                colorPrimary: "#dc2626",
              },
            },
            // Add persistence for tab switching
            persistenceDisabled: false
          }} 
          key={`elements-${clientSecret?.substring(0, 10)}`}
        >
          <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
        {tabSwitchOccurred && (
          <div className="mt-2 p-2 bg-amber-50 text-amber-800 rounded text-sm">
            It looks like you switched tabs and came back. If your payment form data is missing, please refresh the page to restore it.
          </div>
        )}
      </div>
      
      {/* Add a hidden timestamp for debugging refresh issues */}
      <div className="sr-only" data-payment-form-loaded={new Date().toISOString()} 
           data-client-secret-prefix={clientSecret?.substring(0, 10)}>
        Payment form loaded at {new Date().toISOString()}
      </div>
    </div>
  )
}

