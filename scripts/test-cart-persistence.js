// Script to test cart persistence functionality
const { PrismaClient } = require('@prisma/client');

// Import environment variables
require('dotenv').config();

// Check if we have a database URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set!');
  console.log('Using the prisma instance from lib/prisma.ts instead');
  // Try to use the prisma instance from the application
  const { prisma } = require('../lib/prisma');
} else {
  console.log('Using DATABASE_URL from environment');
}

const prisma = new PrismaClient();

async function testCartPersistence() {
  try {
    console.log('-----------------------------------------------------');
    console.log('CART PERSISTENCE TEST');
    console.log('-----------------------------------------------------');
    
    // 1. Find a test user or create one if needed
    console.log('Finding test user...');
    let testUser = await prisma.user.findFirst({
      where: {
        email: 'test@example.com'
      }
    });
    
    if (!testUser) {
      console.log('Creating test user...');
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        }
      });
      console.log('Test user created:', testUser.id);
    } else {
      console.log('Using existing test user:', testUser.id);
    }
    
    // 2. Check if user already has a cart
    console.log('\nChecking existing cart...');
    let userCart = await prisma.cart.findUnique({
      where: { userId: testUser.id },
      include: { items: true }
    });
    
    if (userCart) {
      console.log(`Found existing cart with ${userCart.items.length} items`);
      
      // Print current cart items
      if (userCart.items.length > 0) {
        console.log('\nCurrent cart items:');
        userCart.items.forEach(item => {
          console.log(`- ${item.title} (${item.quantity}x) - $${item.price}`);
        });
      }
    } else {
      console.log('No existing cart found for user');
    }
    
    // 3. Create a cart with test items
    console.log('\nCreating/updating test cart...');
    
    // Delete existing cart if it exists
    if (userCart) {
      console.log('Deleting existing cart items...');
      await prisma.cartItem.deleteMany({
        where: { cartId: userCart.id }
      });
    } else {
      console.log('Creating new cart for user...');
      userCart = await prisma.cart.create({
        data: { userId: testUser.id }
      });
    }
    
    // Add test items to cart
    console.log('Adding test items to cart...');
    const testItems = [
      {
        discogsId: BigInt('12345'),
        title: 'Test Record 1',
        price: 19.99,
        quantity: 1,
        quantity_available: 1,
        condition: 'VG+',
        weight: 180,
        images: ['https://example.com/image1.jpg']
      },
      {
        discogsId: BigInt('67890'),
        title: 'Test Record 2',
        price: 24.99,
        quantity: 2,
        quantity_available: 3,
        condition: 'M',
        weight: 200,
        images: ['https://example.com/image2.jpg']
      }
    ];
    
    for (const item of testItems) {
      await prisma.cartItem.create({
        data: {
          ...item,
          cartId: userCart.id
        }
      });
    }
    
    // 4. Verify items were added
    console.log('\nVerifying cart items were saved...');
    const updatedCart = await prisma.cart.findUnique({
      where: { userId: testUser.id },
      include: { items: true }
    });
    
    if (updatedCart && updatedCart.items.length > 0) {
      console.log(`Cart now has ${updatedCart.items.length} items:`);
      updatedCart.items.forEach(item => {
        console.log(`- ${item.title} (${item.quantity}x) - $${item.price}`);
      });
      console.log('\nCart persistence test successful!');
    } else {
      console.log('Failed to add items to cart!');
    }
    
    console.log('\nTo test the full flow:');
    console.log('1. Log in with the test user (test@example.com)');
    console.log('2. Verify the cart loads with these test items');
    console.log('3. Add/remove items and check browser console for database sync');
    console.log('4. Log out and back in to verify persistence');
    
    console.log('\n-----------------------------------------------------');
    
  } catch (error) {
    console.error('Error during cart persistence test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCartPersistence();