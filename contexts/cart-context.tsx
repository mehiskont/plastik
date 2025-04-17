'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import type { Record } from '@/types/record'
import { log } from '@/lib/logger'

// Simple cart item type
interface CartItem extends Record {
  quantity: number
}

// Simple cart state
interface CartState {
  items: CartItem[]
  isOpen: boolean
}

// Create empty cart context
const CartContext = createContext<{
  cart: CartState
  loading: boolean
  addToCart: (record: Record) => Promise<void>
  removeFromCart: (id: string | number) => Promise<void>
  updateQuantity: (id: string | number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  toggleCart: () => void
  fetchCart: () => Promise<void>
}>({
  cart: { items: [], isOpen: false },
  loading: true,
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  toggleCart: () => {},
  fetchCart: async () => {}
})

// Helper functions for localStorage
function getFromStorage(key: string): CartState | null {
  if (typeof window === 'undefined') return null
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    log('Error reading from localStorage', { key, error }, 'error')
    return null
  }
}

function saveToStorage(key: string, value: any) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    log('Error saving to localStorage:', { key, error }, 'error')
  }
}

// Simple cart provider
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({ items: [], isOpen: false })
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()
  const { toast } = useToast()
  
  // Helper to fetch cart from API via proxy
  const fetchCart = useCallback(async () => {
    if (status !== 'authenticated') {
      log('fetchCart called while unauthenticated, skipping.', {}, 'info')
      setLoading(false)
      return
    }
    setLoading(true)
    log('Fetching cart from API via proxy...', {}, 'info')
    try {
      const response = await fetch('/api/cart-proxy?target=cart')
      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`API Error ${response.status}: ${errorBody}`)
      }
      const data = await response.json()
      const fetchedItems = Array.isArray(data?.items) ? data.items : []
      const fetchedCart: CartState = {
        items: fetchedItems,
        isOpen: cart.isOpen
      }
      setCart(fetchedCart)
      log('Cart fetched successfully via proxy', { itemCount: fetchedItems.length }, 'info')
      localStorage.removeItem('cart')
      localStorage.removeItem('plastik-cart-logout-backup')
    } catch (error: any) {
      log('Error fetching cart via proxy', { error: error.message }, 'error')
      toast({ title: "Error", description: "Could not load your cart from server.", variant: "destructive" })
      setCart(prev => ({ ...prev, items: [] }))
    } finally {
      setLoading(false)
    }
  }, [status, cart.isOpen, toast])
  
  // Initial Load Logic
  useEffect(() => {
    log(`Cart context effect triggered. Status: ${status}`, {}, 'info')
    if (status === 'authenticated') {
      log('User authenticated, attempting to fetch cart.', {}, 'info')
      fetchCart()
    } else if (status === 'unauthenticated') {
      log('User unauthenticated, loading from localStorage.', {}, 'info')
      const savedCart = getFromStorage('cart')
      if (savedCart && Array.isArray(savedCart.items)) {
        setCart((prev: CartState) => ({ ...prev, items: savedCart.items }))
        log('Loaded guest cart from localStorage', { itemCount: savedCart.items.length }, 'info')
      } else {
        setCart((prev: CartState) => ({ ...prev, items: [] }))
      }
      setLoading(false)
    } else {
      log('Auth status is loading, waiting...', {}, 'info')
      setLoading(true)
    }
  }, [status, fetchCart])
  
  // Save Guest Cart to localStorage
  useEffect(() => {
    if (status === 'unauthenticated' && !loading) {
      log('User unauthenticated, saving cart to localStorage', { itemCount: cart.items.length }, 'info')
      saveToStorage('cart', cart)
    }
  }, [cart, status, loading])
  
  // Cart Actions
  
  // Add item to cart
  const addToCart = async (record: Record) => {
    const optimisticItem = { ...record, quantity: 1 }
    
    // Optimistic UI update
    setCart((prev: CartState) => {
      const exists = prev.items.some(item =>
        String(item.id) === String(record.id) || String(item.discogsReleaseId) === String(record.discogsReleaseId)
      )
      if (exists) {
        return {
          ...prev,
          items: prev.items.map((item: CartItem) =>
            (String(item.id) === String(record.id) || String(item.discogsReleaseId) === String(record.discogsReleaseId))
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
      } else {
        return { ...prev, items: [...prev.items, optimisticItem] }
      }
    })
    
    toast({ title: "Added to cart", description: record.title })
    
    if (status === 'authenticated') {
      log('Adding item via API proxy', { recordId: record.id }, 'info')
      try {
        const payload = {
          recordId: record.id || record.discogsReleaseId,
          quantity: 1
        }
        const response = await fetch('/api/cart-proxy?target=cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!response.ok) {
          throw new Error(`API Error ${response.status}: ${await response.text()}`)
        }
        log('Item added successfully via API', { recordId: record.id }, 'info')
      } catch (error: any) {
        log('Error adding item via API proxy', { error: error.message, recordId: record.id }, 'error')
        toast({ title: "Error", description: "Could not save item to your server cart.", variant: "destructive" })
        await fetchCart()
      }
    }
  }
  
  // Remove item from cart
  const removeFromCart = async (id: string | number) => {
    const stringId = String(id)
    let itemToRemove: CartItem | undefined
    
    // Optimistic UI update
    setCart((prev: CartState) => {
      itemToRemove = prev.items.find((item: CartItem) => String(item.id) === stringId || String(item.discogsReleaseId) === stringId)
      return {
        ...prev,
        items: prev.items.filter((item: CartItem) => !(String(item.id) === stringId || String(item.discogsReleaseId) === stringId))
      }
    })
    
    if (itemToRemove) {
      toast({ title: "Removed from cart", description: itemToRemove.title })
    }
    
    if (status === 'authenticated') {
      log('Removing item via API proxy', { itemId: stringId }, 'info')
      try {
        const response = await fetch(`/api/cart-proxy?target=cart/items/${stringId}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          throw new Error(`API Error ${response.status}: ${await response.text()}`)
        }
        log('Item removed successfully via API', { itemId: stringId }, 'info')
      } catch (error: any) {
        log('Error removing item via API proxy', { error: error.message, itemId: stringId }, 'error')
        toast({ title: "Error", description: "Could not remove item from your server cart.", variant: "destructive" })
        await fetchCart()
      }
    }
  }
  
  // Update item quantity
  const updateQuantity = async (id: string | number, quantity: number) => {
    const stringId = String(id)
    
    if (quantity <= 0) {
      await removeFromCart(id)
      return
    }
    
    let originalQuantity: number | undefined
    
    // Optimistic UI update
    setCart((prev: CartState) => ({
      ...prev,
      items: prev.items.map((item: CartItem) => {
        if (String(item.id) === stringId || String(item.discogsReleaseId) === stringId) {
          originalQuantity = item.quantity
          return { ...item, quantity }
        }
        return item
      })
    }))
    
    if (status === 'authenticated') {
      log('Updating quantity via API proxy', { itemId: stringId, quantity }, 'info')
      try {
        const payload = { quantity }
        const response = await fetch(`/api/cart-proxy?target=cart/items/${stringId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!response.ok) {
          throw new Error(`API Error ${response.status}: ${await response.text()}`)
        }
        log('Quantity updated successfully via API', { itemId: stringId }, 'info')
      } catch (error: any) {
        log('Error updating quantity via API proxy', { error: error.message, itemId: stringId }, 'error')
        toast({ title: "Error", description: "Could not update item quantity in your server cart.", variant: "destructive" })
        await fetchCart()
      }
    }
  }
  
  // Clear cart
  const clearCart = async () => {
    const previousItems = cart.items
    
    // Optimistic UI update
    setCart((prev: CartState) => ({ ...prev, items: [] }))
    
    if (status === 'authenticated') {
      log('Clearing cart via API proxy', {}, 'info')
      try {
        const response = await fetch(`/api/cart-proxy?target=cart`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          throw new Error(`API Error ${response.status}: ${await response.text()}`)
        }
        log('Cart cleared successfully via API', {}, 'info')
      } catch (error: any) {
        log('Error clearing cart via API proxy', { error: error.message }, 'error')
        toast({ title: "Error", description: "Could not clear your server cart.", variant: "destructive" })
        setCart((prev: CartState) => ({ ...prev, items: previousItems }))
      }
    }
  }
  
  // Toggle cart open/closed
  const toggleCart = () => {
    setCart(prev => ({ ...prev, isOpen: !prev.isOpen }))
  }
  
  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        loading, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        toggleCart, 
        fetchCart 
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Hook to use cart
export function useCart() {
  return useContext(CartContext)
}