// Script to fix tax details display in order emails and order summaries
const { PrismaClient } = require('@prisma/client');
// Use direct console.log instead of the logger to avoid path issues
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
};

const prisma = new PrismaClient();

async function fixTaxDetails() {
  try {
    log("Starting tax details fix...");
    
    // Get the most recent orders
    const recentOrders = await prisma.order.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });
    
    log(`Found ${recentOrders.length} recent orders to check`);
    
    for (const order of recentOrders) {
      // Check if we have a billing address but tax details are missing or malformed
      if (order.billingAddress) {
        const billingAddress = order.billingAddress;
        
        // Check if the order has tax details in the metadata but not properly formatted
        if (billingAddress.taxDetails === "true" || billingAddress.organization || billingAddress.taxId) {
          log(`Fixing tax details for order: ${order.id}`);
          
          // Ensure tax details are explicitly set to "true" as a string
          // This matches what the frontend expects
          const updatedBillingAddress = {
            ...billingAddress,
            taxDetails: "true",
            organization: billingAddress.organization || "",
            taxId: billingAddress.taxId || ""
          };
          
          // Update the order
          await prisma.order.update({
            where: { id: order.id },
            data: { billingAddress: updatedBillingAddress }
          });
          
          log(`✅ Updated order ${order.id} with fixed tax details`);
        } else {
          log(`Order ${order.id} does not have tax details metadata`);
        }
      } else {
        log(`Order ${order.id} does not have billing address data`);
      }
    }
    
    log("Tax details fix completed");
  } catch (error) {
    log(`Error fixing tax details: ${error.message}`, "error");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixTaxDetails().catch(e => {
  log(`Fatal error: ${e.message}`, "error");
  console.error(e);
  process.exit(1);
});