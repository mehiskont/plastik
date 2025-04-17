import { NextRequest, NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'
import { log } from '@/lib/logger'

/**
 * Direct login endpoint that bypasses NextAuth temporarily
 * to troubleshoot the login issues
 */
export async function POST(request: NextRequest) {
  try {
    log('Direct login endpoint called', {}, 'info')
    
    // Get request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      log('Failed to parse login request body', { error: String(error) }, 'error')
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    // Check credentials
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }
    
    // Make sure we have a properly formatted API URL
    let apiUrl = process.env.API_BASE_URL
    if (!apiUrl) {
      log('API_BASE_URL not configured', {}, 'error')
      return NextResponse.json({ error: 'API_BASE_URL not configured' }, { status: 500 })
    }
    
    // Remove trailing slash if present
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1)
    }
    
    // Call the API login endpoint
    const loginUrl = `${apiUrl}/api/auth/login`
    log(`Calling API login endpoint: ${loginUrl}`, { email }, 'info')
    
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      
      // Get the response text to log for debugging
      const responseText = await response.text()
      
      log(`API response: ${responseText}`, {
        status: response.status
      }, 'info')
      
      // Try to parse the response as JSON
      let userData;
      try {
        userData = responseText ? JSON.parse(responseText) : null
      } catch (error) {
        log('Failed to parse API response as JSON', { 
          error: String(error),
          responseText
        }, 'error')
        
        return NextResponse.json({ 
          error: 'Invalid API response',
          details: responseText 
        }, { status: 500 })
      }
      
      // If the API returns an error, return it to the client
      if (!response.ok) {
        return NextResponse.json({
          error: userData?.message || userData?.error || 'Authentication failed',
          status: response.status
        }, { status: response.status })
      }
      
      // Extract cookies from response if any
      const cookies = response.headers.getSetCookie()
      
      // Create a session JWT token manually
      // This bypasses NextAuth for testing purposes
      const token = sign({
        email,
        name: email.split('@')[0],
        id: userData?.id || userData?.user?.id || `user-${Date.now()}`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      }, process.env.NEXTAUTH_SECRET || 'temporarysecret')
      
      // Create the response
      const nextResponse = NextResponse.json({
        success: true,
        token,
        user: {
          email,
          name: email.split('@')[0],
          id: userData?.id || userData?.user?.id || `user-${Date.now()}`
        }
      })
      
      // Forward API cookies if any
      if (cookies && cookies.length > 0) {
        cookies.forEach(cookie => {
          nextResponse.headers.append('Set-Cookie', cookie)
        })
      }
      
      // Set our own auth cookie for frontend usage
      nextResponse.cookies.set({
        name: 'auth-token',
        value: token,
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: 'lax'
      })
      
      return nextResponse
    } catch (error) {
      log('Error calling API login endpoint', { error: String(error) }, 'error')
      return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 })
    }
  } catch (error) {
    log('Direct login handler error', { error: String(error) }, 'error')
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}