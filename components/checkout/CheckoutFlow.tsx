"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/contexts/cart-context"
import { CartReview } from "@/components/checkout/CartReview"
import { PaymentForm } from "@/components/checkout/PaymentForm"
import { calculatePriceWithoutFees } from "@/lib/price-calculator"
import { toast } from "@/components/ui/use-toast"
import { calculateShippingCost, calculateTotalWeight } from "@/lib/shipping-calculator"
import type { CustomerInfo } from "@/types/checkout" // Import shared type

const steps = ["DETAILS", "PAYMENT"]
const STORAGE_KEY = "checkout_current_step"

export function CheckoutFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [shippingCost, setShippingCost] = useState(2.99) // Default to Estonian rate
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const [paymentInitTime] = useState(() => new Date().getTime()) // Track when payment form was first loaded
  const router = useRouter()
  const { cart: cartState, clearCart } = useCart()
  const { data: session, status } = useSession()
  const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Early check for empty cart - redirect immediately if cart is empty and not in payment step
  // Only do this if we've completed initial loading (otherwise cart may appear empty before loading)
  if (cartState.items.length === 0 && currentStep !== 1 && initialCheckDone) {
    // Use a useEffect for the redirect to avoid state updates during render
    useEffect(() => {
      console.log('CheckoutFlow: Empty cart detected at render time, redirecting immediately');
      
      // Clear checkout-related storage to ensure fresh start next time
      localStorage.removeItem(STORAGE_KEY);
      
      // Redirect to cart page
      router.replace("/cart"); // Use replace to prevent going back to empty form
    }, [router]);
    
    // Show loading spinner instead of empty form
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3">Redirecting to cart...</p>
      </div>
    );
  }

  // Calculate totals
  // Use the actual price instead of calculating without fees
  const subtotal = cartState.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + shippingCost

  // Cleanup on unmount - ensure we don't leave partial state
  useEffect(() => {
    return () => {
      // If we're unmounting and not through a successful checkout (no items in cart)
      // then we should clean up the checkout state
      if (cartState.items.length === 0) {
        console.log('CheckoutFlow: Cleaning up checkout state on unmount');
        localStorage.removeItem(STORAGE_KEY);
      }
    };
  }, [cartState.items.length]);

  // Always start at the first step when mounting the component
  useEffect(() => {
    // Reset the step to ensure users always start at the beginning
    setCurrentStep(0)
    // Clear any previously saved step
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Load user profile data if logged in
  useEffect(() => {
    async function loadUserProfile() {
      if (status === 'authenticated' && session.user && EXTERNAL_API_URL) {
        try {
          setLoadingProfile(true);
          const savedData = localStorage.getItem("checkout_customer_info");
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Ensure all required fields are present, including localPickup
            setCustomerInfo({
              firstName: parsedData.firstName || '',
              lastName: parsedData.lastName || '',
              email: parsedData.email || '',
              phone: parsedData.phone || '',
              address: parsedData.address || '',
              apartment: parsedData.apartment || '',
              city: parsedData.city || '',
              state: parsedData.state || '',
              postalCode: parsedData.postalCode || '',
              country: parsedData.country || '',
              shippingAddress: parsedData.shippingAddress || parsedData.address || '',
              shippingApartment: parsedData.shippingApartment || parsedData.apartment || '',
              shippingCity: parsedData.shippingCity || parsedData.city || '',
              shippingState: parsedData.shippingState || parsedData.state || '',
              shippingPostalCode: parsedData.shippingPostalCode || parsedData.postalCode || '',
              shippingCountry: parsedData.shippingCountry || parsedData.country || '',
              shippingAddressSameAsBilling: parsedData.shippingAddressSameAsBilling ?? true,
              localPickup: parsedData.localPickup || false, // Add localPickup from saved data
              acceptTerms: parsedData.acceptTerms || false,
              subscribe: parsedData.subscribe || false,
              taxDetails: parsedData.taxDetails || false,
              organization: parsedData.organization || '',
              taxId: parsedData.taxId || ''
            });
            setLoadingProfile(false);
            return;
          }

          const response = await fetch(`${EXTERNAL_API_URL}/api/users/me/profile`);
          if (response.ok) {
            const profile = await response.json();
            if (profile && typeof profile === 'object') {
              // Map profile to CustomerInfo, including localPickup (default to false)
              setCustomerInfo({
                firstName: profile.firstName || profile.name?.split(' ')[0] || '',
                lastName: profile.lastName || profile.name?.split(' ').slice(1).join(' ') || '',
                email: profile.email || '',
                phone: profile.phone || '',
                address: profile.address || '',
                apartment: profile.apartment || '',
                city: profile.city || '',
                state: profile.state || '',
                postalCode: profile.postalCode || '',
                country: profile.country || '',
                shippingAddress: profile.address || '',
                shippingApartment: profile.apartment || '',
                shippingCity: profile.city || '',
                shippingState: profile.state || '',
                shippingPostalCode: profile.postalCode || '',
                shippingCountry: profile.country || '',
                shippingAddressSameAsBilling: true,
                localPickup: profile.localPickup || false, // Add localPickup, default false
                acceptTerms: false,
                subscribe: false,
                taxDetails: profile.taxDetails || false,
                organization: profile.organization || '',
                taxId: profile.taxId || ''
              });
            } else {
              // Initialize with defaults, including localPickup
              setCustomerInfo({
                firstName: '', lastName: '', email: '', phone: '',
                address: '', apartment: '', city: '', state: '', postalCode: '', country: '',
                shippingAddress: '', shippingApartment: '', shippingCity: '', shippingState: '', shippingPostalCode: '', shippingCountry: '',
                shippingAddressSameAsBilling: true, localPickup: false, acceptTerms: false, subscribe: false,
                taxDetails: false, organization: '', taxId: ''
              });
            }
          } else {
            console.error("Failed to fetch user profile:", response.status, await response.text());
            // Initialize with defaults on error, including localPickup
            setCustomerInfo({
              firstName: '', lastName: '', email: '', phone: '',
              address: '', apartment: '', city: '', state: '', postalCode: '', country: '',
              shippingAddress: '', shippingApartment: '', shippingCity: '', shippingState: '', shippingPostalCode: '', shippingCountry: '',
              shippingAddressSameAsBilling: true, localPickup: false, acceptTerms: false, subscribe: false,
              taxDetails: false, organization: '', taxId: ''
            });
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          // Initialize with defaults on exception, including localPickup
          setCustomerInfo({
            firstName: '', lastName: '', email: '', phone: '',
            address: '', apartment: '', city: '', state: '', postalCode: '', country: '',
            shippingAddress: '', shippingApartment: '', shippingCity: '', shippingState: '', shippingPostalCode: '', shippingCountry: '',
            shippingAddressSameAsBilling: true, localPickup: false, acceptTerms: false, subscribe: false,
            taxDetails: false, organization: '', taxId: ''
          });
        } finally {
          setLoadingProfile(false);
        }
      } else if (status !== 'loading') {
        // Initialize with defaults if not authenticated, including localPickup
        setCustomerInfo({
          firstName: '', lastName: '', email: '', phone: '',
          address: '', apartment: '', city: '', state: '', postalCode: '', country: '',
          shippingAddress: '', shippingApartment: '', shippingCity: '', shippingState: '', shippingPostalCode: '', shippingCountry: '',
          shippingAddressSameAsBilling: true, localPickup: false, acceptTerms: false, subscribe: false,
          taxDetails: false, organization: '', taxId: ''
        });
      }
    }
    loadUserProfile();
  }, [status, session, EXTERNAL_API_URL]);

  // Save current step whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentStep.toString())
  }, [currentStep])
  
  // Add a stability monitor to prevent reload loops in the payment step
  useEffect(() => {
    // Only run this for payment step
    if (currentStep !== 1 || !clientSecret) return;
    
    console.log(`Payment step stability monitor initialized at ${new Date().toISOString()}`);
    
    // Store payment step initialization data in sessionStorage to track across page reloads
    const paymentSessionData = {
      clientSecret: clientSecret.substring(0, 10), // Only store prefix for security
      initTime: paymentInitTime,
      lastActive: new Date().getTime()
    };
    sessionStorage.setItem('payment_session_data', JSON.stringify(paymentSessionData));
    
    // Set up interval to keep the connection alive and prevent unintended refreshes
    const keepAliveInterval = setInterval(() => {
      // Update lastActive timestamp
      const currentData = JSON.parse(sessionStorage.getItem('payment_session_data') || '{}');
      currentData.lastActive = new Date().getTime();
      sessionStorage.setItem('payment_session_data', JSON.stringify(currentData));
      
      // Log heartbeat every 20 seconds
      console.log(`Payment session heartbeat: active for ${Math.round((new Date().getTime() - paymentInitTime) / 1000)}s`);
    }, 20000); // Every 20 seconds
    
    // Add visibility change detection for tab switching
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      console.log(`Page visibility changed in checkout: ${isVisible ? 'visible' : 'hidden'} at ${new Date().toISOString()}`);
      
      if (isVisible) {
        // Tab is now visible again - update the session data to prevent refresh
        const currentData = JSON.parse(sessionStorage.getItem('payment_session_data') || '{}');
        currentData.lastActive = new Date().getTime();
        currentData.tabSwitchDetected = true;
        sessionStorage.setItem('payment_session_data', JSON.stringify(currentData));
        console.log(`Tab became visible again - updated payment session data to prevent refresh`);
      }
    };
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    return () => {
      console.log(`Payment step stability monitor shutting down at ${new Date().toISOString()}`);
      clearInterval(keepAliveInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [currentStep, clientSecret, paymentInitTime])

  const handleDetailsSubmit = async (data: CustomerInfo) => {
    setIsLoading(true);
    setCustomerInfo(data);

    // Save checkout info to localStorage for next time
    localStorage.setItem("checkout_customer_info", JSON.stringify(data));

    // If user is logged in, save checkout info to their profile via EXTERNAL API
    if (session?.user && EXTERNAL_API_URL) {
      try {
        // Use PUT method for updating existing resource
        // TODO: Add authentication headers if needed by the external API
        const response = await fetch(`${EXTERNAL_API_URL}/api/users/me/profile`, {
          method: "PUT", // Changed from POST to PUT for update
          headers: {
            "Content-Type": "application/json",
            // Add Authorization header if required:
            // "Authorization": `Bearer ${session.accessToken}`
          },
          // Send the relevant parts of the form data
          // Adjust the body structure based on what the external API expects
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            // Avoid sending email if it shouldn't be updated here, or ensure API handles it
            // email: data.email,
            phone: data.phone,
            address: data.address,
            apartment: data.apartment,
            city: data.city,
            state: data.state,
            country: data.country,
            postalCode: data.postalCode,
            // Include other fields like taxDetails, organization, taxId if the API expects them
            taxDetails: data.taxDetails,
            organization: data.organization,
            taxId: data.taxId
          }),
        });
        if (response.ok) {
          console.log("Saved checkout info to user profile via external API");
        } else {
           console.error("Error saving checkout info to external profile API:", response.status, await response.text());
           // Optionally inform user, but don't block checkout
        }
      } catch (error) {
        console.error("Error saving checkout info to profile (external API):", error);
        // Continue with checkout even if saving to profile fails
      }
    }

    try {
      // Calculate shipping cost based on the selected country and cart items
      const totalWeight = calculateTotalWeight(
        cartState.items.map((item) => ({
          weight: item.weight,
          quantity: item.quantity,
        })),
      );
      
      // Get destination country
      const destinationCountry = data.shippingAddressSameAsBilling ? data.country : data.shippingCountry || data.country;
      console.log(`Calculating shipping to: ${destinationCountry}, sameAddress: ${data.shippingAddressSameAsBilling}`);
      
      // For Estonia, always use flat rate - Check for 'estonia', 'eesti', or 'ee' (country code)
      let shippingCost;
      const countryLower = (destinationCountry || '').toLowerCase();
      
      if (countryLower === 'estonia' || countryLower === 'eesti' || countryLower === 'ee') {
        shippingCost = 2.99; // Fixed rate for Estonia
        console.log(`Using fixed Estonian shipping rate: €${shippingCost}`);
      } else if (!destinationCountry) {
        // Default to Estonian rate if no country
        shippingCost = 2.99;
        console.log(`No country selected, defaulting to Estonian rate: €${shippingCost}`);
      } else {
        shippingCost = calculateShippingCost(totalWeight, destinationCountry);
        console.log(`Calculated international shipping rate: €${shippingCost}`);
      }
      setShippingCost(shippingCost);

      // Create payment intent with updated total including shipping
      // This likely stays as an internal API route (/api/create-payment-intent)
      const paymentIntentResponse = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: subtotal + shippingCost, // Calculate total here to ensure correct amount
          customer: {
            ...data,
            email: session?.user?.email || data.email,
          },
          items: cartState.items.map((item) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
          shipping: shippingCost,
        }),
      });

      if (!paymentIntentResponse.ok) {
         const errorBody = await paymentIntentResponse.text();
         console.error("Payment intent creation failed:", paymentIntentResponse.status, errorBody);
         throw new Error(`Failed to create payment intent: ${paymentIntentResponse.statusText}`);
      }

      const { clientSecret } = await paymentIntentResponse.json();
      if (!clientSecret) {
         console.error("Client secret missing from payment intent response");
         throw new Error("Payment processing setup failed.");
      }
      setClientSecret(clientSecret);
      setCurrentStep(1); // Move to payment step
    } catch (error) {
      console.error("Error during checkout details submission:", error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to proceed to payment. Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Clear checkout-related storage
    localStorage.removeItem(STORAGE_KEY);
    
    // Reset checkout step to ensure a fresh start next time
    setCurrentStep(0);
    
    // Don't clear customer info so it can be used next time
    // localStorage.removeItem("checkout_customer_info")

    // Clear the cart
    clearCart();

    // Clear client secret to prevent trying to reuse it
    setClientSecret(null);

    // Redirect to success page - use replace to prevent going back to checkout
    router.replace("/checkout/success");
  };

  // If cart is empty and not in payment step, redirect to cart
  // Keep this as a backup to the early check
  useEffect(() => {
    // Only redirect if not loading (to prevent redirect during initial cart loading)
    if (cartState.items.length === 0 && currentStep !== 1) {
      console.log('Cart is empty, redirecting to cart page via useEffect');
      localStorage.removeItem(STORAGE_KEY); // Clear checkout-related storage on redirect
      router.replace("/cart"); // Use replace to prevent going back to empty form
    } else {
      console.log('Cart has items:', cartState.items.length);
    }
    setInitialCheckDone(true);
  }, [cartState.items.length, currentStep, router])

  // Show loading indicator while cart is being loaded
  if (!initialCheckDone && cartState.items.length === 0) {
    return <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="ml-3">Loading cart...</p>
    </div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-center items-center gap-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              {index > 0 && <div className="h-px w-16 bg-border mx-2" />}
              <div
                className={`flex items-center gap-2 ${index <= currentStep ? "text-primary" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    index <= currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="font-medium">{step}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mt-8">
        {currentStep === 0 && (
          <CartReview 
            onNext={handleDetailsSubmit} 
            isLoading={isLoading || loadingProfile} 
            initialData={customerInfo} 
          />
        )}
        {currentStep === 1 && clientSecret && (
          <PaymentForm
            key={`payment-form-${clientSecret.substring(0, 10)}`} // Add stable key to prevent unwanted re-renders
            clientSecret={clientSecret}
            total={total}
            subtotal={subtotal}
            shippingCost={shippingCost}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  )
}


