import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

/**
 * API route to handle cart operations:
 * - Merge guest cart with user cart after login
 * - Save cart items when user logs out
 * - Fetch saved cart items when user logs in
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET requests for fetching cart items
  if (req.method === 'GET') {
    try {
      // Get session to verify user is authenticated
      const session = await getServerSession(req, res, authOptions)
      const userId = session?.user?.id || req.query.userId as string
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - user ID required' })
      }

      log('Attempting to fetch saved cart items from database', { userId }, 'info')
      
      // Try to get items directly from our database first
      try {
        // Find user's cart with items
        const userCart = await prisma.cart.findUnique({
          where: { userId },
          include: { items: true }
        })

        if (userCart && userCart.items.length > 0) {
          // Format items to match the expected client-side format
          const items = userCart.items.map(item => ({
            id: item.discogsId.toString(),
            discogsReleaseId: item.discogsId.toString(),
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            condition: item.condition || 'VG+',
            weight: item.weight || 180,
            images: item.images || [],
            cover_image: Array.isArray(item.images) && item.images.length > 0 ? 
              (typeof item.images[0] === 'string' ? 
                item.images[0] : 
                item.images[0]?.uri || item.images[0]?.resource_url || item.images[0]?.url) 
              : undefined
          }))

          log('Found saved cart items in database', { 
            userId,
            itemCount: items.length 
          }, 'info')

          return res.status(200).json({
            items,
            count: items.length,
            source: 'database'
          })
        } else {
          log('No saved cart items found in database', { userId }, 'info')
        }
      } catch (dbError) {
        log('Error fetching cart from database', { error: dbError }, 'error')
      }

      // If no items in database, try the backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || ''
      if (!apiUrl) {
        return res.status(200).json({ items: [], count: 0 })
      }

      try {
        const fetchEndpoint = `${apiUrl}/api/cart/fetch`
        log(`Trying to fetch cart from backend API: ${fetchEndpoint}`, { userId }, 'info')
        
        const response = await fetch(fetchEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.cookie || '',
            'Authorization': req.headers.authorization || `Bearer ${userId}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            log('Successfully fetched cart items from backend API', { 
              itemCount: data.items.length 
            }, 'info')
            
            return res.status(200).json({
              items: data.items,
              count: data.items.length,
              source: 'api'
            })
          }
        }
      } catch (apiError) {
        log('Error fetching cart from backend API', { error: apiError }, 'error')
      }

      // If no items found anywhere
      return res.status(200).json({ items: [], count: 0 })
    } catch (error) {
      log('Error in cart fetch endpoint', { error }, 'error')
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
  
  // Handle POST requests for merging/saving cart
  if (req.method === 'POST') {
    try {
      // Get session to verify user is authenticated
      const session = await getServerSession(req, res, authOptions)
      
      // For logout saves, we can use the user ID from the request body as fallback
      const { guestCartItems, logoutSave, userId: bodyUserId } = req.body
      const userId = session?.user?.id || (logoutSave ? bodyUserId : null)
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - no valid user ID' })
      }
      
      if (!guestCartItems || !Array.isArray(guestCartItems)) {
        return res.status(400).json({ error: 'Invalid guest cart data' })
      }
      
      if (guestCartItems.length === 0) {
        return res.status(200).json({ 
          message: 'No items to merge',
          merged: false 
        })
      }
      
      // Log the cart operation
      const operationType = logoutSave ? 'pre-logout save' : 'login merge'
      log(`Processing cart ${operationType}`, {
        userId,
        itemCount: guestCartItems.length
      }, 'info')
      
      // Format items for consistency
      const formattedItems = guestCartItems.map(item => ({
        discogsReleaseId: item.discogsReleaseId || item.id,
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        weight: item.weight || 180,
        condition: item.condition || 'VG+',
        coverImage: item.coverImage || item.cover_image,
        images: item.images || (item.cover_image ? [item.cover_image] : [])
      }))
      
      // Try to save directly to our database first
      try {
        // Find existing cart or create a new one
        let userCart = await prisma.cart.findUnique({
          where: { userId },
        })

        if (!userCart) {
          userCart = await prisma.cart.create({
            data: { userId }
          })
          log('Created new cart for user', { userId, cartId: userCart.id }, 'info')
        }

        // Clear existing items if requested to force replace them
        if (logoutSave) {
          await prisma.cartItem.deleteMany({
            where: { cartId: userCart.id }
          })
          log('Cleared existing cart items for logout save', { userId }, 'info')
        }

        // Add all items to the cart
        const savedItems = await Promise.all(formattedItems.map(async (item) => {
          try {
            // Convert ID to BigInt for database compatibility
            const discogsId = BigInt(item.id || item.discogsReleaseId)
            
            // Prepare images for database
            let itemImages = []
            if (item.coverImage) {
              itemImages = [item.coverImage]
            } else if (Array.isArray(item.images) && item.images.length > 0) {
              itemImages = item.images
            }

            // Create the cart item
            return await prisma.cartItem.create({
              data: {
                cartId: userCart.id,
                discogsId,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                quantity_available: 1,
                condition: item.condition,
                weight: item.weight,
                images: itemImages
              }
            })
          } catch (itemError) {
            log('Error saving individual cart item', {
              error: itemError,
              item: {
                id: item.id,
                title: item.title
              }
            }, 'error')
            return null
          }
        }))

        // Filter out failed items
        const successfulItems = savedItems.filter(Boolean)
        
        if (successfulItems.length > 0) {
          log('Successfully saved cart items to database', {
            userId,
            savedCount: successfulItems.length,
            totalItems: formattedItems.length
          }, 'info')
          
          // If we succeeded with the database save, return success
          return res.status(200).json({
            message: `Cart ${operationType} completed successfully`,
            merged: true,
            saved: true,
            count: successfulItems.length,
            source: 'database'
          })
        }
      } catch (dbError) {
        log('Database error while saving cart', { error: dbError }, 'error')
      }
      
      // If database save failed or was incomplete, try the backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || ''
      if (!apiUrl) {
        return res.status(500).json({ error: 'Backend API URL not configured' })
      }
      
      // Use proper API URL - use /cart/persist instead of /cart/merge if available
      const mergeEndpoint = `${apiUrl}/api/cart/persist`
      log(`Using backend API cart persist endpoint: ${mergeEndpoint}`, {
        itemCount: formattedItems.length
      }, 'info')
      
      const response = await fetch(mergeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.cookie || '',
          'Authorization': req.headers.authorization || `Bearer ${userId}`
        },
        body: JSON.stringify({
          userId,
          guestCartItems: formattedItems,
          force: true,         // Force server to replace/save items even if user already has items
          preferGuest: true,   // Prefer guest cart items if there are conflicts
          saveForLater: true,  // Ensure items are saved permanently
          persist: true,       // Explicitly request persistence across sessions
          preventExpiry: true  // Prevent the cart from expiring
        })
      })
      
      if (!response.ok) {
        // Try fallback endpoint if the persist endpoint fails
        if (response.status === 404) {
          log('Persist endpoint not found, trying merge endpoint', {}, 'warn')
          
          const fallbackResponse = await fetch(`${apiUrl}/api/cart/merge`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': req.headers.cookie || '',
              'Authorization': req.headers.authorization || `Bearer ${userId}`
            },
            body: JSON.stringify({
              userId,
              guestCartItems: formattedItems,
              force: true,
              preferGuest: true,
              saveForLater: true
            })
          })
          
          if (fallbackResponse.ok) {
            // Fallback succeeded
            const data = await fallbackResponse.json().catch(() => ({}))
            return res.status(200).json({
              ...data,
              merged: true,
              count: guestCartItems.length,
              usedFallback: true,
              source: 'api'
            })
          }
          
          // If fallback also fails, continue with original error
        }
        
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
          count: guestCartItems.length,
          source: 'api'
        })
      } catch (error) {
        // If there's no valid JSON response but the request was successful
        return res.status(200).json({
          message: 'Cart merged successfully',
          merged: true,
          count: guestCartItems.length,
          source: 'api'
        })
      }
    } catch (error) {
      log('Error in cart merge endpoint', { error }, 'error')
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
  
  // Handle other HTTP methods
  return res.status(405).json({ error: 'Method not allowed' })
}