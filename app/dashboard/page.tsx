import { getServerSession } from "next-auth"
import { OrderList } from "@/components/dashboard/order-list"
import { authOptions } from "@/lib/auth"
import { mockOrders } from "@/lib/mock-data/orders"
import { log } from "@/lib/logger"
import { cookies } from "next/headers"
import { decode } from "jsonwebtoken"

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default async function DashboardPage() {
  // First try to get NextAuth session
  const session = await getServerSession(authOptions)
  
  // Get user info from either NextAuth session or from our custom token
  let userId = session?.user?.id
  let userName = session?.user?.name
  let userEmail = session?.user?.email
  
  // If we don't have a NextAuth session, try our custom tokens
  if (!session) {
    const cookieStore = cookies()
    const customToken = cookieStore.get('auth-token')?.value
    const localStorageToken = cookieStore.get('ls-auth-token')?.value
    
    // If we have a custom token, decode it to get user info
    if (customToken || localStorageToken) {
      try {
        const token = customToken || localStorageToken
        const decoded = decode(token!)
        
        if (decoded && typeof decoded === 'object') {
          userId = decoded.id as string || decoded.userId as string
          userName = decoded.name as string
          userEmail = decoded.email as string
        }
      } catch (error) {
        log("Failed to decode custom token", { error: String(error) }, "error")
      }
    }
  }
  
  log("Dashboard page user data:", {
    hasNextAuthSession: !!session,
    userId,
    userName,
    userEmail: userEmail ? `${userEmail.substring(0, 3)}...` : null,
  });
  
  let orders = [];
  let apiError = false;

  // Try to get user orders from the external API
  if (userId && EXTERNAL_API_URL) {
    try {
      // TODO: Add appropriate Authorization header using session token if required by the external API
      const response = await fetch(`${EXTERNAL_API_URL}/api/orders?limit=5`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Example Authorization header (adjust based on your auth strategy):
          // 'Authorization': `Bearer ${session.accessToken}`
        },
        // Add cache control if needed, e.g., fetch fresh data on every request
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorBody = await response.text();
        log(`Failed to fetch orders from external API: ${response.status} - ${errorBody}`, "error");
        throw new Error(`API error: ${response.statusText}`);
      }

      const fetchedOrders = await response.json();
      // TODO: Validate the structure of fetchedOrders if necessary
      // Ensure it's an array and items match OrderList expectations
      if (Array.isArray(fetchedOrders)) {
         orders = fetchedOrders;
         log(`Fetched ${orders.length} orders from external API successfully.`);
      } else {
         log(`External API response for orders was not an array: ${JSON.stringify(fetchedOrders)}`, "error");
         throw new Error("Invalid data format from API");
      }

    } catch (error) {
      log(`Error fetching orders from external API: ${error instanceof Error ? error.message : String(error)}`, "error");
      apiError = true;
      orders = mockOrders; // Fallback to mock data (which is empty)
    }
  } else {
     log("Dashboard: Not fetching orders (no user ID or API URL)", "info");
     // If not logged in, orders remain empty, no error is shown
     // If API URL is missing, log it and show error state
     if (!EXTERNAL_API_URL) {
        log("External API URL is not configured", "error");
        apiError = true; // Show API error if URL is missing
        orders = mockOrders; // Use fallback
     }
  }

  return (
    <div className="flex-1 space-y-6 pb-6 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {/* Welcome section */}
      <div className="rounded-lg border p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Welcome, {userName || 'Vinyl Enthusiast'}!</h3>
        <p className="text-muted-foreground mb-2">
          From your dashboard, you can view your order history and manage your profile.
        </p>
      </div>
      
      {/* Order history section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Recent Orders</h3>
          {orders.length > 0 && (
            <a href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              View all orders →
            </a>
          )}
        </div>
        
        {apiError ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-6 text-center">
            <p className="text-yellow-800 dark:text-yellow-400">
              We're having trouble loading your order history right now.
            </p>
            <p className="text-yellow-700 dark:text-yellow-500 text-sm mt-2">
              Please try refreshing the page in a few moments.
            </p>
          </div>
        ) : orders.length > 0 ? (
          <>
            <OrderList orders={orders} />
            <div className="text-center mt-2">
              <a href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 md:hidden inline-block">
                View all orders →
              </a>
            </div>
          </>
        ) : (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

