"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useToast } from "@/components/ui/use-toast"
import { signIn } from "next-auth/react"

// Validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type FormValues = z.infer<typeof formSchema>;

export function SignUpForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    
    try {
      // Use the external API URL environment variable for registration
      const registerApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`
        : null;
      
      if (!registerApiUrl) {
        throw new Error("API base URL is not configured - NEXT_PUBLIC_API_BASE_URL missing");
      }
      
      const response = await fetch(registerApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password
        })
      });
      
      let result;
      try {
        result = await response.json();
      } catch (error) {
        console.error("Failed to parse response JSON:", error);
        throw new Error("Invalid response from server");
      }
      
      if (response.ok) {
        toast({
          title: "Account created!",
          description: "Your account has been created successfully. You can now sign in.",
        });
      } else {
        // Handle specific errors
        if (response.status === 409) {
          toast({
            title: "Email already in use",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive"
          });
        } else if (response.status === 503) {
          toast({
            title: "Service unavailable",
            description: "Registration is temporarily unavailable. Please try again later.",
            variant: "destructive"
          });
          // Redirect to sign in page after a short delay
          setTimeout(() => {
            router.push('/auth/signin');
          }, 3000);
        } else {
          toast({
            title: "Registration failed",
            description: result.message || "Something went wrong. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to create your account. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              autoCapitalize="none"
              autoComplete="name"
              autoCorrect="off"
              disabled={isLoading}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              autoComplete="new-password"
              disabled={isLoading}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <div className="grid gap-1">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              autoComplete="new-password"
              disabled={isLoading}
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          
          <Button disabled={isLoading} className="mt-4">
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </div>
      </form>
      
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-primary hover:underline">
          Sign in
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
          signIn("google", { callbackUrl: "/dashboard" })
            .catch(error => {
              console.error("Google sign in error:", error);
              setIsLoading(false);
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