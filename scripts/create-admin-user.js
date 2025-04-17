const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  console.log('Creating admin user');
  const prisma = new PrismaClient();
  
  try {
    // Delete existing admin user if exists
    await prisma.user.deleteMany({
      where: { email: 'admin@example.com' }
    });
    
    // Create new admin user with a secure password (should be changed immediately)
    const hashedPassword = await bcrypt.hash('ADMIN_PASSWORD_PLACEHOLDER', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        hashedPassword: hashedPassword,
      }
    });
    
    console.log('Created admin user:', adminUser.id);
    
    // Create an order for the admin
    const order = await prisma.order.create({
      data: {
        userId: adminUser.id,
        status: 'completed',
        total: 75.99,
        shippingAddress: {
          name: 'Admin User',
          address: '123 Admin St',
          city: 'Admin City',
          state: 'CA',
          postalCode: '90210',
          country: 'US'
        },
        items: {
          create: [
            {
              discogsId: '87654321',
              title: 'Rare Admin Vinyl',
              price: 45.99,
              quantity: 1,
              condition: 'Mint'
            },
            {
              discogsId: '12345678',
              title: 'Special Edition CD',
              price: 30.00,
              quantity: 1,
              condition: 'Very Good Plus'
            }
          ]
        }
      }
    });
    
    console.log('Created admin order:', order.id);
  } catch (err) {
    console.error('Error creating admin user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
