// Script to check orders for a specific user by email
const { PrismaClient } = require('@prisma/client');

// Create client with direct database URL to avoid env file issues
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://mehiskont:@localhost:5432/postgres?schema=public"
    }
  }
});

async function checkUserOrders() {
  try {
    // First, list all users to find the right one
    console.log("===== CURRENT USERS =====");
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    users.forEach(user => {
      console.log(`${user.email} (${user.id.substring(0, 8)}...): ${user.name || 'No name'}`);
    });
    
    console.log("\n===== CHECKING ORDERS BY EMAIL =====");
    
    // Now check for a specific user's orders
    const email = 'mehiskont+matt@gmail.com'; // Replace with target email
    
    const targetUser = await prisma.user.findUnique({
      where: { email },
      include: { orders: true }
    });
    
    if (!targetUser) {
      console.log(`No user found with email ${email}`);
      return;
    }
    
    console.log(`Found user: ${targetUser.name || 'No name'} (${targetUser.id})`);
    console.log(`User has ${targetUser.orders.length} orders`);
    
    if (targetUser.orders.length === 0) {
      console.log('No orders found for this user.');
      
      // Check if there are any orders with this email in shipping address
      const allOrders = await prisma.order.findMany();
      
      const matchingOrders = allOrders.filter(order => {
        try {
          const address = order.shippingAddress;
          return address && 
                 (address.email === email || 
                  address.shipping_email === email || 
                  address.billing_email === email);
        } catch (e) {
          return false;
        }
      });
      
      if (matchingOrders.length > 0) {
        console.log(`Found ${matchingOrders.length} orders with this email in shipping details`);
        
        matchingOrders.forEach((order, i) => {
          console.log(`\nOrder ${i+1}:`);
          console.log(` - ID: ${order.id}`);
          console.log(` - Status: ${order.status}`);
          console.log(` - Total: ${order.total}`);
          console.log(` - Created: ${order.createdAt}`);
          console.log(` - User ID: ${order.userId || 'None'}`);
          console.log(` - Stripe ID: ${order.stripeId || 'None'}`);
        });
        
        // Fix these orders by linking them to the user
        console.log('\nLinking orders to the user...');
        
        for (const order of matchingOrders) {
          if (!order.userId || order.userId !== targetUser.id) {
            await prisma.order.update({
              where: { id: order.id },
              data: { userId: targetUser.id }
            });
            console.log(`Linked order ${order.id} to user ${targetUser.id}`);
          }
        }
      } else {
        console.log('No orders found with this email in shipping addresses either.');
      }
    } else {
      // Display the user's orders
      console.log("\n===== USER ORDERS =====");
      
      for (const order of targetUser.orders) {
        console.log(`\nOrder ID: ${order.id}`);
        console.log(`Status: ${order.status}`);
        console.log(`Total: ${order.total}`);
        console.log(`Created: ${order.createdAt}`);
        console.log(`Stripe ID: ${order.stripeId || 'None'}`);
        
        // Get items for this order
        const items = await prisma.orderItem.findMany({
          where: { orderId: order.id }
        });
        
        console.log(`Items (${items.length}):`);
        items.forEach((item, i) => {
          console.log(` ${i+1}. ${item.title} - $${item.price} x ${item.quantity}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserOrders();