import { CheckoutFlow } from "@/components/checkout/CheckoutFlow"

export default function CheckoutPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <CheckoutFlow />
    </div>
  )
}

