import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { LiveOrders } from "@/components/dashboard/live-orders"

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  
  console.log("Dashboard page session:", {
    hasSession: !!session,
    sessionData: session?.user ? {
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email?.substring(0, 5) + '...'
    } : null
  })
  
  // We still need the session check to prevent errors
  if (!session?.user?.id) {
    console.warn("Orders page accessed without valid session")
    return (
      <div className="space-y-6 pb-6 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Your Orders</h2>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-6">
          <p className="text-yellow-800 dark:text-yellow-400">
            Session problem detected. Please try signing in.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 pb-6 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Your Orders</h2>
      
      {/* Use the client component to fetch orders */}
      <LiveOrders />
    </div>
  )
}

