"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { OrderList } from "./order-list"

export function LiveOrders() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const initialLoadComplete = useRef(false)

  useEffect(() => {
    async function fetchOrders() {
      if (!session?.user?.id) return
      
      try {
        // Only show loading indicator on initial load
        if (!initialLoadComplete.current) {
          setIsLoading(true)
        }
        
        // Add cache-busting query param and force mock data for Google users
        const isMockUser = session.user.id === "temp-user-id-123" || session.user.id === "temp-google-user-123"
        const mockParam = isMockUser ? "&includeMock=true" : ""
        
        const response = await fetch(`/api/orders?userId=${session.user.id}${mockParam}&_=${Date.now()}`, {
          cache: 'no-store',
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`)
        }
        
        const data = await response.json()
        console.log(`Client-side fetched ${data.length} orders`)
        
        // Sort orders by createdAt (newest first)
        const sortedData = [...data].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        
        setOrders(sortedData)
        setError(null)
      } catch (err) {
        console.error("Error fetching orders:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
        initialLoadComplete.current = true
      }
    }
    
    fetchOrders()
    
    // Re-fetch orders every 30 seconds to ensure data is fresh
    const intervalId = setInterval(fetchOrders, 30000)
    return () => clearInterval(intervalId)
  }, [session])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-6">
        <p className="text-yellow-800 dark:text-yellow-400">
          Error loading orders: {error}
        </p>
        <p className="text-yellow-700 dark:text-yellow-500 text-sm mt-2">
          Database connection issues are preventing order history from loading. We're working on this!
        </p>
      </div>
    )
  }

  if (orders.length === 0) {
    // Log the session ID to help debugging
    console.log("User ID from session:", session?.user?.id);
    console.log("Email from session:", session?.user?.email);
    
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground mb-2">You haven't placed any orders yet.</p>
        <p className="text-xs text-muted-foreground mt-2">
          Orders appear instantly when completed. Try placing a new order.
          <br/>
          User ID: {session?.user?.id ? session.user.id.substring(0, 8) + '...' : 'Not signed in'}
        </p>
      </div>
    )
  }

  return <OrderList orders={orders} />
}