const { PrismaClient } = require('@prisma/client')

async function testConnection(url, type) {
  const prisma = new PrismaClient({
    datasourceUrl: url,
    log: ['query', 'info', 'warn', 'error'],
  })

  try {
    console.log(`\nTesting ${type} connection...`)
    console.log(`${type} URL:`, url.replace(/:[^:@]*@/, ':****@'))
    
    await prisma.$connect()
    console.log(`✓ Successfully connected to database via ${type}!`)
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version();`
    console.log(`✓ Successfully executed query via ${type}`)
    console.log('Database version:', result[0].version)
    
    return true
  } catch (error) {
    console.error(`✕ ${type} connection error:`, {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return false
  } finally {
    await prisma.$disconnect()
    console.log(`Disconnected ${type} client`)
  }
}

async function verifyConnections() {
  console.log('Starting database connection verification...\n')
  
  // Verify environment variables are set
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set')
    return
  }
  
  if (!process.env.DIRECT_URL) {
    console.error('ERROR: DIRECT_URL environment variable is not set')
    return
  }

  const pooledResult = await testConnection(process.env.DATABASE_URL, 'Pooled (PgBouncer)')
  const directResult = await testConnection(process.env.DIRECT_URL, 'Direct')
  
  console.log('\nConnection Test Results:')
  console.log('----------------------')
  console.log('Pooled Connection:', pooledResult ? '✓ SUCCESS' : '✕ FAILED')
  console.log('Direct Connection:', directResult ? '✓ SUCCESS' : '✕ FAILED')
  
  if (!pooledResult && !directResult) {
    console.log('\nTroubleshooting steps:')
    console.log('1. Verify your database is running in Supabase dashboard')
    console.log('2. Check if your IP is allowed in Supabase dashboard')
    console.log('3. Verify your connection strings are correct:')
    console.log('   - DATABASE_URL should use port 6543 with ?pgbouncer=true')
    console.log('   - DIRECT_URL should use port 5432 without ?pgbouncer=true')
  }
}

verifyConnections()
  .catch(console.error)