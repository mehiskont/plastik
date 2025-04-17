"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import * as z from "zod"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { calculatePriceWithoutFees } from "@/lib/price-calculator"
import { loadStripe } from "@stripe/stripe-js"

const checkoutSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  postalCode: z.string().min(2, "Postal code must be at least 2 characters"),
  createAccount: z.boolean().optional(),
  password: z
    .string()
    .optional()
    .refine((val) => {
      if (val === "") return true
      return val && val.length >= 8
    }, "Password must be at least 8 characters"),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

interface CheckoutFormProps {
  onCancel?: () => void
}

export function CheckoutForm({ onCancel }: CheckoutFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { state, dispatch } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const [createAccount, setCreateAccount] = useState(false)

  // Use the actual price instead of calculating without fees
  const total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: session?.user?.email || "",
      name: session?.user?.name || "",
      createAccount: false,
    },
  })

  const handleSubmit = async (data: CheckoutFormValues) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: state.items,
          customer: {
            ...data,
            createAccount: createAccount,
          },
        }),
      })

      if (!response.ok) throw new Error("Network response was not ok")

      const { sessionId } = await response.json()
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) throw error
      }
    } catch (error) {
      console.error("Error:", error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} disabled={!!session} />
        {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" {...form.register("name")} disabled={!!session} />
        {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...form.register("address")} />
        {form.formState.errors.address && (
          <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" {...form.register("city")} />
        {form.formState.errors.city && <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input id="country" {...form.register("country")} />
        {form.formState.errors.country && (
          <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="postalCode">Postal Code</Label>
        <Input id="postalCode" {...form.register("postalCode")} />
        {form.formState.errors.postalCode && (
          <p className="text-sm text-red-500">{form.formState.errors.postalCode.message}</p>
        )}
      </div>

      {!session && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="createAccount"
            checked={createAccount}
            onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
          />
          <Label htmlFor="createAccount" className="text-sm">
            Create an account for faster checkout next time
          </Label>
        </div>
      )}

      {createAccount && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...form.register("password")} />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>
      )}

      <div className="font-semibold">Total: ${total.toFixed(2)}</div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Back to Cart
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Proceed to Payment"
          )}
        </Button>
      </div>
    </form>
  )
}

