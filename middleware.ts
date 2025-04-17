import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { jwtVerify } from 'jose'

// This middleware ensures proper navigation to protected routes
export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const path = request.nextUrl.pathname
  
  // Check if the request is for a protected route
  const isProtectedRoute = path.startsWith('/dashboard')
  
  // Skip if not a protected route
  if (!isProtectedRoute) return NextResponse.next()
  
  try {
    console.log(`[Auth] Checking auth for protected route: ${path}`)
    
    // First try NextAuth token
    const nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    
    // If we have a NextAuth token, allow the request
    if (nextAuthToken) {
      console.log(`[Auth] NextAuth token found, allowing access to ${path}`)
      return NextResponse.next()
    }
    
    // Otherwise, check for our custom token
    const customToken = request.cookies.get('auth-token')?.value
    console.log(`[Auth] NextAuth token not found, checking for custom token. Has token: ${!!customToken}`)
    
    if (customToken) {
      try {
        // Verify the custom token
        const secret = new TextEncoder().encode(
          process.env.NEXTAUTH_SECRET || 'temporarysecret'
        )
        
        await jwtVerify(customToken, secret)
        
        // If we get here, the token is valid
        console.log(`[Auth] Custom token verified, allowing access to ${path}`)
        return NextResponse.next()
      } catch (error) {
        console.error('[Auth] Invalid custom token:', error)
      }
    }
    
    // Also check for auth-token in localStorage via a cookie we'll set in the sign-in form
    const localStorageToken = request.cookies.get('ls-auth-token')?.value
    console.log(`[Auth] Checking for localStorage token cookie. Has token: ${!!localStorageToken}`)
    
    if (localStorageToken) {
      try {
        // Verify the localStorage token
        const secret = new TextEncoder().encode(
          process.env.NEXTAUTH_SECRET || 'temporarysecret'
        )
        
        await jwtVerify(localStorageToken, secret)
        
        // If we get here, the token is valid
        console.log(`[Auth] localStorage token verified, allowing access to ${path}`)
        return NextResponse.next()
      } catch (error) {
        console.error('[Auth] Invalid localStorage token:', error)
      }
    }
    
    // If we get here, no valid token exists
    console.log(`[Auth] No valid token exists, redirecting to login from ${path}`)
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  } catch (error) {
    console.error('[Auth] Auth middleware error:', error)
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}

// Only apply this middleware to specific paths
export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}