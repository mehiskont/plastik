// Debug script to check orders and user session issues
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugOrdersAndUser() {
  try {
    console.log('Debugging orders and user session issues...');
    
    // Check all orders
    const allOrders = await prisma.order.findMany();
    console.log(`Found ${allOrders.length} total orders in database`);
    
    // Check users
    const allUsers = await prisma.user.findMany();
    console.log(`Found ${allUsers.length} users in database`);
    
    if (allUsers.length > 0) {
      // Display user details for debugging
      for (const user of allUsers) {
        console.log('\nUser details:');
        console.log(`- ID: ${user.id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Name: ${user.name}`);
        
        // Check orders for this user
        const userOrders = await prisma.order.findMany({
          where: { userId: user.id },
          include: { items: true }
        });
        
        console.log(`- Orders: ${userOrders.length}`);
        
        if (userOrders.length > 0) {
          console.log('\nOrder details:');
          for (const order of userOrders) {
            console.log(`  Order ID: ${order.id}`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Total: ${order.total}`);
            console.log(`  Created: ${order.createdAt}`);
            console.log(`  Items: ${order.items.length}`);
            console.log('  ---');
          }
        }
        
        // Check auth sessions
        const sessions = await prisma.session.findMany({
          where: { userId: user.id }
        });
        
        console.log(`- Active sessions: ${sessions.length}`);
        if (sessions.length > 0) {
          for (const session of sessions) {
            console.log(`  - Session expires: ${session.expires}`);
            const isExpired = new Date(session.expires) < new Date();
            console.log(`  - Is expired: ${isExpired}`);
          }
        }
      }
    }
    
    // Check for orphaned orders (no user)
    const orphanedOrders = await prisma.order.findMany({
      where: { userId: null },
      include: { items: true }
    });
    
    console.log(`\nFound ${orphanedOrders.length} orders without a user ID`);
    
    if (orphanedOrders.length > 0) {
      console.log('\nOrphaned orders:');
      for (const order of orphanedOrders) {
        console.log(`  Order ID: ${order.id}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  StripeId: ${order.stripeId}`);
        console.log(`  Created: ${order.createdAt}`);
        console.log(`  Items: ${order.items.length}`);
        
        // Show shipping address for contact info
        try {
          const shipping = typeof order.shippingAddress === 'string' 
            ? JSON.parse(order.shippingAddress)
            : order.shippingAddress;
            
          console.log(`  Shipping name: ${shipping.name || 'N/A'}`);
          console.log(`  Shipping email: ${shipping.email || 'N/A'}`);
        } catch (e) {
          console.log(`  Unable to parse shipping address: ${e.message}`);
        }
        console.log('  ---');
      }
      
      // Fix orphaned orders if they have an email that matches a user
      console.log('\nAttempting to fix orphaned orders...');
      let fixedCount = 0;
      
      for (const order of orphanedOrders) {
        try {
          // Extract email from shipping address
          const shipping = typeof order.shippingAddress === 'string'
            ? JSON.parse(order.shippingAddress)
            : order.shippingAddress;
            
          const email = shipping.email;
          
          if (email) {
            // Find user with this email
            const user = await prisma.user.findUnique({
              where: { email }
            });
            
            if (user) {
              // Update order with user ID
              await prisma.order.update({
                where: { id: order.id },
                data: { userId: user.id }
              });
              
              console.log(`✅ Fixed order ${order.id} - assigned to user ${user.id} (${user.email})`);
              fixedCount++;
            } else {
              console.log(`❌ No user found for email ${email} from order ${order.id}`);
            }
          } else {
            console.log(`❌ No email found in shipping address for order ${order.id}`);
          }
        } catch (error) {
          console.error(`Error fixing order ${order.id}:`, error);
        }
      }
      
      console.log(`\nFixed ${fixedCount} out of ${orphanedOrders.length} orphaned orders`);
    }
    
  } catch (error) {
    console.error('Error debugging orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check for orders in a specific timeframe
async function findRecentOrders() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: yesterday
        }
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\nFound ${recentOrders.length} orders in the last 24 hours`);
    
    if (recentOrders.length > 0) {
      for (const order of recentOrders) {
        console.log(`\nOrder ID: ${order.id}`);
        console.log(`Status: ${order.status}`);
        console.log(`StripeId: ${order.stripeId}`);
        console.log(`Created: ${order.createdAt}`);
        console.log(`UserId: ${order.userId || 'None'}`);
        
        // Show items
        console.log('Items:');
        for (const item of order.items) {
          console.log(`- ${item.title} (ID: ${item.discogsId})`);
          console.log(`  Quantity: ${item.quantity}, Price: $${item.price}`);
        }
      }
    } else {
      console.log('No recent orders found');
    }
  } catch (error) {
    console.error('Error finding recent orders:', error);
  }
}

async function main() {
  await debugOrdersAndUser();
  await findRecentOrders();
}

main();