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
        
        // Persist cart data to server before logout if possible via the proxy
        // This attempts a final save to ensure items are stored server-side
        // Note: The session might already be ending, so this is best-effort
        log('Attempting pre-logout cart save via proxy', { itemCount: cart.items.length }, 'info');
        try {
          // Use the proxy, targeting the merge/save endpoint
          fetch('/api/cart-proxy?target=cart/merge', { // <<< CHANGED to proxy endpoint
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              guestCartItems: cart.items,
              // Add any flags your external API might need for a logout save, if applicable
              // e.g., logoutSave: true 
            }),
            // Optional: Use keepalive for requests during page unload
            // keepalive: true 
          })
          .then(async response => { // Make async to read potential error body
            if (response.ok) {
              log('Pre-logout save request successful (via proxy)', {
                itemCount: cart.items.length,
                status: response.status
              }, 'info')
            } else {
                // Log error details from API if available
                const errorBody = await response.text();
                log('Pre-logout save request failed (via proxy)', { 
                    status: response.status, 
                    error: errorBody,
                    itemCount: cart.items.length
                }, 'warn');
            }
          })
          .catch(error => {
            // Network errors or issues with the fetch itself
            log('Failed to send pre-logout save request (network error)', { error: error.message }, 'error')
          })
        } catch (error: any) {
          // Synchronous errors (e.g., JSON stringify fails - unlikely)
          log('Error constructing pre-logout cart persistence request', { error: error.message }, 'error')
        }
      }
    }
    
    // Update previous status
    setPreviousStatus(status)
  }, [status, previousStatus, cart, session])
  
  // This component doesn't render anything
  return null
}