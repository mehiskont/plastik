'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Unhandled error:", error)
  }, [error])

  // Consider more generic error messages or checks
  const isDatabaseError = error.message.includes('database'); // Example generic check

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-2">An Error Occurred</h1>
      {isDatabaseError ? (
        <p className="text-lg text-muted-foreground mb-6">
          We're having trouble connecting to our services. Please try again later.
        </p>
      ) : (
        <p className="text-lg text-muted-foreground mb-6">
          Something went wrong on our end. We've been notified and are looking into it.
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
        <Button onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">
            Return to home
          </Link>
        </Button>
      </div>
    </div>
  )
}

