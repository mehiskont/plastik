"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface RefreshButtonProps {
  onClick?: () => void
}

export function RefreshButton({ onClick }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      if (onClick) {
        // Use custom refresh function if provided
        onClick()
        router.refresh()
        
        toast({
          title: "Refreshing Content",
          description: "The latest data is being loaded.",
          duration: 3000,
        })
      } else {
        // First clear all caches 
        await fetch("/api/force-refresh", {
          method: "GET",
          cache: "no-store",
        });
        
        // Then call normal refresh for inventory
        const response = await fetch("/api/refresh-inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })
        
        if (response.ok) {
          // Refresh the page data
          router.refresh()
          
          toast({
            title: "Inventory Refreshed",
            description: "The latest inventory data has been loaded.",
            duration: 3000,
          })
        } else {
          const error = await response.text()
          console.error("Failed to refresh inventory:", error)
          
          toast({
            title: "Refresh Failed",
            description: "Could not refresh inventory data. Please try again.",
            variant: "destructive",
            duration: 3000,
          })
        }
      }
    } catch (error) {
      console.error("Error refreshing inventory:", error)
      
      toast({
        title: "Refresh Error",
        description: "An error occurred while refreshing data.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRefresh} 
      disabled={isRefreshing}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? "Refreshing..." : "Refresh Records"}
    </Button>
  )
}