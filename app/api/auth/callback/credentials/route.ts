import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    log('Processing credentials login request', {}, 'info')
    
    // Get the request body
    let body;
    let contentType = request.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Handle form data
        const formData = await request.formData();
        body = Object.fromEntries(formData);
      } else {
        // Try to parse as URL encoded (fallback)
        const text = await request.text();
        const urlParams = new URLSearchParams(text);
        body = {};
        for (const [key, value] of urlParams.entries()) {
          body[key] = value;
        }
      }
      
      log('Received login request', { 
        contentType,
        hasEmail: !!body.email 
      }, 'info')
    } catch (error) {
      log('Failed to parse request body', { 
        error: String(error),
        contentType
      }, 'error')
      return NextResponse.json({ error: 'InvalidRequest' }, { status: 400 })
    }
    
    // Make sure we have a properly formatted URL
    let apiUrl = process.env.API_BASE_URL
    if (!apiUrl) {
      log('API_BASE_URL not configured', {}, 'error')
      return NextResponse.json({ error: 'ServerConfigurationError' }, { status: 500 })
    }
    
    // Remove trailing slash if present
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1)
    }
    
    const fullUrl = `${apiUrl}/api/auth/login`
    
    log(`Forwarding credentials to ${fullUrl}`, { 
      email: body.email,
      contentType
    }, 'info')
    
    // Forward the request to the backend API
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password
        })
      })

      // Get the response data
      let responseText = '';
      try {
        responseText = await response.text();
        log('Received API response', { 
          status: response.status, 
          textLength: responseText.length 
        }, 'info');
      } catch (error) {
        log('Failed to read response text', { error: String(error) }, 'error')
        return NextResponse.json({ error: 'CredentialsSignin' }, { status: 401 })
      }

      // Try to parse JSON response if available
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        log('Failed to parse JSON response', { 
          error: String(error), 
          responseText: responseText.substring(0, 100) + '...' 
        }, 'error')
        responseData = { error: 'InvalidResponse' };
      }

      if (response.ok) {
        log('Login successful via API', { email: body.email }, 'info')
        
        // Create the response with our standard format
        const userData = {
          user: {
            id: responseData.id || responseData.user?.id || `user-${Date.now()}`,
            name: responseData.name || responseData.user?.name || body.email.split('@')[0],
            email: responseData.email || responseData.user?.email || body.email,
          }
        };
        
        const nextResponse = NextResponse.json(userData)

        // Forward cookies from backend to browser
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() === 'set-cookie') {
            nextResponse.headers.set(key, value)
          }
        })

        return nextResponse
      } else {
        log('Login failed via API', { 
          status: response.status, 
          email: body.email,
          errorMessage: responseData.error || responseData.message || 'Unknown error' 
        }, 'warn')
        
        // Check for specific error messages
        const errorMsg = responseData.error || responseData.message || '';
        if (errorMsg.toLowerCase().includes('invalid') || response.status === 401) {
          return NextResponse.json(
            { error: 'CredentialsSignin' },
            { status: 401 }
          )
        } else {
          return NextResponse.json(
            { error: 'ServerError', message: errorMsg },
            { status: response.status || 500 }
          )
        }
      }
    } catch (error) {
      log('API request failed', { error: String(error), url: fullUrl }, 'error')
      return NextResponse.json({ error: 'ServerError' }, { status: 500 })
    }
  } catch (error) {
    log('Credentials proxy handler error', { error: String(error) }, 'error')
    return NextResponse.json({ error: 'ServerError' }, { status: 500 })
  }
}