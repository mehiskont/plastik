"use client"

import { Button } from "@/components/ui/button"
import { calculatePriceWithoutFees } from "@/lib/price-calculator"
import type { CartItem } from "@/types/cart"

interface OrderSummaryProps {
  shippingInfo: any
  paymentInfo: any
  cartItems: CartItem[]
  onPlaceOrder: () => void
}

export function OrderSummary({ shippingInfo, paymentInfo, cartItems, onPlaceOrder }: OrderSummaryProps) {
  // Use the actual price instead of calculating without fees
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Shipping Information</h3>
        <p>{shippingInfo.fullName}</p>
        <p>{shippingInfo.address}</p>
        <p>{`${shippingInfo.city}, ${shippingInfo.country} ${shippingInfo.postalCode}`}</p>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payment Information</h3>
        <p>Card ending in {paymentInfo.cardNumber.slice(-4)}</p>
        <p>{paymentInfo.cardHolder}</p>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Order Items</h3>
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{`${item.title} (x${item.quantity})`}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center font-bold text-lg mt-4">
        <span>Total:</span>
        <span>${total.toFixed(2)}</span>
      </div>
      <Button onClick={onPlaceOrder} className="w-full">
        Place Order
      </Button>
    </div>
  )
}

