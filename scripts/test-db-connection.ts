// Force clear module cache to avoid stale connections
Object.keys(require.cache).forEach(function(key) {
  delete require.cache[key];
});

// Reset all environment variables related to the database
delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;

const dotenv = require("dotenv")
const { PrismaClient } = require("@prisma/client")

// Load environment variables, prioritizing .env 
dotenv.config() // default .env
console.log("📋 Loaded environment from .env")

// Verify the environment is loaded properly
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set! Check your .env file.");
  process.exit(1);
}

async function main() {
  try {
    console.log("\n🔍 Database Connection Test")
    console.log("------------------------")
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'))
    console.log("DIRECT_URL:", process.env.DIRECT_URL?.replace(/:[^:@]*@/, ':****@') || "Not set")
    
    // Create new instance with explicit URL to avoid any caching issues
    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
      log: ['query', 'info', 'warn', 'error'],
    })

    console.log("\nAttempting connection with DATABASE_URL...")
    await prisma.$connect()
    console.log("✅ Connected to database!")

    // Test a simple query
    console.log("Running test query...")
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`
    console.log("✅ Query successful:", result)

    // Check for User table
    console.log("Checking User table...")
    try {
      const users = await prisma.user.findMany({ take: 1 })
      console.log(`✅ User table exists with ${users.length} records`)
      
      // If we have users, show one as example
      if (users.length > 0) {
        console.log("Sample user:", { 
          id: users[0].id,
          email: users[0].email,
          name: users[0].name,
          hasPassword: !!users[0].hashedPassword
        })
      }
    } catch (err) {
      console.error("❌ Error accessing User table:", err instanceof Error ? err.message : String(err))
    }

    await prisma.$disconnect()
    console.log("Disconnected from database")
    
    // Try direct URL if available
    if (process.env.DIRECT_URL) {
      console.log("\nAttempting connection with DIRECT_URL...")
      const directPrisma = new PrismaClient({
        datasourceUrl: process.env.DIRECT_URL,
        log: ['query', 'info', 'warn', 'error'],
      })
      
      await directPrisma.$connect()
      console.log("✅ Direct connection successful!")
      
      const directResult = await directPrisma.$queryRaw`SELECT NOW() as current_time`
      console.log("✅ Direct query successful:", directResult)
      
      await directPrisma.$disconnect()
      console.log("Disconnected from direct connection")
    }

  } catch (error) {
    console.error("\n❌ Database connection failed:", error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.hasOwnProperty('meta')) {
      console.error("Error details:", error.meta)
    }
  }
  
  console.log("\n📝 Next steps:")
  console.log("1. If connection succeeded, your database configuration is working")
  console.log("2. If connection failed, verify credentials in .env")
  console.log("3. Restart your Next.js server to apply changes")
}

main()

