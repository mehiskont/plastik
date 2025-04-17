#!/usr/bin/env node

// Force clear any cached connections
Object.keys(require.cache).forEach(function(key) {
  delete require.cache[key];
});

// Clear environment variables to start fresh
delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('Environment:');
console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
console.log('DIRECT_URL:', process.env.DIRECT_URL?.replace(/:[^:@]*@/, ':****@') || 'Not set');

async function testConnection() {
  console.log('\nTesting database connection...');
  
  try {
    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
      log: ['query', 'info', 'warn', 'error'],
    });

    console.log('Connecting...');
    await prisma.$connect();
    console.log('✅ Connected successfully to database!');

    // Test a simple query
    console.log('Running test query...');
    const result = await prisma.$queryRaw`SELECT current_database(), current_user`;
    console.log('✅ Query successful.');
    console.log('Database:', result[0].current_database);
    console.log('User:', result[0].current_user);

    // Check permissions with simple operations
    try {
      console.log('\nTesting User table access...');
      const users = await prisma.user.findMany({ take: 1 });
      console.log(`✅ User table accessible! Found ${users.length} users.`);
      
      if (users.length > 0) {
        console.log('First user:', {
          id: users[0].id,
          email: users[0].email,
          name: users[0].name
        });
      }
    } catch (tableError) {
      console.error('❌ Cannot access User table:', tableError.message);
    }

    await prisma.$disconnect();
    console.log('\nConnection test completed.');
  } catch (error) {
    console.error('\n❌ Connection error:', error.message);
    if (error.meta) {
      console.error('Error details:', error.meta);
    }
  }
}

testConnection();