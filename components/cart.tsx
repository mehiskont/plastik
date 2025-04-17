"use client"

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CartItem } from "@/components/cart-item"
import { Skeleton } from "@/components/ui/skeleton"

export function Cart() {
  const router = useRouter()
  const { data: session } = useSession()
  const context = useCart()
  const { cart, loading, toggleCart } = context

  // Calculate subtotal from cart items
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleCheckout = () => {
    toggleCart()
    router.push("/checkout")
  }

  const handleSignIn = () => {
    router.push("/auth/signin?callbackUrl=/checkout")
    toggleCart()
  }

  return (
    <Sheet open={cart.isOpen} onOpenChange={toggleCart}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : cart.items.length === 0 ? (
              <p className="text-center text-muted-foreground">Your cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
          {!loading && cart.items.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <div className="text-right">
                    <div>${subtotal.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">+ Shipping</div>
                  </div>
                </div>
              </div>
              {session ? (
                <Button className="w-full" onClick={handleCheckout} disabled={loading}>
                  Proceed to Checkout
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button className="w-full" onClick={handleSignIn} disabled={loading}>
                    Sign in to Checkout
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleCheckout}
                    disabled={loading}
                  >
                    Continue as Guest
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}