// Script to create a test order for a specific user
const { PrismaClient } = require('@prisma/client');

// Create client with direct database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://mehiskont:@localhost:5432/postgres?schema=public"
    }
  }
});

async function createTestOrder() {
  try {
    // Find user by email
    const email = 'mehiskont+matt@gmail.com'; // Replace with your email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.error(`No user found with email ${email}`);
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.id})`);
    
    // Create a test order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        stripeId: `test-${Date.now()}`,
        status: 'completed',
        total: 442.00,  // $221 x 2
        shippingAddress: {
          name: user.name,
          address: user.address || '123 Test St',
          city: user.city || 'Test City',
          state: user.state || 'Test State',
          country: user.country || 'US',
          postalCode: user.postalCode || '12345',
          email: user.email
        },
        billingAddress: {
          name: user.name,
          address: user.address || '123 Test St',
          city: user.city || 'Test City',
          state: user.state || 'Test State',
          country: user.country || 'US',
          postalCode: user.postalCode || '12345',
          email: user.email
        },
        items: {
          create: [{
            discogsId: '3483822696',
            title: 'Ninja Tools Vol.6',
            price: 221.00,
            quantity: 2,
            condition: 'VG+'
          }]
        }
      },
      include: {
        items: true
      }
    });
    
    console.log(`Created test order with ID: ${order.id}`);
    console.log(`Order has ${order.items.length} items`);
    console.log('Test order created successfully!');
    
  } catch (error) {
    console.error('Error creating test order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();