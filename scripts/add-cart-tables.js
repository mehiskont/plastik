// Script to add cart tables to an existing database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking if cart tables already exist...');
    
    // Check if the tables already exist
    try {
      await prisma.$queryRaw`SELECT * FROM carts LIMIT 1`;
      console.log('Cart tables already exist, skipping creation');
      return;
    } catch (error) {
      console.log('Cart tables do not exist, proceeding with creation');
    }
    
    console.log('Creating cart tables...');
    
    // Create carts table
    await prisma.$executeRaw`
    CREATE TABLE "carts" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT UNIQUE,
      "guestId" TEXT UNIQUE,
      "updatedAt" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`;
    
    // Create cart_items table
    await prisma.$executeRaw`
    CREATE TABLE "cart_items" (
      "id" TEXT PRIMARY KEY,
      "cartId" TEXT NOT NULL,
      "discogsId" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "price" DOUBLE PRECISION NOT NULL,
      "quantity" INTEGER NOT NULL,
      "quantity_available" INTEGER NOT NULL,
      "condition" TEXT,
      "weight" INTEGER NOT NULL DEFAULT 180,
      "images" JSONB[]
    );`;
    
    // Add foreign key constraints
    await prisma.$executeRaw`
    ALTER TABLE "carts" 
    ADD FOREIGN KEY ("userId") REFERENCES "users"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;`;
    
    await prisma.$executeRaw`
    ALTER TABLE "cart_items" 
    ADD FOREIGN KEY ("cartId") REFERENCES "carts"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;`;
    
    console.log('Cart tables created successfully');
  } catch (error) {
    console.error('Error creating cart tables:', error);
    process.exit(1);
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