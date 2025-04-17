// Script to check and fix how tax details are being stored in stripe metadata
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

// Use direct console.log instead of the logger to avoid path issues
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
};

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const prisma = new PrismaClient();

async function fixTaxMetadata() {
  try {
    log("Starting tax metadata check...");
    
    // Get the most recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      where: { stripeId: { not: null } }
    });
    
    log(`Found ${recentOrders.length} recent orders with Stripe sessions to check`);
    
    for (const order of recentOrders) {
      try {
        // Retrieve the session from Stripe
        log(`Checking Stripe session for order ${order.id}: ${order.stripeId}`);
        
        // Determine if this is a checkout session or a payment intent
        const isCheckoutSession = order.stripeId.startsWith('cs_');
        const isPaymentIntent = order.stripeId.startsWith('pi_');
        
        let metadata;
        if (isCheckoutSession) {
          const session = await stripe.checkout.sessions.retrieve(order.stripeId);
          metadata = session.metadata;
          log(`Retrieved checkout session: ${session.id}`);
        } else if (isPaymentIntent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(order.stripeId);
          metadata = paymentIntent.metadata;
          log(`Retrieved payment intent: ${paymentIntent.id}`);
        } else {
          log(`Unknown Stripe ID format: ${order.stripeId}`, "warn");
          continue;
        }
        
        // Check if tax details exist in metadata
        if (metadata?.taxDetails) {
          log(`Order ${order.id} has tax details in Stripe metadata: ${metadata.taxDetails}`);
          log(`Organization: ${metadata.organization || 'N/A'}`);
          log(`Tax ID: ${metadata.taxId || 'N/A'}`);
          
          // Check if order's billingAddress matches the metadata
          if (order.billingAddress) {
            const updatedBillingAddress = {
              ...order.billingAddress,
              taxDetails: "true",
              organization: metadata.organization || "",
              taxId: metadata.taxId || ""
            };
            
            // Update the order if needed
            if (order.billingAddress.taxDetails !== "true" || 
                order.billingAddress.organization !== metadata.organization ||
                order.billingAddress.taxId !== metadata.taxId) {
              await prisma.order.update({
                where: { id: order.id },
                data: { billingAddress: updatedBillingAddress }
              });
              log(`✅ Updated order ${order.id} with tax details from Stripe metadata`);
            } else {
              log(`Order ${order.id} already has correct tax details`);
            }
          } else {
            log(`Order ${order.id} has no billingAddress to update`, "warn");
          }
        } else {
          log(`Order ${order.id} has no tax details in Stripe metadata`);
        }
      } catch (stripeError) {
        log(`Error retrieving Stripe data for order ${order.id}: ${stripeError.message}`, "error");
      }
    }
    
    log("Tax metadata check completed");
  } catch (error) {
    log(`Error checking tax metadata: ${error.message}`, "error");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixTaxMetadata().catch(e => {
  log(`Fatal error: ${e.message}`, "error");
  console.error(e);
  process.exit(1);
});