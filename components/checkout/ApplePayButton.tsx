"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ApplePayButtonProps {
  total: number
}

declare var ApplePaySession: any

export function ApplePayButton({ total }: ApplePayButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleApplePayment = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/apple-pay/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ total }),
      })

      if (!response.ok) {
        throw new Error("Failed to create Apple Pay session")
      }

      const { merchantIdentifier, merchantCapabilities, supportedNetworks } = await response.json()

      const session = new ApplePaySession(3, {
        countryCode: "US",
        currencyCode: "USD",
        supportedNetworks,
        merchantCapabilities,
        total: {
          label: "Plastik Records",
          amount: total.toFixed(2),
        },
      })

      session.onvalidatemerchant = async (event) => {
        const merchantSession = await fetch("/api/apple-pay/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            validationURL: event.validationURL,
          }),
        }).then((res) => res.json())

        session.completeMerchantValidation(merchantSession)
      }

      session.onpaymentauthorized = async (event) => {
        const { token } = event.payment

        const response = await fetch("/api/apple-pay/process-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, total }),
        })

        if (response.ok) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS)
          // Handle successful payment (e.g., show confirmation, clear cart)
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE)
          // Handle payment failure
        }
      }

      session.begin()
    } catch (error) {
      console.error("Apple Pay error:", error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleApplePayment} disabled={isLoading} className="w-full bg-black text-white hover:bg-gray-800">
      {isLoading ? "Processing..." : "Pay with Apple Pay"}
    </Button>
  )
}

