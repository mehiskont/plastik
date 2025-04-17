"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { calculatePriceWithoutFees } from "@/lib/price-calculator"
import { toast } from "@/components/ui/use-toast"
import type { Record } from "@/types/record"
import { TrackListing } from "@/components/track-listing"

interface RecordDetailsProps {
  record: Record
}

export function RecordDetails({ record }: RecordDetailsProps) {
  const { cart, addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const price = record.price

  const cartItem = cart.items?.find((item) => 
    item.discogsReleaseId !== undefined && 
    String(item.discogsReleaseId) === String(record.discogsReleaseId)
  )
  const currentQuantityInCart = cartItem?.quantity || 0
  const availableQuantity = record.quantity || 0
  const isOutOfStock = availableQuantity === 0 || record.status !== "FOR_SALE"
  const isAlreadyInCart = cartItem !== undefined && currentQuantityInCart > 0

  const handleAddToCart = () => {
    if (isAdding || isOutOfStock || isAlreadyInCart) {
      return
    }
    
    setIsAdding(true)

    try {
      addToCart(record)
      setIsAdding(false)
    } catch (error) {
      console.error("Error adding item to cart:", error)
      toast({ title: "Error", description: "Could not add item to cart", variant: "destructive" })
      setIsAdding(false)
    }
  }

  const labelDisplay = record.catalogNumber ? `${record.label} [${record.catalogNumber}]` : record.label
  const formatDisplay = Array.isArray(record.format) ? record.format.join(", ") : record.format
  
  const hasTracksOrVideos = Boolean(
    (record.tracks && record.tracks.length > 0) || 
    (record.videos && record.videos.length > 0)
  )

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-2/5 lg:w-1/3 sticky top-[0px] self-start">
          <div className="relative aspect-square">
            <Image
              src={record.coverImage || "/placeholder.svg"}
              alt={record.title}
              fill
              className="object-contain rounded-md shadow-sm"
              sizes="(max-width: 768px) 100vw, 40vw"
              quality={90}
              priority
              loading="eager"
            />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h1 className="text-2xl font-bold">{record.title}</h1>
                <p className="text-lg">{record.artist}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xl font-bold">${(record.price || 0).toFixed(2)}</p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAlreadyInCart || isAdding}
                  className="whitespace-nowrap"
                >
                  <ShoppingCart className="mr-1 h-4 w-4" />
                  {isOutOfStock
                    ? "Out of Stock"
                    : isAdding 
                    ? "Adding..." 
                    : isAlreadyInCart 
                    ? "In Cart"
                    : "Add to Cart"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-4">
              <div className="flex gap-2">
                <span className="font-medium">Format:</span>
                <span>{formatDisplay}</span>
              </div>
              {(record.released_formatted || record.released) && (
                <div className="flex gap-2">
                  <span className="font-medium">Released:</span>
                  <span>{record.released_formatted || record.released}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-medium">Condition:</span>
                <span>{record.condition}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium">Label:</span>
                <span className="truncate">{labelDisplay}</span>
              </div>
              {record.country && (
                <div className="flex gap-2">
                  <span className="font-medium">Country:</span>
                  <span>{record.country}</span>
                </div>
              )}
            </div>
          </div>
          
          {(record.styles && record.styles.length > 0) || ((record as any).style && (record as any).style.length > 0) ? (
            <div className="flex flex-wrap gap-1 mb-4">
              {(record.styles || (record as any).style).map((style: string, index: number) => (
                <span key={index} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
                  {style}
                </span>
              ))}
            </div>
          ) : null}
          
          {hasTracksOrVideos && (
            <div>
              <TrackListing tracks={record.tracks || []} videos={record.videos || []} />
            </div>
          )}
          
          {!hasTracksOrVideos && (
            <div className="mt-2 p-3 border border-dashed rounded-md text-center bg-secondary/10">
              <p className="text-sm text-muted-foreground">No audio previews available for this release</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

