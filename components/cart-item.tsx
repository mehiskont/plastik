"use client"

import Image from "next/image"
import { Minus, Plus, X } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import type { Record } from "@/types/record"

interface CartItemProps {
  item: Record & {
    quantity: number
    stockQuantity: number
  }
}

export function CartItem({ item }: CartItemProps) {
  const context = useCart()
  const { updateQuantity, removeFromCart } = context
  const { toast } = useToast()
  const price = item.price
  const maxQuantity = item.stockQuantity || 0

  const handleQuantityChange = async (newQuantity: number) => {
    const itemId = item.id || item.discogsReleaseId
    
    if (!itemId) {
      console.error("Cannot update quantity: id is missing", item)
      toast({
        title: "Error",
        description: "Cannot update item quantity.",
        variant: "destructive"
      })
      return
    }

    if (newQuantity > maxQuantity) {
      toast({
        title: "Maximum quantity reached",
        description: `Only ${maxQuantity} unit${maxQuantity === 1 ? '' : 's'} available`,
        variant: "destructive",
      })
      return
    }

    try {
      if (newQuantity < 1) {
        await removeFromCart(itemId)
      } else {
        await updateQuantity(itemId, newQuantity)
      }
    } catch (error) {
      console.error("Error updating cart item:", error)
      toast({
        title: "Error",
        description: "Failed to update cart. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRemove = async () => {
    const itemId = item.id || item.discogsReleaseId
    
    if (!itemId) {
      console.error("Cannot remove item: id is missing", item)
      toast({
        title: "Error",
        description: "Cannot remove item.",
        variant: "destructive"
      })
      return
    }

    try {
      await removeFromCart(itemId)
    } catch (error) {
      console.error("Error removing cart item:", error)
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex gap-4">
      <div className="relative w-20 h-20">
        <Image 
          src={item.coverImage || "/placeholder.svg"} 
          alt={item.title} 
          fill 
          className="object-cover rounded-md" 
        />
      </div>
      <div className="flex-1 flex">
        <div className="flex-1">
          <h3 className="font-medium line-clamp-1">{item.title}</h3>
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">Price: ${price.toFixed(2)}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleQuantityChange(item.quantity - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleQuantityChange(item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
       
        <div className="flex items-start">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}