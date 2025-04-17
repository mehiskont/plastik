import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

/**
 * Direct login endpoint that bypasses the session store
 * This is a temporary solution until the session store issue is fixed
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
      
      // Get the response data
      const responseText = await response.text()
      let responseData
      
      try {
        responseData = responseText ? JSON.parse(responseText) : {}
      } catch (error) {
        log('Failed to parse API response', { 
          error: String(error), 
          responseText: responseText.substring(0, 100) 
        }, 'error')
        return NextResponse.json({ error: 'Invalid API response' }, { status: 500 })
      }
      
      // Handle the response
      if (response.ok) {
        log('API login successful', { email }, 'info')
        
        // Instead of using sessions, we'll extract user data and create a response
        // that NextAuth can use with JWT strategy
        
        // Extract user info from various possible formats
        let userData = null
        
        if (responseData.user && typeof responseData.user === 'object') {
          userData = responseData.user
        } else if (responseData.id) {
          userData = responseData
        } else if (responseData.data?.user && typeof responseData.data.user === 'object') {
          userData = responseData.data.user
        }
        
        if (!userData) {
          // Create minimal user data if we couldn't extract it
          userData = {
            id: `user-${Date.now()}`,
            email,
            name: email.split('@')[0]
          }
          log('Created minimal user data from email', { email }, 'warn')
        }
        
        // Create a standardized user object
        const user = {
          id: userData.id || `user-${Date.now()}`,
          email: userData.email || email,
          name: userData.name || email.split('@')[0],
          // Include any additional fields
          ...(userData.role ? { role: userData.role } : {})
        }
        
        // Return the user data in a format NextAuth expects
        return NextResponse.json({ 
          success: true,
          user
        })
      } else {
        // Login failed
        log('API login failed', { 
          status: response.status, 
          response: responseData 
        }, 'warn')
        
        return NextResponse.json({ 
          error: responseData.message || responseData.error || 'Authentication failed' 
        }, { status: 401 })
      }
    } catch (error) {
      log('Error calling API login endpoint', { error: String(error) }, 'error')
      return NextResponse.json({ error: 'Failed to connect to API' }, { status: 500 })
    }
  } catch (error) {
    log('Direct login handler error', { error: String(error) }, 'error')
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}