/**
 * Cart Persistence Test Script
 * Run this in the browser console to test cart persistence functionality
 */

// 1. Monitor cart-related fetch requests
(function monitorCartRequests() {
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (url.includes('/api/cart-merge')) {
      console.log('%c🛒 Cart API Request:', 'color: #4CAF50; font-weight: bold', {
        url,
        method: options?.method || 'GET',
        body: options?.body ? JSON.parse(options.body) : null
      });
    }
    return originalFetch.apply(this, arguments)
      .then(response => {
        if (url.includes('/api/cart-merge')) {
          console.log('%c🛒 Cart API Response:', 'color: #2196F3; font-weight: bold', {
            url,
            status: response.status,
            ok: response.ok
          });
        }
        return response;
      })
      .catch(error => {
        if (url.includes('/api/cart-merge')) {
          console.error('%c🛒 Cart API Error:', 'color: #F44336; font-weight: bold', {
            url,
            error
          });
        }
        throw error;
      });
  };
  console.log('%c🛒 Cart API monitoring enabled', 'color: #4CAF50; font-weight: bold');
})();

// 2. Test function to add a random item to cart
function testAddToCart() {
  // Find React context in window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  const cartContext = window.__REACT_CONTEXT_DEVTOOL_GLOBAL_HOOK__?.renderers
    ?.find(r => r?._debugInfo?.rendererPackageName === 'react')
    ?._debugInfo?.cartContext;
  
  if (!cartContext) {
    console.error('Cart context not found. Make sure you run this on a page with the cart available.');
    console.log('Trying to use the Add to Cart button instead...');
    
    // Try to find and click an Add to Cart button
    const addToCartButton = document.querySelector('button[aria-label="Add to cart"]') || 
                            document.querySelector('button:contains("Add to Cart")') ||
                            document.querySelector('button.add-to-cart');
    
    if (addToCartButton) {
      console.log('Found Add to Cart button, clicking it...');
      addToCartButton.click();
      return true;
    } else {
      console.error('Add to Cart button not found. Navigate to a product page first.');
      return false;
    }
  }
  
  // Create a test record
  const testRecord = {
    id: Date.now().toString(),
    discogsReleaseId: Date.now().toString(),
    title: `Test Record ${Math.floor(Math.random() * 100)}`,
    price: Math.floor(Math.random() * 50) + 10,
    condition: 'VG+',
    weight: 180,
    images: ['https://example.com/test-image.jpg'],
    cover_image: 'https://example.com/test-image.jpg'
  };
  
  console.log('%c🛒 Adding test item to cart', 'color: #9C27B0; font-weight: bold', testRecord);
  cartContext.addToCart(testRecord);
  return true;
}

// 3. Test function to log user status and cart contents
function testLogStatus() {
  // Try to access session data from window
  const session = window.__NEXT_DATA__?.props?.pageProps?.session;
  
  console.log('%c🛒 User Status:', 'color: #FF9800; font-weight: bold', {
    isLoggedIn: session ? true : false,
    userId: session?.user?.id,
    userName: session?.user?.name || session?.user?.email
  });
  
  // Get cart items from localStorage
  try {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      const cart = JSON.parse(cartData);
      console.log('%c🛒 Cart Contents:', 'color: #FF9800; font-weight: bold', {
        itemCount: cart.items.length,
        items: cart.items
      });
    } else {
      console.log('%c🛒 Cart is empty or not found in localStorage', 'color: #FF9800; font-weight: bold');
    }
  } catch (error) {
    console.error('Error reading cart from localStorage', error);
  }
  
  return true;
}

// 4. Run all tests
function runCartTests() {
  console.log('%c🧪 Starting Cart Persistence Tests', 'color: #673AB7; font-weight: bold; font-size: 16px');
  
  testLogStatus();
  
  console.log('%c🧪 Tests Complete', 'color: #673AB7; font-weight: bold; font-size: 16px');
  console.log('To manually test cart persistence:');
  console.log('1. Use testAddToCart() to add an item');
  console.log('2. Check the network tab for POST to /api/cart-merge');
  console.log('3. Log out and log back in');
  console.log('4. Use testLogStatus() to check if items persisted');
}

// Display test instructions
console.log('%c🛒 Cart Persistence Test Script Loaded', 'color: #673AB7; font-weight: bold; font-size: 18px');
console.log('Available test functions:');
console.log('- testAddToCart() - Adds a test item to the cart');
console.log('- testLogStatus() - Logs user session and cart status');
console.log('- runCartTests() - Runs basic tests and shows instructions');
console.log('\nRun runCartTests() to get started');

// Run tests automatically
runCartTests();