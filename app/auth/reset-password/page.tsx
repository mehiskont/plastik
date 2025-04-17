import type { Metadata } from "next"
import { PasswordResetForm } from "@/components/auth/password-reset-form"
import dynamic from 'next/dynamic'

const Background = dynamic(() => import('@/components/auth/background-animation'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-background" />
})

export const metadata: Metadata = {
  title: "Reset Password | Plastik Record Store",
  description: "Reset your password to access your account",
}

export default function ResetPasswordPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-20 flex h-full w-full items-center justify-center">
          <Background />
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted-foreground">Enter your email to receive a password reset link</p>
          </div>
          <PasswordResetForm />
        </div>
      </div>
    </div>
  )
}