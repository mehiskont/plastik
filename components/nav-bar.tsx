"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Menu, ShoppingCart, User, X, LogOut, Home, Info, Phone } from "lucide-react"
import { useAuth } from "@/hooks/use-auth" // Import our custom auth hook
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCart } from "@/contexts/cart-context"
import { Cart } from "@/components/cart"
import { SearchBar } from "@/components/search-bar"
import { usePathname, useRouter } from "next/navigation"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session, status: nextAuthStatus } = useSession()
  const { user, status } = useAuth() // Use our custom hook
  const { cart, toggleCart, clearCart } = useCart()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  // Check if current page is not the homepage and not the search page
  const isNotHomePage = pathname !== "/" 
  const isNotSearchPage = pathname !== "/search"
  const shouldShowSearchBar = isNotHomePage && isNotSearchPage

  // Fix hydration issues with session and ensure components render properly
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  const handleCartClick = () => {
    toggleCart()
  }

  return (
    <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link style={{
    zIndex: 100,
    position: 'relative',
    display: 'block'
  }}
              href="/"
            >
              <svg className="logo-plastik" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 453.54 198.43" style={{enableBackground: "new 0 0 453.54 198.43"}} xmlSpace="preserve">
                  <path d="M360.1,61.17c5.81-10.33-13.24-13.02-15.88,7.54c-0.42,3.23-0.34,6.79,1.83,7.93c3.2,1.69,3.82-1.74,5.35-3.94  C354.08,68.86,357.65,65.52,360.1,61.17 M130.19,102.16c-9.03,18.85-21.42,45.92-12.09,51.5c7.05,1.72,25.79-20.48,28.09-24.18  c1.96,1.97,0.87,0.77,1.87,3.73c5.08,15.01,15.87,2.01,20.35-2.26c4.25-4.05,16.25-18.22,21.74-19.75  c-0.71,6.9-9.24,18.34-0.65,22.86c9.49,5,31.89-16.51,38.33-22.07c3.61-3.11,11.17-13.79,16.56-13.26  c4.29,17.08-10.69,16.31-16.37,23.09c-9.55,11.38-0.14,22.01,11.58,14.2c4.07-2.71,6.19-6.55,9.24-11.12  c2.41-3.61,9.57-4.04,13.91-5.82c14.16-5.79,14.83-11.45,22.58-16.71c-2.31,8.28-11.48,25.86-2.39,32.43  c14.95,2.84,31.58-25.75,39.51-29.04c0.22,6.1-8.63,18.16-1.63,22.97c6.4,4.4,17.73-4.82,20.99-7.4  c9.57-7.59,27.53-27.53,30.32-29.38c-2.1,9.05-15.25,34.58-5.47,40.85c8.49-0.42,12.49-19.02,19.04-23.08  c1.92,24.12,2.34,40.67,25.53,21.61c5.81-4.78,11.11-9.88,16.2-15.5c3.55-3.92,13.8-10.55,12.1-17.78  c-5.83-1.05-7.83,3.02-10.67,5.79c-2.94,2.87-5.79,5.17-8.6,8.02c-10.63,10.79-24.91,22.97-24.71-1.84  c6.81-3.04,15.79-8.48,20.3-12.83c3.49-3.37,12.71-16.21,2.9-20.58c-14.09-6.28-34.12,22.48-39.56,24.86  c3-14.79,21.6-45.71,29.45-53.57c25.13-25.14,20.57-38.4,8.01-32.36c-10.66,5.12-20.75,25.57-26.01,36.45  c-10.89,22.55-5.53,10.58-16.45,24.93c-5.18,6.81-33.32,39.63-44.8,39.14c-0.54-8.36,14.62-23.84,11.01-29.76  c-8.56-10.76-37.21,34.87-50.35,34.31c-2.85-10.99,16.41-44.32,21.55-50.74c4.31-0.21,13.54-0.3,17.32-1.29  c4.96-1.29,5.6-8.54,1.65-11.24c-2.25-1.66-6.7-0.07-10.16,0.42c1.01-4.18,5.57-9.83,1.24-14.29c-7.51-4.02-14.45,11.29-17.57,16.1  c-8.51,1.16-16.96,1.73-25.39,2.96c-6.47,0.94-19.73,1.67-14.24,11.54c3.33,2.17,12.26-1.22,16.67-1.89  c5.73-0.87,11.57-1.34,17.41-1.73c-3.77,10.63-12.18,20-18.1,25.62c-9.08,8.63-9.44,12.07-25.5,17.1  c0.92-7.31,6.69-20.29,0.49-25.79c-7.69-6.82-16.58,2.72-20.38,6.36c-4.29,4.11-26.95,29.48-35.62,27.03  c-4.38-5.93,7.95-12.61,1.67-22.34c-15.45-3.4-33.27,24.72-40.45,24.83c0.07-6.6,12.83-17.84,16.97-21.25  c15.34-12.62,15.74-9.22,23.72-13.97c1.24-11.79-14.76-4.74-20.2-1.91c-19.85,10.31-41.37,43.49-49.95,43.76  c-3.22-8.92,27.21-63.15,34.52-75.02c3.59-5.82,14.84-16.93,8.22-23.56c-6.17-1.02-9.51,6.31-12.56,10.44  c-12.43,16.87-63.55,84.63-78.32,81.8c-0.97-9.14,19.58-26.43,8.24-34.16c-11.32-3.46-22.32,12.55-27.77,15.44  c0.77-6.42,7.39-15.1,1.88-18.36c-6-4.34-17.86,6.57-20.85,9.26C40.92,99,30.13,106.8,32.06,113.39  c8.26,2.69,12.82-10.02,19.92-12.89c1.56,9.91-27.3,47.14-34.73,65.35c-7.49,18.35,2.29,20.76,6.92,17.13  c3.16-2.48,18.9-37.38,22.63-44.23c4.48-8.24,23.43-36.49,32.09-33.85c1.9,6.17-14.03,18.44-9.41,28.88  c4.66,10.54,23-3.59,27.24-6.83c20.29-15.51,34.17-37.02,41.23-42.02C137.22,87.71,134,94.21,130.19,102.16 M391.1,102.16  c1.67-3.35,12.52-15,19.84-16.59C409.5,92.97,396.24,101.05,391.1,102.16z"/>
              </svg>
            </Link>
            
            {/* Show search bar in navbar only when not on homepage and not on search page */}
            {shouldShowSearchBar && (
              <div className="hidden md:block relative z-50 navbar-searchbar">
                <SearchBar isCompact={true} expandable={true} />
              </div>
            )}
            
            <div className="hidden">
              {/* Removed desktop links */}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 z-50">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative" onClick={handleCartClick}>
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
            </Button>
            {!mounted ? null : status === "loading" ? (
              <Button variant="ghost" size="icon" disabled>
                <User className="h-5 w-5 opacity-50" />
              </Button>
            ) : status === "authenticated" && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.name && <p className="font-medium">{user.name}</p>}
                      {user.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/orders">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onSelect={(event) => {
                      event.preventDefault();
                      // Clear cart
                      clearCart();
                      // Remove cart from localStorage
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('cart');
                        localStorage.removeItem('auth-token');
                        localStorage.removeItem('user');
                      }
                      // For NextAuth sessions
                      signOut({ callbackUrl: '/auth/signin' });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/signin">
                <Button variant="primary">Sign In</Button>
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu-overlay flex flex-col overflow-y-auto mobile-menu-animate">
            
            <div className="flex-1 flex flex-col pt-6">
              {/* Search bar - only when not on homepage or search page */}
              {shouldShowSearchBar && (
                <div className="mb-6 px-1">
                  <SearchBar isCompact={false} />
                </div>
              )}
              
              {/* Main navigation links */}
              <div className="flex flex-col gap-4 mb-8">
                <Link href="/" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg font-medium">
                    <Home className="h-5 w-5 mr-3" />
                    Home
                  </Button>
                </Link>
                <Link href="/search" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg font-medium">
                    All Records
                  </Button>
                </Link>
                <Link href="/shipping" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-lg font-medium">
                    <Info className="h-5 w-5 mr-3" />
                    Shipping Info
                  </Button>
                </Link>
              </div>
              
              {/* Cart and account section */}
              <div className="mt-auto pt-6 border-t">
                <div className="flex items-center justify-between mb-6">
                  <ThemeToggle />
                  <Button variant="outline" size="icon" className="relative" onClick={() => {
                    handleCartClick();
                    setIsMenuOpen(false);
                  }}>
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[11px] font-medium flex items-center justify-center text-primary-foreground">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                </div>
                
                {!mounted ? null : status === "loading" ? (
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" disabled>
                      <User className="h-4 w-4 mr-2 opacity-50" />
                      <span>Loading...</span>
                    </Button>
                  </div>
                ) : status === "authenticated" && user ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 py-2">
                      <User className="h-5 w-5" />
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-sm text-muted-foreground truncate max-w-[250px]">{user.email}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 pt-4">
                      <Link 
                        href="/dashboard" 
                        className="w-full"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button variant="outline" className="w-full justify-start">
                          Dashboard
                        </Button>
                      </Link>
                      <Link 
                        href="/dashboard/orders" 
                        className="w-full"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button variant="outline" className="w-full justify-start">
                          Orders
                        </Button>
                      </Link>
                      <Link 
                        href="/dashboard/profile" 
                        className="w-full"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button variant="outline" className="w-full justify-start">
                          Profile
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="destructive"
                        className="w-full justify-start mt-3"
                        onClick={() => {
                          // Clear cart
                          clearCart();
                          // Remove cart from localStorage
                          if (typeof window !== 'undefined') {
                            localStorage.removeItem('cart');
                            localStorage.removeItem('auth-token');
                            localStorage.removeItem('user');
                          }
                          signOut({ callbackUrl: '/auth/signin' });
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Sign out</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 items-center">
                    <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)} className="w-full">
                      <Button variant="primary" size="lg" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)} className="w-full">
                      <Button variant="outline" size="lg" className="w-full">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Cart />
    </nav>
  )
}

