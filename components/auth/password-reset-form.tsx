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

// Validation schema
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

type FormValues = z.infer<typeof formSchema>;

export function PasswordResetForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    
    try {
      // Show loading toast to indicate the request is being processed
      toast({
        title: "Sending reset link...",
        description: "Please wait while we process your request.",
      });
      
      // Request password reset
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: data.email
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        toast({
          title: "Check your email",
          description: "If an account exists with this email, you'll receive a reset link shortly.",
        });
      } else {
        toast({
          title: "Request failed",
          description: result.message || "Failed to process your request. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to process your request. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col space-y-4 items-center">
        <Icons.mail className="h-12 w-12 text-primary" />
        <h3 className="text-xl font-semibold">Check your email</h3>
        <p className="text-center text-muted-foreground">
          If an account exists with that email address, we've sent a password reset link.
          Please check your inbox (and spam folder).
        </p>
        <div className="text-center text-sm mt-4">
          <Link href="/auth/signin" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-3">
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
          
          <Button disabled={isLoading} className="mt-4">
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </div>
      </form>
      
      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/auth/signin" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}