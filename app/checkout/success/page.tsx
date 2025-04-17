"use client"

import { useEffect, useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from 'next-auth/react'
import { useCart } from '@/contexts/cart-context'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()
  const cartContext = useCart()
  
  useEffect(() => {
    // Handle cart clearing
    try {
      if (cartContext && cartContext.clearCart) {
        // Clear cart UI state on success page load
        cartContext.clearCart()
        console.log("Cart UI cleared on success page")
      }
    } catch (error) {
      console.error("Error clearing cart:", error)
    }
    
    // Fetch order details if we have a session ID
    if (sessionId) {
      fetch(`/api/order-details?id=${encodeURIComponent(sessionId)}`)
        .then(response => response.json())
        .then(data => {
          setOrderId(data.id || null)
          setOrder(data)
          setIsLoading(false)
        })
        .catch(err => {
          console.error("Error fetching order details:", err)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [sessionId, cartContext])

  // Handle navigation functions
  const goToHome = () => {
    window.location.href = "/"
  }
  
  const goToOrders = () => {
    if (session?.user) {
      window.location.href = "/dashboard/orders"
    } else {
      window.location.href = "/auth/signin?callbackUrl=/dashboard/orders"
    }
  }

  return (
    <div className="container max-w-lg mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-2xl font-bold">Thank you for your order!</CardTitle>
          <CardDescription>Your order has been confirmed and will be shipped soon.</CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          {isLoading ? (
            <div className="flex justify-center my-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orderId ? (
            <div className="my-6 space-y-3">
              <p className="text-muted-foreground">Order ID: <span className="font-medium text-foreground">{orderId.substring(0, 8)}</span></p>
              <p className="text-sm text-muted-foreground">We've sent a confirmation email with your order details.</p>
              
              {/* Show shipping information based on method */}
              {order?.billingAddress?.localPickup === "true" ? (
                <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-500 rounded text-left">
                  <h3 className="text-sm font-medium mb-2">Local Pick-up Information</h3>
                  <p className="text-sm">Please bring your ID when picking up your order.</p>
                  <p className="text-sm mt-2"><span className="font-medium">Pick-up Location:</span><br />
                    Plastik Records, 5 Main Street, Tallinn, Estonia
                  </p>
                  <p className="text-sm mt-2"><span className="font-medium">Store Hours:</span><br />
                    Monday-Friday 10am-7pm, Saturday 11am-5pm
                  </p>
                </div>
              ) : order?.shippingAddress && (
                <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded text-left">
                  <h3 className="text-sm font-medium mb-2">Shipping Information</h3>
                  <address className="not-italic text-sm">
                    {order.shippingAddress.name && (
                      <p>{order.shippingAddress.name}</p>
                    )}
                    {/* Check for line1 in shippingAddress or in nested address object */}
                    {order.shippingAddress.line1 ? (
                      <p>{order.shippingAddress.line1}</p>
                    ) : order.shippingAddress.address?.line1 && (
                      <p>{order.shippingAddress.address.line1}</p>
                    )}
                    
                    {/* Check for line2 in shippingAddress or in nested address object */}
                    {order.shippingAddress.line2 ? (
                      <p>{order.shippingAddress.line2}</p>
                    ) : order.shippingAddress.address?.line2 && (
                      <p>{order.shippingAddress.address.line2}</p>
                    )}
                    
                    <p>
                      {/* Check for city in both places */}
                      {order.shippingAddress.city ? `${order.shippingAddress.city}, ` : 
                       order.shippingAddress.address?.city ? `${order.shippingAddress.address.city}, ` : ''}
                      
                      {/* Check for state in both places */}
                      {order.shippingAddress.state ? `${order.shippingAddress.state} ` : 
                       order.shippingAddress.address?.state ? `${order.shippingAddress.address.state} ` : ''}
                      
                      {/* Check for postal_code in both places */}
                      {order.shippingAddress.postal_code || order.shippingAddress.address?.postal_code}
                    </p>
                    
                    {/* Check for country in both places */}
                    <p>{order.shippingAddress.country || order.shippingAddress.address?.country}</p>
                  </address>
                </div>
              )}
              
              {/* Show tax details if available */}
              {order?.billingAddress?.taxDetails === "true" && (
                <div className="mt-4 p-3 bg-slate-50 border-l-4 border-blue-500 rounded text-left">
                  <h3 className="text-sm font-medium mb-2">Tax Details</h3>
                  <p className="text-sm"><span className="text-muted-foreground">Organization:</span> {order.billingAddress.organization}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Tax ID:</span> {order.billingAddress.taxId}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="my-6 text-sm text-muted-foreground">Your payment was successful and your order is being processed.</p>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={goToHome}>
            Continue Shopping
          </Button>
          
          {session?.user ? (
            <Button onClick={goToOrders}>
              View Your Orders
            </Button>
          ) : (
            <Button onClick={goToOrders}>
              Sign In to View Orders
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}