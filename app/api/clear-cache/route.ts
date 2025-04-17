import { NextResponse } from 'next/server'
import { clearCachedData } from '@/lib/redis'

export async function POST(request: Request) {
  try {
    // Clear all cache or specific patterns
    const body = await request.json()
    const pattern = body.pattern || 'release:*' // Default to clearing release cache only
    
    const clearedKeysCount = await clearCachedData(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedKeysCount} cache entries matching pattern: ${pattern}`
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}