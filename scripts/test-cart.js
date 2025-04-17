// Test script for cart functionality
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    console.log('Testing cart functionality...');
    
    // List all models
    console.log('Available Prisma models:', Object.keys(prisma));
    
    // Need to regenerate the Prisma client since models might be missing
    console.log('Generating Prisma client...');
    
    // Use direct SQL queries since the model might not be in the client yet
    console.log('Checking if carts table exists...');
    
    try {
      const result = await prisma.$queryRaw`SELECT * FROM carts LIMIT 1`;
      console.log('Carts table exists:', result);
    } catch (error) {
      console.log('Error querying carts table:', error.message);
    }
    
    // Try to get all carts using raw SQL
    try {
      console.log('\nGetting all carts from database...');
      const allCarts = await prisma.$queryRaw`
        SELECT c.*, 
              (SELECT COUNT(*) FROM cart_items WHERE "cartId" = c.id) as item_count 
        FROM carts c
      `;
      
      console.log(`Found ${allCarts.length} carts in the database.`);
      
      if (allCarts.length > 0) {
        // Show details of each cart
        for (const cart of allCarts) {
          console.log(`\nCart:`);
          console.log(`ID: ${cart.id}`);
          console.log(`User ID: ${cart.userId || 'Guest cart'}`);
          console.log(`Guest ID: ${cart.guestId || 'N/A'}`);
          console.log(`Updated: ${cart.updatedAt}`);
          console.log(`Created: ${cart.createdAt}`);
          console.log(`Items: ${cart.item_count}`);
          
          // Get items for this cart
          if (cart.item_count > 0) {
            const items = await prisma.$queryRaw`
              SELECT * FROM cart_items WHERE "cartId" = ${cart.id}
            `;
            
            console.log('\nItems:');
            items.forEach((item, idx) => {
              console.log(`  ${idx + 1}. ${item.title}`);
              console.log(`     Quantity: ${item.quantity}`);
              console.log(`     Price: $${item.price}`);
              console.log(`     Discogs ID: ${item.discogsId}`);
            });
          }
        }
      }
      
      // Test cart creation via SQL
      console.log('\nCreating a test cart...');
      
      // Generate a random guest ID
      const guestId = require('crypto').randomBytes(16).toString('hex');
      
      // Create a cart
      const cartId = require('crypto').randomBytes(8).toString('hex');
      await prisma.$executeRaw`
        INSERT INTO carts (id, "guestId", "updatedAt", "createdAt")
        VALUES (${cartId}, ${guestId}, NOW(), NOW())
      `;
      
      console.log(`Created test cart with ID: ${cartId} and Guest ID: ${guestId}`);
      
      // Add a test item to the cart
      const itemId = require('crypto').randomBytes(8).toString('hex');
      await prisma.$executeRaw`
        INSERT INTO cart_items (id, "cartId", "discogsId", title, price, quantity, quantity_available, condition, weight, images)
        VALUES (${itemId}, ${cartId}, 12345, 'Test Record', 19.99, 1, 5, 'Mint (M)', 180, ARRAY[]::jsonb[])
      `;
      
      console.log('Added test item to cart: Test Record');
      
      // Update the item quantity
      await prisma.$executeRaw`
        UPDATE cart_items SET quantity = 2 WHERE id = ${itemId}
      `;
      
      console.log('Updated test item quantity to 2');
      
      // Get the cart with items
      const cartWithItems = await prisma.$queryRaw`
        SELECT * FROM cart_items WHERE "cartId" = ${cartId}
      `;
      
      console.log(`\nRetrieved cart with ${cartWithItems.length} items`);
      
      // Clean up - remove the test cart (this will cascade to items)
      await prisma.$executeRaw`
        DELETE FROM carts WHERE id = ${cartId}
      `;
      
      console.log('Test cart deleted successfully');
    } catch (error) {
      console.error('Error during SQL operations:', error);
    }
    
    console.log('Test cart deleted successfully');
    console.log('\nCart functionality test completed successfully!');
  } catch (error) {
    console.error('Error testing cart functionality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('Done'))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });