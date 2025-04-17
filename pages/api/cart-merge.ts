import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { log } from '@/lib/logger'

/**
 * API route to merge guest cart with user cart after login
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session to verify user is authenticated
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Get the guest cart items from the request body
    const { guestCartItems } = req.body
    
    if (!guestCartItems || !Array.isArray(guestCartItems)) {
      return res.status(400).json({ error: 'Invalid guest cart data' })
    }
    
    if (guestCartItems.length === 0) {
      return res.status(200).json({ 
        message: 'No items to merge',
        merged: false 
      })
    }
    
    // Log the cart merging attempt
    log('Merging guest cart with user cart', {
      userId: session.user.id,
      itemCount: guestCartItems.length
    }, 'info')
    
    // Format items for the backend API
    const formattedItems = guestCartItems.map(item => ({
      discogsReleaseId: item.discogsReleaseId,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      weight: item.weight || 180,
      condition: item.condition,
      coverImage: item.coverImage
    }))
    
    // Forward to backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    if (!apiUrl) {
      return res.status(500).json({ error: 'Backend API URL not configured' })
    }
    
    const response = await fetch(`${apiUrl}/api/cart/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || ''
      },
      body: JSON.stringify({
        userId: session.user.id,
        guestCartItems: formattedItems,
        force: true,         // Force server to replace/save items even if user already has items
        preferGuest: true,   // Prefer guest cart items if there are conflicts
        saveForLater: true   // Ensure items are saved permanently
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      log('Error from backend during cart merge', { 
        statusCode: response.status,
        error: errorText 
      }, 'error')
      
      return res.status(response.status).json({ 
        error: 'Failed to merge cart with backend',
        details: errorText
      })
    }
    
    // Forward the response from the backend
    try {
      const data = await response.json()
      return res.status(200).json({
        ...data,
        merged: true,
        count: guestCartItems.length
      })
    } catch (error) {
      // If there's no valid JSON response but the request was successful
      return res.status(200).json({
        message: 'Cart merged successfully',
        merged: true,
        count: guestCartItems.length
      })
    }
  } catch (error) {
    log('Error in cart merge endpoint', { error }, 'error')
    return res.status(500).json({ error: 'Internal server error' })
  }
}