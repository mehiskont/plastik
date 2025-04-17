'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCart } from '@/contexts/cart-context'
import { log } from '@/lib/logger'

export default function CartMergeHandler() {
  const { status, data: session } = useSession()
  const [previousStatus, setPreviousStatus] = useState<string | null>(null)
  const { cart } = useCart()
  
  useEffect(() => {
    // On first render, just store the initial status
    if (previousStatus === null) {
      setPreviousStatus(status)
      return
    }

    // On login
    if (previousStatus !== 'authenticated' && status === 'authenticated') {
      // Cart will be merged via the useCartMerge hook
      log('User logged in - cart state will be preserved in database', {
        userId: session?.user?.id,
        itemCount: cart.items.length
      }, 'info')

      // Set a flag in localStorage to indicate a successful login
      localStorage.setItem('plastik-cart-login-time', Date.now().toString())
    }
    
    // On logout
    if (previousStatus === 'authenticated' && status !== 'authenticated') {
      // Important: When user logs out, we need to ensure the cart is preserved in localStorage
      // This is so they can see the same items when they log back in
      log('User logged out - preserving cart items for next login', {
        itemCount: cart.items.length
      }, 'info')
      
      // Always create a backup copy of cart items for post-logout persistence
      if (cart.items.length > 0) {
        // Save to both keys for redundancy
        localStorage.setItem('plastik-cart-logout-backup', JSON.stringify(cart))
        // Also ensure the regular cart in localStorage has the items
        localStorage.setItem('cart', JSON.stringify(cart))
        
        // Persist cart data to server before logout if possible (even though session is ending)
        // This attempts a final save to ensure items are stored server-side
        try {
          fetch('/api/cart-merge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              guestCartItems: cart.items,
              logoutSave: true // Flag indicating this is a pre-logout save
            })
          })
          .then(response => {
            if (response.ok) {
              log('Cart items successfully persisted before logout', {
                itemCount: cart.items.length
              }, 'info')
            }
          })
          .catch(error => {
            log('Failed to persist cart before logout', { error }, 'error')
          })
        } catch (error) {
          log('Error sending logout cart persistence request', { error }, 'error')
        }
      }
    }
    
    // Update previous status
    setPreviousStatus(status)
  }, [status, previousStatus, cart, session])
  
  // This component doesn't render anything
  return null
}