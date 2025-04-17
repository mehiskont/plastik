"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

export function DashboardNav() {
  const pathname = usePathname()
  const { toast } = useToast()
  const router = useRouter()

  // Handle both NextAuth signOut and custom token cleanup
  const handleSignOut = async () => {
    try {
      // Preserve cart items before logout by saving them to a temporary store
      let cartItemsToPreserve = null
      try {
        const cartData = localStorage.getItem('plastik-cart')
        if (cartData) {
          const parsedCart = JSON.parse(cartData)
          if (parsedCart.items && parsedCart.items.length > 0) {
            console.log(`Preserving ${parsedCart.items.length} cart items during logout`)
            cartItemsToPreserve = parsedCart.items
            
            // Save to session storage to ensure they survive logout
            sessionStorage.setItem('plastik-guest-cart-for-merge', JSON.stringify(cartItemsToPreserve))
            
            // Create backup in localStorage
            localStorage.setItem('plastik-guest-cart-backup', JSON.stringify({
              items: cartItemsToPreserve,
              timestamp: Date.now(),
              needsMerge: true
            }))
          }
        }
      } catch (err) {
        console.error('Error preserving cart before logout:', err)
      }
      
      // Clear authentication tokens
      localStorage.removeItem('auth-token')
      localStorage.removeItem('user')
      
      // Clear auth cookies
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'ls-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      
      // Also try NextAuth signOut
      await signOut({ redirect: false })
      
      // Restore cart items after logout
      if (cartItemsToPreserve) {
        localStorage.setItem('plastik-cart', JSON.stringify({
          items: cartItemsToPreserve,
          isOpen: false,
          isLoading: false,
          timestamp: Date.now()
        }))
      }
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
      
      // Navigate to home page
      window.location.href = "/"
    } catch (error) {
      console.error("Sign out error:", error)
      
      // Force navigation even if signOut fails
      window.location.href = "/"
    }
  }

  return (
    <nav className="grid items-start gap-2 mt-6">
      <Link href="/dashboard">
        <Button variant="ghost" className={cn("w-full justify-start", pathname === "/dashboard" && "bg-muted")}>
          Dashboard
        </Button>
      </Link>
      <Link href="/dashboard/orders">
        <Button variant="ghost" className={cn("w-full justify-start", pathname.startsWith("/dashboard/orders") && "bg-muted")}>
          Orders
        </Button>
      </Link>
      <Link href="/dashboard/profile">
        <Button variant="ghost" className={cn("w-full justify-start", pathname === "/dashboard/profile" && "bg-muted")}>
          Profile
        </Button>
      </Link>
      
      <Button
        variant="ghost"
        className="w-full justify-start mt-6 text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20"
        onClick={handleSignOut}
      >
        Sign Out
      </Button>
    </nav>
  )
}

