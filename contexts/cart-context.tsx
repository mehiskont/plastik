'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import type { Record } from '@/types/record'

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
  addToCart: (record: Record) => void
  removeFromCart: (id: string | number) => void
  updateQuantity: (id: string | number, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
}>({
  cart: { items: [], isOpen: false },
  loading: false,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  toggleCart: () => {}
})

// Helper functions for localStorage
function getFromStorage(key: string) {
  if (typeof window === 'undefined') return null
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function saveToStorage(key: string, value: any) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

// Simple cart provider
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({ items: [], isOpen: false })
  const [loading, setLoading] = useState(false)
  const { data: session, status } = useSession()
  const { toast } = useToast()
  
  // Initialize cart from localStorage on mount
  useEffect(() => {
    const savedCart = getFromStorage('cart')
    if (savedCart && savedCart.items) {
      setCart(savedCart)
    }
  }, [])
  
  // Load cart from database when user logs in
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      setLoading(true)
      
      // Fetch cart from database
      fetch(`/api/cart-merge?userId=${session.user.id}&fetch=true`)
        .then(response => {
          if (response.ok) {
            return response.json()
          }
          throw new Error('Failed to fetch cart from database')
        })
        .then(data => {
          if (data.items && data.items.length > 0) {
            // Only update if there are items
            setCart(prev => ({
              ...prev,
              items: data.items
            }))
          }
        })
        .catch(error => {
          console.error('Error loading cart from database:', error)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [status, session])
  
  // Save cart to localStorage when it changes
  useEffect(() => {
    saveToStorage('cart', cart)
  }, [cart])
  
  // Add item to cart
  const addToCart = (record: Record) => {
    setCart(prev => {
      // Check if item already exists
      const exists = prev.items.some(item => 
        String(item.id) === String(record.id) || 
        String(item.discogsReleaseId) === String(record.discogsReleaseId)
      )
      
      let updatedCart;
      if (exists) {
        // Update quantity if exists
        updatedCart = {
          ...prev,
          items: prev.items.map(item => {
            if (
              String(item.id) === String(record.id) || 
              String(item.discogsReleaseId) === String(record.discogsReleaseId)
            ) {
              return { ...item, quantity: item.quantity + 1 }
            }
            return item
          })
        }
      } else {
        // Add new item
        updatedCart = {
          ...prev,
          items: [...prev.items, { ...record, quantity: 1 }]
        }
      }
      
      // Save to database if user is authenticated
      if (status === 'authenticated' && session?.user?.id) {
        // Don't await this - let it run in the background
        fetch('/api/cart-merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            guestCartItems: updatedCart.items,
            userId: session.user.id
          })
        })
        .catch(error => {
          console.error('Failed to save cart to database:', error)
        })
      }
      
      return updatedCart;
    })
    
    toast({
      title: "Added to cart",
      description: "Item has been added to your cart"
    })
  }
  
  // Remove item from cart
  const removeFromCart = (id: string | number) => {
    setCart(prev => {
      const updatedCart = {
        ...prev,
        items: prev.items.filter(item => 
          String(item.id) !== String(id) && 
          String(item.discogsReleaseId) !== String(id)
        )
      };
      
      // Save to database if user is authenticated
      if (status === 'authenticated' && session?.user?.id) {
        // Don't await this - let it run in the background
        fetch('/api/cart-merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            guestCartItems: updatedCart.items,
            userId: session.user.id,
            logoutSave: true // Force replace the entire cart
          })
        })
        .catch(error => {
          console.error('Failed to save cart to database:', error)
        })
      }
      
      return updatedCart;
    });
  }
  
  // Update item quantity
  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    
    setCart(prev => {
      const updatedCart = {
        ...prev,
        items: prev.items.map(item => {
          if (
            String(item.id) === String(id) || 
            String(item.discogsReleaseId) === String(id)
          ) {
            return { ...item, quantity }
          }
          return item
        })
      };
      
      // Save to database if user is authenticated
      if (status === 'authenticated' && session?.user?.id) {
        // Don't await this - let it run in the background
        fetch('/api/cart-merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            guestCartItems: updatedCart.items,
            userId: session.user.id
          })
        })
        .catch(error => {
          console.error('Failed to save cart to database:', error)
        })
      }
      
      return updatedCart;
    });
  }
  
  // Clear cart
  const clearCart = () => {
    setCart(prev => {
      const updatedCart = { ...prev, items: [] };
      
      // Save to database if user is authenticated
      if (status === 'authenticated' && session?.user?.id) {
        // Don't await this - let it run in the background
        fetch('/api/cart-merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            guestCartItems: [],
            userId: session.user.id,
            logoutSave: true // Force replace the entire cart
          })
        })
        .catch(error => {
          console.error('Failed to clear cart in database:', error)
        })
      }
      
      return updatedCart;
    })
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
        toggleCart 
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