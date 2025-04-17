// Basic script to analyze the cart-merge API endpoint
const fetch = require('node-fetch');

async function testCartEndpoint() {
  try {
    console.log('Testing cart API endpoint...');
    
    // Test data
    const testUserId = '123456789';
    const testItems = [
      {
        id: '12345',
        discogsReleaseId: '12345',
        title: 'Test Record 1',
        price: 19.99,
        quantity: 1,
        condition: 'VG+',
        weight: 180,
        images: ['https://example.com/image1.jpg'],
        cover_image: 'https://example.com/image1.jpg'
      },
      {
        id: '67890',
        discogsReleaseId: '67890',
        title: 'Test Record 2',
        price: 24.99,
        quantity: 2,
        condition: 'M',
        weight: 200,
        images: ['https://example.com/image2.jpg'],
        cover_image: 'https://example.com/image2.jpg'
      }
    ];
    
    // 1. Test saving cart items
    console.log('\n1. Testing saving cart items...');
    const saveResponse = await fetch('http://localhost:3000/api/cart-merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        guestCartItems: testItems,
        userId: testUserId,
        logoutSave: true // Force replace the entire cart
      })
    });
    
    console.log('Save response status:', saveResponse.status);
    if (saveResponse.ok) {
      const saveData = await saveResponse.json();
      console.log('Save response:', JSON.stringify(saveData, null, 2));
    } else {
      console.error('Error saving cart:', await saveResponse.text());
    }
    
    // 2. Test fetching cart items
    console.log('\n2. Testing fetching cart items...');
    const fetchResponse = await fetch(`http://localhost:3000/api/cart-merge?userId=${testUserId}&fetch=true`);
    
    console.log('Fetch response status:', fetchResponse.status);
    if (fetchResponse.ok) {
      const fetchData = await fetchResponse.json();
      console.log('Fetch response:', JSON.stringify(fetchData, null, 2));
    } else {
      console.error('Error fetching cart:', await fetchResponse.text());
    }
    
    console.log('\nAPI test complete!');
    
    console.log('\nTo test the complete user flow:');
    console.log('1. Ensure you are logged in with a test user');
    console.log('2. Use the browser\'s dev tools console to run the following commands:');
    console.log('   a. Add an item to cart:');
    console.log('      document.querySelector(".add-to-cart-button").click()');
    console.log('   b. Open the console network tab to observe the /api/cart-merge API call');
    console.log('3. Log out and back in to verify the cart items persist');
    
  } catch (error) {
    console.error('Error during API test:', error);
  }
}

testCartEndpoint();