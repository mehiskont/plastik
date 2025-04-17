const { PrismaClient } = require("@prisma/client")

async function verifyDatabase() {
  const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  })

  try {
    console.log("Verifying database connection...\n")

    await prisma.$connect()
    console.log("✓ Connection successful")

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version();`
    console.log("\nDatabase Information:")
    console.log("-------------------")
    console.log("Database:", result[0].current_database)
    console.log("User:", result[0].current_user)
    console.log("Version:", result[0].version)

    // Test a write operation
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
      },
    })
    console.log("\n✓ Write operation successful")

    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id },
    })
    console.log("✓ Cleanup successful")

    return true
  } catch (error) {
    console.error("\n✕ Database verification failed:", error.message)
    return false
  } finally {
    await prisma.$disconnect()
    console.log("\nDatabase connection closed")
  }
}

verifyDatabase()
  .then((success) => {
    if (!success) {
      process.exit(1)
    }
  })
  .catch(console.error)

