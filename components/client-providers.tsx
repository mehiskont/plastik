'use client'

import React from 'react'
import { CartProvider } from '@/contexts/cart-context'
import CartMergeHandler from '@/components/cart-merge-handler'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CartProvider>
        {children}
        <CartMergeHandler />
      </CartProvider>
    </>
  )
}