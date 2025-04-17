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
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type FormValues = z.infer<typeof formSchema>;

interface NewPasswordFormProps {
  token: string;
}

export function NewPasswordForm({ token }: NewPasswordFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    
    try {
      // Reset password
      const response = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          password: data.password
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        toast({
          title: "Password reset successful",
          description: "Your password has been reset. You can now sign in with your new password.",
        });
      } else {
        toast({
          title: "Password reset failed",
          description: result.message || "Failed to reset your password. This link may be invalid or expired.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to reset your password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col space-y-4 items-center">
        <Icons.check className="h-12 w-12 text-green-500" />
        <h3 className="text-xl font-semibold">Password Reset Successful</h3>
        <p className="text-center text-muted-foreground">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <Button 
          onClick={() => router.push('/auth/signin')}
          className="mt-4"
        >
          Go to Sign In
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="password">New Password</Label>
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
            Reset Password
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