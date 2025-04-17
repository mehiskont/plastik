const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load env variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Load default .env file if values not in .env.local

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Get user credentials from environment variables or use defaults
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'password123';
    const adminEmail = process.env.ADMIN_USER_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_USER_PASSWORD || 'admin123';
    
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    const user = await prisma.user.upsert({
      where: { email: testEmail },
      update: { 
        hashedPassword,
        name: 'Test User'
      },
      create: {
        email: testEmail,
        name: 'Test User',
        hashedPassword,
      }
    });
    
    console.log('Test user created/updated:', user);
    
    // Create admin user too
    const adminHashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { 
        hashedPassword: adminHashedPassword,
        name: 'Admin User'
      },
      create: {
        email: adminEmail,
        name: 'Admin User',
        hashedPassword: adminHashedPassword,
      }
    });
    
    console.log('Admin user created/updated:', adminUser);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error creating test user:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createTestUser();
