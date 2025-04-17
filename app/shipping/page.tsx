import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "Shipping information and policies for Plastik Record Store",
}

export default function ShippingPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold mb-8">Shipping Information</h1>
      <div className="prose dark:prose-invert">
        <h2>Shipping Methods</h2>
        <p>We offer the following shipping options:</p>
        <ul>
          <li>Standard Shipping (5-7 business days) - $5.00</li>
          <li>Express Shipping (1-2 business days) - $15.00</li>
        </ul>

        <h2>International Shipping</h2>
        <p>
          We currently ship to the United States, Canada, and the United Kingdom. International shipping rates vary by
          location and will be calculated at checkout.
        </p>

        <h2>Packaging</h2>
        <p>
          All vinyl records are carefully packaged in high-quality record mailers with additional corner protection. We
          take extra care to ensure your records arrive in perfect condition.
        </p>

        <h2>Order Tracking</h2>
        <p>
          Once your order ships, you will receive a confirmation email with tracking information. You can also track
          your order through your account dashboard.
        </p>

        <h2>Returns</h2>
        <p>
          If you receive a damaged item, please contact us within 48 hours of delivery. We will provide a return
          shipping label and process your refund once we receive the returned item.
        </p>
      </div>
    </div>
  )
}

