import type React from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard/nav"
import { authOptions } from "@/lib/auth"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { log } from "@/lib/logger"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // First try NextAuth session
  const session = await getServerSession(authOptions)
  
  // If we have a NextAuth session, we're good to go
  if (session) {
    log("Dashboard layout: Using NextAuth session", { email: session.user?.email }, "info")
    return renderDashboard(children)
  }
  
  // Otherwise, check for our custom auth token
  const cookieStore = cookies()
  const customToken = cookieStore.get('auth-token')?.value
  const localStorageToken = cookieStore.get('ls-auth-token')?.value
  
  log("Dashboard layout: Checking auth tokens", { 
    hasCustomToken: !!customToken,
    hasLocalStorageToken: !!localStorageToken
  }, "info")
  
  // Verify custom token if we have one
  if (customToken || localStorageToken) {
    try {
      const token = customToken || localStorageToken
      const secret = new TextEncoder().encode(
        process.env.NEXTAUTH_SECRET || 'temporarysecret'
      )
      
      await jwtVerify(token!, secret)
      
      // If we get here, the token is valid
      log("Dashboard layout: Custom token verified, allowing access", {}, "info")
      return renderDashboard(children)
    } catch (error) {
      log("Dashboard layout: Invalid custom token", { error: String(error) }, "error")
    }
  }
  
  // If no valid authentication, redirect to sign in
  log("Dashboard layout: No valid authentication, redirecting to sign in", {}, "warn")
  redirect("/auth/signin")
}

function renderDashboard(children: React.ReactNode) {
  return (
    <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
      <aside className="hidden w-[200px] flex-col md:flex">
        <DashboardNav />
      </aside>
      <main className="flex w-full flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}

