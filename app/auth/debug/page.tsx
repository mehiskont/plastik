"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"

export default function AuthDebugPage() {
  const { data: session, status } = useSession()
  const [authConfig, setAuthConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAuthConfig = async () => {
      try {
        const res = await fetch('/api/auth/test')
        const data = await res.json()
        setAuthConfig(data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      }
    }

    fetchAuthConfig()
  }, [])

  const handleTestLogin = async (provider) => {
    try {
      await signIn(provider, { 
        callbackUrl: '/auth/debug',
        redirect: false
      })
    } catch (err) {
      console.error(`Error signing in with ${provider}:`, err)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="mb-8 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Session Status</h2>
        <p className="mb-2"><strong>Status:</strong> {status}</p>
        {session ? (
          <div>
            <p><strong>User:</strong> {session.user?.name || 'No name'}</p>
            <p><strong>Email:</strong> {session.user?.email || 'No email'}</p>
            <p><strong>ID:</strong> {session.user?.id || 'No ID'}</p>
            <p><strong>Expires:</strong> {session.expires || 'Unknown'}</p>
          </div>
        ) : (
          <p>No active session</p>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
        <div className="flex space-x-4">
          <button 
            onClick={() => handleTestLogin('credentials')} 
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Test Credentials Login
          </button>
          <button 
            onClick={() => handleTestLogin('google')} 
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Test Google Login
          </button>
        </div>
      </div>

      <div className="mb-8 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Auth Configuration</h2>
        {loading ? (
          <p>Loading configuration...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(authConfig, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}