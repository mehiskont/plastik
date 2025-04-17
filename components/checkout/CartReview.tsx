"use client"

import type React from "react"

import Image from "next/image"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { calculatePriceWithoutFees } from "@/lib/price-calculator"
import { calculateShippingCost, calculateTotalWeight } from "@/lib/shipping-calculator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useMemo, useEffect } from "react"
import Select from "react-select"
import countryList from "react-select-country-list"
import { useRouter } from "next/navigation"
import type { CustomerInfo } from "@/types/checkout"

interface CartReviewProps {
  onNext: (data: CustomerInfo) => void
  isLoading: boolean
  initialData: CustomerInfo | null
}

export function CartReview({ onNext, isLoading, initialData }: CartReviewProps) {
  const { state } = useCart()
  const router = useRouter()
  
  // Early return with redirection if cart is empty
  // But only if we've completed loading to prevent false empty cart detection
  if (state.items.length === 0 && !state.isLoading) {
    console.log('CartReview: No items in cart, redirecting immediately');
    // Use useEffect for the actual redirection to avoid React state updates during render
    useEffect(() => {
      router.replace('/cart'); // Replace to prevent back navigation to empty form
    }, [router]);
    
    // Show loading spinner instead of empty form
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3">Redirecting to cart...</p>
      </div>
    );
  }
  
  const [shippingAddressSameAsBilling, setShippingAddressSameAsBilling] = useState(true)
  const [localPickup, setLocalPickup] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [subscribe, setSubscribe] = useState(false)
  const [taxDetails, setTaxDetails] = useState(false)
  const [billingCountry, setBillingCountry] = useState("")
  const [shippingCountry, setShippingCountry] = useState("")
  const [shippingCost, setShippingCost] = useState(2.99) // Default to Estonian rate

  const countryOptions = useMemo(() => countryList().getData(), [])

  // Backup redirect - only runs after cart is confirmed to be empty and not loading
  useEffect(() => {
    if (state.items.length === 0 && !state.isLoading) {
      console.log('CartReview: No items in cart and not loading, redirecting via useEffect');
      router.replace('/cart'); // Use replace instead of push
    }
  }, [state.items.length, state.isLoading, router]);

  // Use the actual price instead of calculating without fees
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + shippingCost

  // Calculate shipping cost when component mounts
  useEffect(() => {
    console.log('CartReview: Initializing shipping cost to €2.99 (Estonian rate)');
    setShippingCost(2.99);
  }, []);

  // Calculate shipping cost when country, items, or localPickup changes
  useEffect(() => {
    // If local pickup is selected, set shipping cost to 0 and return early
    if (localPickup) {
      console.log('CartReview: Local pickup selected, setting shipping cost to €0');
      setShippingCost(0);
      return;
    }
    
    // Explicitly determine the actual country value from the select component
    const countryToUse = shippingAddressSameAsBilling ? billingCountry : shippingCountry;
    console.log(`CartReview: Country changed to: ${countryToUse || 'none'}, sameAddress: ${shippingAddressSameAsBilling}, billing: ${billingCountry}, shipping: ${shippingCountry}`);
    
    // Check if the countryToUse is Estonia regardless of case
    const isEstonia = countryToUse && 
      (countryToUse.toLowerCase() === 'estonia' || 
       countryToUse.toLowerCase() === 'eesti' || 
       countryToUse.toLowerCase() === 'ee');
    
    if (isEstonia) {
      // Always use Estonian rate for Estonia
      console.log('CartReview: Using fixed Estonian shipping rate: €2.99');
      setShippingCost(2.99);
      return;
    }
    
    if (!countryToUse) {
      // Default to Estonian rate if no country is selected
      console.log('CartReview: No country selected, defaulting to Estonian rate: €2.99');
      setShippingCost(2.99);
      return;
    }
    
    // For all other countries, calculate based on weight
    console.log('CartReview: Calculating international shipping rate...');
    
    // Log cart items to debug weight
    console.log('CartReview: Cart items for weight calculation:', 
      state.items.map(item => ({id: item.id, weight: item.weight, qty: item.quantity}))
    );
    
    const totalWeight = calculateTotalWeight(
      state.items.map((item) => ({
        weight: item.weight || 180, // Ensure default weight
        quantity: item.quantity,
      })),
    )
    const cost = calculateShippingCost(totalWeight, countryToUse);
    console.log(`CartReview: Final shipping cost for ${countryToUse}: €${cost}`);
    setShippingCost(cost);
  }, [billingCountry, shippingCountry, shippingAddressSameAsBilling, state.items, localPickup])

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--background)",
      borderColor: "var(--border)",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--background)",
    }),
    option: (provided: any, state: { isSelected: any; isFocused: any }) => ({
      ...provided,
      backgroundColor: state.isSelected ? "var(--primary)" : state.isFocused ? "var(--accent)" : "transparent",
      color: state.isSelected ? "var(--primary-foreground)" : "var(--foreground)",
    }),
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Add form validation here
    const formData = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(formData) as unknown as CustomerInfo
    onNext({
      ...data,
      country: billingCountry,
      shippingCountry: shippingAddressSameAsBilling ? billingCountry : shippingCountry,
      shippingAddressSameAsBilling,
      localPickup,
      acceptTerms,
      subscribe,
      taxDetails,
      organization: taxDetails ? (data.organization || '') : '',
      taxId: taxDetails ? (data.taxId || '') : '',
    })
  }

  // Set initial field values from profile when component mounts
  useEffect(() => {
    if (initialData) {
      // Set form fields from initialData
      if (initialData.country) {
        setBillingCountry(initialData.country);
      }
      if (initialData.shippingCountry) {
        setShippingCountry(initialData.shippingCountry);
      }
      if (initialData.shippingAddressSameAsBilling !== undefined) {
        setShippingAddressSameAsBilling(initialData.shippingAddressSameAsBilling);
      }
      if (initialData.localPickup !== undefined) {
        setLocalPickup(initialData.localPickup);
      }
      if (initialData.taxDetails !== undefined) {
        setTaxDetails(initialData.taxDetails);
      }
    }
  }, [initialData]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-8">
        <form onSubmit={handleSubmit}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Your Details</h2>
              <div className="text-sm">
                Have an account already? <button className="text-primary hover:underline">Login</button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    defaultValue={initialData?.firstName || ''} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    defaultValue={initialData?.lastName || ''} 
                    required 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  defaultValue={initialData?.email || ''} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  defaultValue={initialData?.phone || ''} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input 
                  id="address" 
                  name="address" 
                  defaultValue={initialData?.address || ''} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
                <Input 
                  id="apartment" 
                  name="apartment" 
                  defaultValue={initialData?.apartment || ''} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    name="city" 
                    defaultValue={initialData?.city || ''} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input 
                    id="postalCode" 
                    name="postalCode" 
                    defaultValue={initialData?.postalCode || ''} 
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input 
                    id="state" 
                    name="state" 
                    defaultValue={initialData?.state || ''} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select
                    options={countryOptions}
                    value={countryOptions.find((option) => option.value === billingCountry)}
                    onChange={(option) => {
                      const value = option?.value || "";
                      setBillingCountry(value);
                      console.log(`Selected billing country: ${value}`);
                      
                      // For Estonia, immediately update shipping cost
                      if (value.toLowerCase() === 'estonia' || value.toLowerCase() === 'ee') {
                        console.log('Estonia selected, forcing shipping rate to €2.99');
                        setShippingCost(2.99);
                      }
                    }}
                    styles={customStyles}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {!shippingAddressSameAsBilling && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="shippingAddress">Street Address</Label>
                  <Input 
                    id="shippingAddress" 
                    name="shippingAddress" 
                    defaultValue={initialData?.shippingAddress || ''}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="shippingApartment">Apartment, suite, etc. (optional)</Label>
                  <Input 
                    id="shippingApartment" 
                    name="shippingApartment" 
                    defaultValue={initialData?.shippingApartment || ''}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingCity">City</Label>
                    <Input 
                      id="shippingCity" 
                      name="shippingCity" 
                      defaultValue={initialData?.shippingCity || ''}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingPostalCode">Postal Code</Label>
                    <Input 
                      id="shippingPostalCode" 
                      name="shippingPostalCode" 
                      defaultValue={initialData?.shippingPostalCode || ''}
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingState">State/Province</Label>
                    <Input 
                      id="shippingState" 
                      name="shippingState" 
                      defaultValue={initialData?.shippingState || ''}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingCountry">Country</Label>
                    <Select
                      options={countryOptions}
                      value={countryOptions.find((option) => option.value === shippingCountry)}
                      onChange={(option) => setShippingCountry(option?.value || "")}
                      styles={customStyles}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 mt-8">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="localPickup"
                checked={localPickup}
                onCheckedChange={(checked) => setLocalPickup(checked as boolean)}
              />
              <Label htmlFor="localPickup" className="text-sm">
                Local pick-up from store
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sameAddress"
                checked={shippingAddressSameAsBilling}
                onCheckedChange={(checked) => setShippingAddressSameAsBilling(checked as boolean)}
                disabled={localPickup}
              />
              <Label htmlFor="sameAddress" className="text-sm">
                Shipping address same as billing address
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="taxDetails"
                checked={taxDetails}
                onCheckedChange={(checked) => setTaxDetails(checked as boolean)}
              />
              <Label htmlFor="taxDetails" className="text-sm">
                Add tax details
              </Label>
            </div>

            {taxDetails && (
              <div className="pl-6 space-y-4 border-l-2 border-muted-foreground/20">
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input 
                    id="organization" 
                    name="organization" 
                    defaultValue={initialData?.organization || ''} 
                    required={taxDetails}
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input 
                    id="taxId" 
                    name="taxId" 
                    defaultValue={initialData?.taxId || ''} 
                    required={taxDetails}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                I have read and agree to the Terms and Conditions
              </Label>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Back to cart
            </Button>
            <Button type="submit" disabled={!acceptTerms || isLoading || !billingCountry}>
              {isLoading ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
        <div className="space-y-4">
          {state.items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image
                  src={item.cover_image || "/placeholder.svg"}
                  alt={item.title}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium line-clamp-2">{item.title}</h3>
                <div className="text-sm text-muted-foreground">
                  <p>Media Condition: {item.condition}</p>
                  <p>Sleeve Condition: Generic</p>
                  <p>Quantity: {item.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span>Items</span>
            <span>{state.items.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            {localPickup ? (
              <>
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free (Local pick-up)</span>
              </>
            ) : (
              <>
                <span>Shipping {billingCountry ? `(to ${billingCountry})` : ''}</span>
                <span>${shippingCost.toFixed(2)}</span>
                {billingCountry?.toLowerCase() === 'estonia' && (
                  <span className="text-xs text-muted-foreground">(Itella SmartPost)</span>
                )}
              </>
            )}
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <div className="text-right">
              <div>${total.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

