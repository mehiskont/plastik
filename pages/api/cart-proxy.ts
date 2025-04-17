import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path if needed
import { log } from '@/lib/logger'; // Adjust path if needed

// Define your external API base URL securely
// Ensure API_BASE_URL is set in your .env file
const EXTERNAL_API_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

// Helper to safely get the base URL
function getExternalApiUrl(): string {
  const apiUrl = EXTERNAL_API_URL;
  if (!apiUrl) {
    log('External API URL (API_BASE_URL or NEXT_PUBLIC_API_URL) not configured in environment variables.', {}, 'error');
    throw new Error('API configuration error: URL not found.');
  }
  // Remove trailing slash if present
  return apiUrl.replace(/\/$/, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let apiUrlBase = '';
  try {
    apiUrlBase = getExternalApiUrl();
  } catch (error: any) {     
    return res.status(500).json({ error: error.message });
  }

  const session = await getServerSession(req, res, authOptions);
  // Note: Depending on your external API auth, you might need userId, accessToken, or just the session cookie
  const userId = session?.user?.id;
  const accessToken = session?.accessToken; // If you store access token in session

  // Use query parameter 'target' to determine the actual API endpoint
  const target = req.query.target as string;

  if (!target) {
    return res.status(400).json({ error: 'Missing target parameter for proxy' });
  }

  let externalEndpoint = '';
  let requiresAuth = true; // Assume auth is needed by default

  // --- Map frontend request target to external API endpoint --- 
  if (req.method === 'GET' && target === 'cart') {
    externalEndpoint = `${apiUrlBase}/api/cart`; // Fetch user cart
  } else if (req.method === 'POST' && target === 'cart/items') {
    externalEndpoint = `${apiUrlBase}/api/cart/items`; // Add item
  } else if (req.method === 'DELETE' && target.startsWith('cart/items/')) {
    const itemId = target.split('/').pop();
    externalEndpoint = `${apiUrlBase}/api/cart/items/${itemId}`; // Delete item
  } else if (req.method === 'PATCH' && target.startsWith('cart/items/')) {
    const itemId = target.split('/').pop();
    externalEndpoint = `${apiUrlBase}/api/cart/items/${itemId}`; // Update item quantity
  } else if (req.method === 'POST' && target === 'cart/merge') {
    externalEndpoint = `${apiUrlBase}/api/cart/merge`; // Merge guest cart
  }
  // --- Add more mappings if your API has other cart-related endpoints --- 
  else {
    log('Invalid cart operation requested for proxy', { method: req.method, target }, 'warn');
    return res.status(400).json({ error: 'Invalid cart operation requested' });
  }

  // Check authentication if required by the target endpoint
  if (requiresAuth && !session) {
    log('Unauthorized attempt to access protected cart endpoint', { target }, 'warn');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Prepare headers to forward
    const forwardedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      // Add Accept if needed
      // 'Accept': 'application/json',
    };

    // --- Authentication Header Forwarding --- 
    // Choose ONE of the following based on your external API's auth method:
    
    // Option 1: Forwarding NextAuth session cookie (if API uses the same session)
    if (req.headers.cookie) {
        // Be specific about the cookie name if possible, e.g., 'connect.sid'
        // forwardedHeaders['Cookie'] = req.headers.cookie; 
        const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'connect.sid'; // Or your specific cookie name
        const sessionCookie = req.cookies[sessionCookieName];
        if (sessionCookie) {
             forwardedHeaders['Cookie'] = `${sessionCookieName}=${sessionCookie}`;
        } else {
            log('Session cookie not found in request to proxy', { cookieName: sessionCookieName }, 'warn');
            // Decide if this is an error or just proceed without cookie
        }
    }

    // Option 2: Forwarding an Authorization Bearer token (if API uses JWT)
    // if (accessToken) {
    //   forwardedHeaders['Authorization'] = `Bearer ${accessToken}`;
    // } else if (requiresAuth) {
    //   log('Access token missing for authenticated request', { userId }, 'warn');
    //   // Handle missing token based on your auth strategy
    // }

    // Option 3: Forwarding an API Key (if API uses API keys)
    // const apiKey = process.env.EXTERNAL_API_KEY;
    // if (apiKey) {
    //   forwardedHeaders['X-API-Key'] = apiKey; // Or your specific API key header
    // } else if (requiresAuth) {
    //   log('External API key not configured', {}, 'error');
    //   return res.status(500).json({ error: 'API configuration error' });
    // }
    // --- End Authentication Header Forwarding --- 


    log(`Proxying ${req.method} request to ${externalEndpoint}`, { userId: userId || 'guest' }, 'info');

    const apiResponse = await fetch(externalEndpoint, {
      method: req.method,
      headers: forwardedHeaders,
      // Only include body for relevant methods
      body: (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') ? JSON.stringify(req.body) : undefined,
      // Consider adding timeout? signal: AbortSignal.timeout(10000) // 10 seconds timeout
    });

    // Forward the status code from the external API
    res.status(apiResponse.status);

    // Forward the response body from the external API
    // Check Content-Type before assuming JSON
    const contentType = apiResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await apiResponse.json();
      return res.json(jsonData);
    } else {
      const textData = await apiResponse.text();
      return res.send(textData);
    }

  } catch (error: any) {
    log('Error proxying request to external API', { 
        error: error.message,
        endpoint: externalEndpoint,
        method: req.method
    }, 'error');
    // Avoid sending detailed internal errors to the client
    return res.status(502).json({ error: 'Bad Gateway: Failed to communicate with cart service' }); 
  }
} 