"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/contexts/cart-context"
import { RecordCard } from "./record-card"
import type { Record } from "@/types/record"

interface ClientRecordCardProps {
  record: Record
}

export function ClientRecordCard({ record }: ClientRecordCardProps) {
  const [isMounted, setIsMounted] = useState(false)
  // Get the cart context with our new API
  const context = useCart() 
  const { cart, loading, addToCart } = context
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Only add to cart functionality is needed
  const handleAddToCart = () => {
    if (isMounted) {
      addToCart(record)
    }
  }

  // Pass the simplified props
  return (
    <RecordCard 
      record={record} 
      inCart={isMounted && cart.items.some(item => 
        String(item.id) === String(record.id) || 
        String(item.discogsReleaseId) === String(record.discogsReleaseId)
      )}
      onAddToCart={handleAddToCart}
      isLoading={loading}
    />
  )
}

