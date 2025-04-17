import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    log('Proxying session check to backend API', {}, 'info')
    
    // Make sure we have a properly formatted URL
    let apiUrl = process.env.API_BASE_URL
    if (!apiUrl) {
      log('API_BASE_URL not configured', {}, 'error')
      return NextResponse.json({ 
        error: 'Backend API URL is not properly configured'
      }, { status: 500 })
    }
    
    // Remove trailing slash if present
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1)
    }
    
    const cookies = request.headers.get('cookie') || ''
    const fullUrl = `${apiUrl}/api/auth/session`
    
    log(`Forwarding session check to ${fullUrl}`, {
      cookiesLength: cookies.length
    }, 'info')
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies from browser to backend
        'Cookie': cookies
      },
      credentials: 'include'
    })

    if (!response.ok) {
      log('Session check failed', { status: response.status }, 'error')
      return NextResponse.json(
        { error: 'Session check failed' },
        { status: response.status }
      )
    }

    // Get response data
    const data = await response.json()
    
    // Create response
    const nextResponse = NextResponse.json(data)

    // Forward cookies from backend to browser
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        nextResponse.headers.set(key, value)
      }
    })

    return nextResponse
  } catch (error) {
    log('Session proxy error', { error: String(error) }, 'error')
    return NextResponse.json(
      { error: 'SessionError' },
      { status: 500 }
    )
  }
}