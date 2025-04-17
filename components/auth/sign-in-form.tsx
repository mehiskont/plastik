"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useToast } from "@/components/ui/use-toast"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"

interface SignInFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SignInForm({ className, ...props }: SignInFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [email, setEmail] = React.useState<string>("")
  const [password, setPassword] = React.useState<string>("")
  // Use a relative URL to prevent URL construction issues
  // Using a plain path string is safer than constructing full URLs
  const callbackUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/dashboard`
    : "/dashboard"
  

  // Email magic link sign in - this functionality has been disabled
  // The email provider has been conditionally disabled in auth.ts if not properly configured
  async function onMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      })

      if (!result?.error) {
        toast({
          title: "Check your email",
          description: "We sent you a login link. Be sure to check your spam too.",
        })
      } else {
        console.error("Magic link error:", result.error);
        toast({
          title: "Email login unavailable",
          description: "Please use password or Google sign-in instead.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Magic link exception:", error);
      toast({
        title: "Something went wrong",
        description: "Your sign in request failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Password sign in
  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    // Mark cart for merging during login (if cart exists)
    if (typeof window !== 'undefined') {
      try {
        const cartData = localStorage.getItem('plastik-cart');
        if (cartData) {
          const parsedCart = JSON.parse(cartData);
          if (parsedCart.items && parsedCart.items.length > 0) {
            console.log(`Marking ${parsedCart.items.length} guest cart items for merge during login`);
            localStorage.setItem('plastik-cart-login-time', Date.now().toString());
          }
        }
      } catch (err) {
        console.error('Error checking cart before login:', err);
      }
    }
    
    try {
      console.log("Attempting direct API login");
      
      // Use our direct login API endpoint instead of NextAuth
      const response = await fetch('/api/direct-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        // Successful login
        const data = await response.json();
        console.log("Login successful, data:", data);
        
        // Store the token in localStorage for client-side access
        if (data.token) {
          localStorage.setItem('auth-token', data.token);
          
          // Set a cookie to let the middleware know we have a token in localStorage
          // This cookie doesn't contain the actual token, just signals its existence
          document.cookie = `ls-auth-token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
        
        // Store user info for UI
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        toast({
          title: "Welcome back!",
          description: "You've been successfully signed in.",
        })
        
        console.log("Navigating to dashboard");
        
        // Force hard navigation
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json();
        console.error("Authentication error:", errorData);
        toast({
          title: "Authentication failed",
          description: errorData.error || "Your email or password is incorrect.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Sign in exception:", error);
      toast({
        title: "Something went wrong",
        description: "Your sign in request failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6" {...props}>
      <form onSubmit={onPasswordSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1 mb-3">
            <Label htmlFor="email-password">Email</Label>
            <Input
              id="email-password"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1 mb-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link 
                href="/auth/reset-password" 
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button disabled={isLoading} className="mt-4">
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </div>
      </form>
      <div className="mt-4 text-center text-sm">
        Don't have an account?{" "}
        <Link href="/auth/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={() => {
          setIsLoading(true)
          // Log the attempt with the callback URL
          console.log("Attempting Google sign in with callbackUrl:", "/dashboard");
          
          // Use redirect: true for OAuth providers to complete the flow
          signIn("google", { 
            callbackUrl: "/dashboard",
            redirect: true
          }).catch(error => {
            console.error("Google sign in error:", error);
            setIsLoading(false);
            toast({
              title: "Authentication Error",
              description: "Error signing in with Google. Please try again.",
              variant: "destructive",
            });
          });
        }}
      >
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
    </div>
  )
}

