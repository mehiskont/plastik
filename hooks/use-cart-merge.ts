import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { log } from '@/lib/logger'

/**
 * Hook for handling cart merging after login
 * @returns {Object} Cart merging state
 */
export function useCartMerge() {
  const { data: session, status } = useSession()
  const [mergeState, setMergeState] = useState({
    isLoading: false,
    isComplete: false,
    error: null as string | null
  })

  useEffect(() => {
    // Check if user just logged in and has shouldMergeCart flag
    const shouldMergeCart = status === 'authenticated' && (session as any)?.shouldMergeCart
    
    if (shouldMergeCart && !mergeState.isComplete && !mergeState.isLoading) {
      const mergeCart = async () => {
        try {
          setMergeState(prev => ({ ...prev, isLoading: true }))
          
          // Get guest cart items from localStorage
          const cartData = localStorage.getItem('plastik-cart')
          if (!cartData) {
            setMergeState({ isLoading: false, isComplete: true, error: null })
            return
          }
          
          const cart = JSON.parse(cartData)
          if (!cart.items || cart.items.length === 0) {
            setMergeState({ isLoading: false, isComplete: true, error: null })
            return
          }
          
          log('Merging cart after login', { itemCount: cart.items.length }, 'info')
          
          // Call the cart merge API
          const response = await fetch('/api/cart-merge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              guestCartItems: cart.items
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to merge cart: ${errorText}`)
          }
          
          // Clear the cart merge timestamp
          localStorage.removeItem('plastik-cart-login-time')
          
          // Update state
          setMergeState({
            isLoading: false,
            isComplete: true,
            error: null
          })
          
          log('Cart merge completed successfully', {}, 'info')
        } catch (error) {
          log('Error merging cart', { error }, 'error')
          setMergeState({
            isLoading: false,
            isComplete: true,
            error: String(error)
          })
        }
      }
      
      mergeCart()
    }
  }, [status, session, mergeState])
  
  return mergeState
}