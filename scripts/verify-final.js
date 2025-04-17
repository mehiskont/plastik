const { PrismaClient } = require("@prisma/client")

async function testFinalConfig() {
  const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  })

  try {
    console.log("Testing final configuration...\n")

    await prisma.$connect()
    console.log("✓ Connection successful")

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version();`
    console.log("✓ Query successful")
    console.log("Database:", result[0].current_database)
    console.log("User:", result[0].current_user)
    console.log("Version:", result[0].version)

    return true
  } catch (error) {
    console.error("✕ Connection failed:", error.message)
    return false
  } finally {
    await prisma.$disconnect()
    console.log("Disconnected from database")
  }
}

testFinalConfig()
  .then((success) => {
    if (!success) {
      process.exit(1)
    }
  })
  .catch(console.error)

