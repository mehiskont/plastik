import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    log('Direct login endpoint called', {}, 'info')
    
    // Get request body
    let body;
    try {
      body = await request.json()
    } catch (error) {
      log('Failed to parse login request body', { error: String(error) }, 'error')
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    // Check credentials
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }
    
    // Check for test accounts in standalone mode
    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com"
    const testPassword = process.env.TEST_USER_PASSWORD || "password123"
    const adminEmail = process.env.ADMIN_USER_EMAIL || "admin@example.com"
    const adminPassword = process.env.ADMIN_USER_PASSWORD || "admin123"
    
    // Test account validation
    if (email === testEmail && password === testPassword) {
      log('Test user login successful', { email }, 'info')
      return NextResponse.json({
        success: true,
        user: {
          id: "test-user-id-123",
          name: "Test User",
          email: testEmail
        }
      })
    }
    
    if (email === adminEmail && password === adminPassword) {
      log('Admin user login successful', { email }, 'info')
      return NextResponse.json({
        success: true,
        user: {
          id: "admin-user-id-456",
          name: "Admin User",
          email: adminEmail,
          role: "admin"
        }
      })
    }
    
    // If we reached here, credentials did not match
    log('Login failed - invalid credentials', { email }, 'warn')
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  } catch (error) {
    log('Login endpoint error', { error: String(error) }, 'error')
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}