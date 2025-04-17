import { NextResponse } from 'next/server'
import { log } from '@/lib/logger'

export async function GET() {
  try {
    log('DB status check requested', {}, 'info')
    
    // We're now in API mode, but check config for informational purposes
    const useStandaloneMode = process.env.NEXTAUTH_STANDALONE === "true" || 
                              process.env.AUTH_FORCE_FALLBACK === "true";
    
    if (useStandaloneMode) {
      log('API mode is active despite standalone settings', {}, 'warn')
    }
    
    // Make sure we have a properly formatted URL
    let apiUrl = process.env.API_BASE_URL
    if (!apiUrl) {
      log('API_BASE_URL not configured', {}, 'error')
      return NextResponse.json({ 
        status: 'error', 
        connected: false,
        error: 'API_BASE_URL not configured',
        message: 'Backend API URL is not properly configured',
        forceFallback: true
      }, { status: 500 })
    }
    
    // Remove trailing slash if present
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1)
    }
    
    const fullUrl = `${apiUrl}/api/db-status`
    log(`Checking backend API status at ${fullUrl}`, {}, 'info')
    
    // Add a short timeout to avoid hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        log('Backend API returned error status', { status: response.status }, 'error')
        return NextResponse.json({
          status: 'error',
          connected: false,
          error: `Backend returned ${response.status}`,
          message: 'Failed to connect to backend API',
          forceFallback: true
        }, { status: response.status })
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      clearTimeout(timeoutId)
      
      log('Failed to connect to backend API', { error: String(error) }, 'error')
      return NextResponse.json({
        status: 'error',
        connected: false,
        error: String(error),
        message: 'Failed to connect to backend API',
        forceFallback: true
      }, { status: 500 })
    }
  } catch (error) {
    log('DB status handler error', { error: String(error) }, 'error')
    return NextResponse.json({
      status: 'error',
      connected: false,
      error: String(error),
      message: 'Failed to check database status'
    }, { status: 500 })
  }
}