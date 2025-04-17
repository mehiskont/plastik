import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { log } from '@/lib/logger'
import { useCart } from '@/contexts/cart-context'

/**
 * Hook for handling cart merging after login
 * @returns {Object} Cart merging state
 */
export function useCartMerge() {
  const { data: session, status } = useSession()
  const { cart, clearCart, addToCart } = useCart()
  const [mergeState, setMergeState] = useState({
    isLoading: false,
    isComplete: false,
    error: null as string | null
  })

  useEffect(() => {
    // Always merge cart on login - not just when shouldMergeCart flag is set
    // This ensures we always preserve cart items between sessions
    const isNewLogin = status === 'authenticated' && !mergeState.isComplete && !mergeState.isLoading
    
    if (isNewLogin) {
      const mergeCart = async () => {
        try {
          setMergeState(prev => ({ ...prev, isLoading: true }))
          
          // Get cart items from localStorage - check both current cart and backup
          const cartData = localStorage.getItem('cart')
          const backupCartData = localStorage.getItem('plastik-cart-logout-backup')
          
          let cartItems = []
          
          // First try the current cart in localStorage
          if (cartData) {
            try {
              const parsedCart = JSON.parse(cartData)
              if (parsedCart.items && parsedCart.items.length > 0) {
                cartItems = parsedCart.items
                log('Found cart items in localStorage', { 
                  itemCount: cartItems.length,
                  userId: session?.user?.id 
                }, 'info')
              }
            } catch (e) {
              log('Error parsing cart data', { error: e }, 'error')
            }
          }
          
          // If no items found, try the backup cart
          if (cartItems.length === 0 && backupCartData) {
            try {
              const parsedBackup = JSON.parse(backupCartData)
              if (parsedBackup.items && parsedBackup.items.length > 0) {
                cartItems = parsedBackup.items
                log('Found cart items in backup localStorage', { 
                  itemCount: cartItems.length,
                  userId: session?.user?.id 
                }, 'info')
              }
            } catch (e) {
              log('Error parsing backup cart data', { error: e }, 'error')
            }
          }
          
          // If we still have no items, try to fetch items from server
          if (cartItems.length === 0 && session?.user?.id) {
            try {
              // Attempt to fetch any previously saved cart items from the server
              log('No items found in localStorage, trying to fetch from server', {
                userId: session.user.id
              }, 'info')
              
              const fetchResponse = await fetch(`/api/cart-merge?userId=${session.user.id}&fetch=true`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              
              if (fetchResponse.ok) {
                const data = await fetchResponse.json()
                if (data.items && data.items.length > 0) {
                  log('Retrieved cart items from server', { 
                    itemCount: data.items.length,
                    userId: session.user.id 
                  }, 'info')
                  
                  // Add these items to the local cart
                  data.items.forEach(item => addToCart(item))
                  
                  // Set merge as complete since we've restored from server
                  setMergeState({
                    isLoading: false,
                    isComplete: true,
                    error: null
                  })
                  return
                }
              }
            } catch (e) {
              log('Error fetching cart from server', { error: e }, 'error')
            }
          }
          
          // If we still have no items, nothing to merge
          if (cartItems.length === 0) {
            log('No items found to merge after login', {
              userId: session?.user?.id
            }, 'info')
            setMergeState({ isLoading: false, isComplete: true, error: null })
            return
          }
          
          log('Merging cart after login', { 
            itemCount: cartItems.length,
            userId: session?.user?.id
          }, 'info')
          
          // Call the cart merge API
          const response = await fetch('/api/cart-merge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              guestCartItems: cartItems
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to merge cart: ${errorText}`)
          }
          
          // Clear the cart merge timestamps
          localStorage.removeItem('plastik-cart-login-time')
          localStorage.removeItem('plastik-cart-logout-backup')
          
          // Update state
          setMergeState({
            isLoading: false,
            isComplete: true,
            error: null
          })
          
          log('Cart merge completed successfully', {
            userId: session?.user?.id
          }, 'info')
        } catch (error) {
          log('Error merging cart', { error, userId: session?.user?.id }, 'error')
          setMergeState({
            isLoading: false,
            isComplete: true,
            error: String(error)
          })
        }
      }
      
      mergeCart()
    }
  }, [status, session, mergeState, clearCart, addToCart])
  
  return mergeState
}