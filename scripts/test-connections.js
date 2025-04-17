const { PrismaClient } = require("@prisma/client")

async function testConnection() {
  console.log("Testing connection with various configurations...\n")

  // Test 1: Basic connection
  try {
    const prisma1 = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
      log: ["query", "info", "warn", "error"],
    })
    await prisma1.$connect()
    console.log("✓ Basic connection successful")
    await prisma1.$disconnect()
  } catch (error) {
    console.log("✕ Basic connection failed:", error.message)
  }

  // Test 3: Try direct URL with pgbouncer parameter
  try {
    const modifiedDirectUrl = process.env.DIRECT_URL + "?pgbouncer=true"
    const prisma3 = new PrismaClient({
      datasourceUrl: modifiedDirectUrl,
      log: ["query", "info", "warn", "error"],
    })
    await prisma3.$connect()
    console.log("✓ Modified direct URL connection successful")
    await prisma3.$disconnect()
  } catch (error) {
    console.log("✕ Modified direct URL connection failed:", error.message)
  }

  // Test 4: Connection with explicit SSL
  try {
    const sslUrl = process.env.DATABASE_URL + "&sslmode=require"
    const prisma4 = new PrismaClient({
      datasourceUrl: sslUrl,
      log: ["query", "info", "warn", "error"],
    })
    await prisma4.$connect()
    console.log("✓ SSL connection successful")
    await prisma4.$disconnect()
  } catch (error) {
    console.log("✕ SSL connection failed:", error.message)
  }
}

testConnection().catch(console.error)

