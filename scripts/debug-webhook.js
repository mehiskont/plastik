// Debug webhook issues
// Run with: node scripts/debug-webhook.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Debugging Stripe webhook processing...");
  
  // 1. Check webhook logs in the database
  const webhookLogs = await prisma.webhookLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 10
  });
  
  console.log("\n=== Recent Webhook Logs ===");
  for (const log of webhookLogs) {
    console.log(`[${log.timestamp.toISOString()}] ${log.type}`);
    try {
      const payload = JSON.parse(log.payload);
      console.log(`  - ID: ${payload.id}`);
      if (payload.metadata) {
        console.log(`  - Metadata: ${JSON.stringify(payload.metadata)}`);
      }
      if (payload.customer_details) {
        console.log(`  - Customer: ${JSON.stringify(payload.customer_details.email)}`);
      }
    } catch (err) {
      console.log(`  - Error parsing payload: ${err.message}`);
    }
  }
  
  // 2. Check recent orders
  const orders = await prisma.order.findMany({
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  console.log("\n=== Recent Orders ===");
  for (const order of orders) {
    console.log(`Order ${order.id} (${order.createdAt.toISOString()})`);
    console.log(`  - Status: ${order.status}`);
    console.log(`  - Total: ${order.total}`);
    console.log(`  - Stripe ID: ${order.stripeId}`);
    console.log(`  - User ID: ${order.userId || 'anonymous'}`);
    console.log(`  - Items count: ${order.items.length}`);
    for (const item of order.items) {
      console.log(`    - Item: ${item.title} (Discogs ID: ${item.discogsId})`);
    }
  }
  
  // 3. Check for sessions that didn't create orders
  const recentWebhooks = await prisma.webhookLog.findMany({
    where: { type: 'checkout.session.completed' },
    orderBy: { timestamp: 'desc' },
    take: 10
  });
  
  console.log("\n=== Recent Completed Checkout Sessions ===");
  const sessionsWithoutOrders = [];
  
  for (const log of recentWebhooks) {
    try {
      const payload = JSON.parse(log.payload);
      const sessionId = payload.id;
      
      // Check if this session has an order
      const order = await prisma.order.findUnique({
        where: { stripeId: sessionId }
      });
      
      if (!order) {
        sessionsWithoutOrders.push({
          sessionId,
          timestamp: log.timestamp,
          customerEmail: payload.customer_details?.email,
          metadata: payload.metadata
        });
        console.log(`Session without order: ${sessionId} (${log.timestamp.toISOString()})`);
        if (payload.metadata?.items) {
          try {
            const items = JSON.parse(payload.metadata.items);
            console.log(`  - Items: ${JSON.stringify(items)}`);
          } catch (e) {
            console.log(`  - Error parsing items metadata: ${e.message}`);
          }
        }
      } else {
        console.log(`Session with order: ${sessionId} -> Order ID: ${order.id}`);
      }
    } catch (err) {
      console.log(`Error processing webhook log: ${err.message}`);
    }
  }
  
  console.log(`\nFound ${sessionsWithoutOrders.length} sessions without corresponding orders`);
}

main()
  .catch(e => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });