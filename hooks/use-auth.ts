'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Custom hook for authentication that works with both NextAuth and our direct login
 */
export function useAuth() {
  const { data: session, status: nextAuthStatus } = useSession()
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    // First check NextAuth session
    if (nextAuthStatus === 'authenticated' && session?.user) {
      setUser(session.user)
      setStatus('authenticated')
      return
    }
    
    // Then check localStorage for direct login data
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('auth-token')
        const storedUser = localStorage.getItem('user')
        
        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          setStatus('authenticated')
          return
        }
      } catch (error) {
        console.error('Error reading auth data from localStorage:', error)
      }
    }
    
    // If NextAuth status is still loading, keep loading
    if (nextAuthStatus === 'loading') {
      setStatus('loading')
      return
    }
    
    // Otherwise, the user is not authenticated
    setStatus('unauthenticated')
  }, [session, nextAuthStatus])

  // Function to log out of both auth systems
  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('user')
    }
    
    // Clear cookies by setting an expired auth-token cookie
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    
    // Force reload to clear everything
    window.location.href = '/auth/direct-login'
  }

  return { user, token, status, logout }
}