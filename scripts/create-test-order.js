// Script to create a test order and remove a Discogs listing
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = require('node-fetch');

async function createTestOrder() {
  try {
    if (!process.argv[2]) {
      console.error('Please provide a Discogs listing ID as argument');
      console.log('Usage: node create-test-order.js <discogs_listing_id>');
      process.exit(1);
    }
    
    const discogsId = process.argv[2];
    console.log(`Creating test order with Discogs listing ID: ${discogsId}`);
    
    // Get info about the listing from Discogs
    console.log('Fetching listing details from Discogs...');
    const listingInfo = await getListingInfo(discogsId);
    
    if (!listingInfo) {
      console.error('Could not retrieve listing information. Aborting.');
      process.exit(1);
    }
    
    // Get the user (assuming we only have one user for testing)
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('No user found in database. Please create a user first.');
      process.exit(1);
    }
    
    console.log(`Using user: ${user.email}`);
    
    // Create an order for this listing
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: 'paid',
        total: listingInfo.price.value,
        stripeId: `manual_test_${Date.now()}`,
        shippingAddress: {
          name: user.name || 'Test User',
          email: user.email,
          address: user.address || '123 Test St',
          city: user.city || 'Test City',
          state: user.state || 'TS',
          country: user.country || 'US',
          postalCode: user.postalCode || '12345',
        },
        items: {
          create: [{
            discogsId: discogsId,
            title: listingInfo.release.title || 'Test Record',
            price: listingInfo.price.value,
            quantity: 1,
            condition: listingInfo.condition || 'Mint (M)',
          }]
        }
      },
      include: { items: true }
    });
    
    console.log(`✅ Successfully created order: ${order.id}`);
    console.log('Order details:');
    console.log(`- Status: ${order.status}`);
    console.log(`- Total: $${order.total}`);
    console.log(`- Items: ${order.items.length}`);
    
    // Now attempt to remove the listing from Discogs
    console.log('\nAttempting to remove listing from Discogs inventory...');
    const deletionSuccess = await deleteDiscogsListing(discogsId);
    
    if (deletionSuccess) {
      console.log(`✅ Successfully removed listing ${discogsId} from Discogs inventory`);
    } else {
      console.error(`❌ Failed to remove listing ${discogsId} from Discogs inventory`);
    }
    
  } catch (error) {
    console.error('Error creating test order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function getListingInfo(listingId) {
  try {
    const url = `https://api.discogs.com/marketplace/listings/${listingId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Discogs token=${process.env.DISCOGS_API_TOKEN}`,
        'User-Agent': 'PlastikRecordStore/1.0',
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch listing: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching listing info:', error);
    return null;
  }
}

async function deleteDiscogsListing(listingId) {
  // Try all available methods to delete the listing
  
  // Method 1: Using Discogs API Token
  try {
    console.log('Method 1: Using API token for deletion...');
    
    const deleteResponse = await fetch(`https://api.discogs.com/marketplace/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Discogs token=${process.env.DISCOGS_API_TOKEN}`,
        'User-Agent': 'PlastikRecordStore/1.0',
      },
    });
    
    if (deleteResponse.ok || deleteResponse.status === 404) {
      console.log(`Method 1 succeeded (status: ${deleteResponse.status})`);
      return true;
    } else {
      const errorText = await deleteResponse.text();
      console.error(`Method 1 failed: ${deleteResponse.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error in Method 1:', error.message);
  }
  
  // Method 2: Using OAuth from seller account
  try {
    console.log('Method 2: Using OAuth authentication...');
    
    // Get auth from database
    const auth = await prisma.discogsAuth.findFirst({
      where: { username: process.env.DISCOGS_USERNAME },
      orderBy: { lastVerified: 'desc' }
    });
    
    if (auth) {
      console.log(`Found OAuth credentials for ${auth.username}`);
      
      // Import the required crypto and OAuth libraries
      const crypto = require('crypto');
      const OAuth = require('oauth-1.0a');
      
      // Create OAuth instance
      const oauth = new OAuth({
        consumer: {
          key: process.env.DISCOGS_CONSUMER_KEY,
          secret: process.env.DISCOGS_CONSUMER_SECRET,
        },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
          return crypto.createHmac('sha1', key).update(base_string).digest('base64');
        },
      });
      
      // Make signed request
      const requestData = {
        url: `https://api.discogs.com/marketplace/listings/${listingId}`,
        method: 'DELETE',
      };
      
      const headers = oauth.toHeader(
        oauth.authorize(requestData, {
          key: auth.accessToken,
          secret: auth.accessTokenSecret,
        }),
      );
      
      console.log('Sending OAuth-authenticated DELETE request...');
      
      const response = await fetch(requestData.url, {
        method: 'DELETE',
        headers: {
          ...headers,
          'User-Agent': 'PlastikRecordStore/1.0',
        },
      });
      
      if (response.ok || response.status === 404) {
        console.log(`Method 2 succeeded (status: ${response.status})`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Method 2 failed: ${response.status} - ${errorText}`);
      }
    } else {
      console.log('No OAuth credentials found in database');
    }
  } catch (error) {
    console.error('Error in Method 2:', error.message);
  }
  
  console.log('All deletion methods failed');
  return false;
}

createTestOrder();