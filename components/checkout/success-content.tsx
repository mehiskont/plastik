"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2 } from "lucide-react"

interface OrderDetails {
  customerEmail: string | null
  total: string
  orderNumber: string
}

export function SuccessContent({ paymentIntentId }: { paymentIntentId: string }) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/order-details?paymentIntentId=${paymentIntentId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch order details")
        }
        const data = await response.json()
        setOrderDetails(data)
      } catch (err) {
        setError("An error occurred while fetching order details. Please contact support.")
        console.error("Error fetching order details:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [paymentIntentId])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-2xl text-destructive">Oops! Something went wrong</CardTitle>
          <CardDescription className="text-base">{error}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!orderDetails) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-destructive">Order Not Found</CardTitle>
          <CardDescription>We couldn't find your order details. Please contact support.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <CardTitle className="text-3xl">Thank you for your order!</CardTitle>
        <CardDescription className="text-base">
          {orderDetails.customerEmail
            ? `We've sent a confirmation email to ${orderDetails.customerEmail}`
            : "Your order has been confirmed"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="rounded-lg bg-muted p-6">
          <h3 className="font-semibold mb-4 text-lg">Order Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-mono font-medium">{orderDetails.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">${orderDetails.total}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Your order has been successfully placed and is being processed.</p>
            <p className="text-sm text-muted-foreground">You will receive an email confirmation shortly.</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

