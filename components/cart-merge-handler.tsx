'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCart } from '@/contexts/cart-context'

// This is a simplified version that just logs authentication state changes
export default function CartMergeHandler() {
  const { status } = useSession()
  const [previousStatus, setPreviousStatus] = useState<string | null>(null)
  
  useEffect(() => {
    // On first render, just store the initial status
    if (previousStatus === null) {
      setPreviousStatus(status)
      return
    }

    // On login
    if (previousStatus !== 'authenticated' && status === 'authenticated') {
      console.log('User logged in - cart state will be preserved in database')
    }
    
    // On logout
    if (previousStatus === 'authenticated' && status !== 'authenticated') {
      console.log('User logged out - cart is saved in localStorage only')
    }
    
    // Update previous status
    setPreviousStatus(status)
  }, [status, previousStatus])
  
  // This component doesn't render anything
  return null
}