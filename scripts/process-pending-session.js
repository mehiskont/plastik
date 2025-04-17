// Script to manually process a Stripe checkout session
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

// Use database URL from environment variable or default Prisma config
const prisma = new PrismaClient(
  process.env.DATABASE_URL ? {
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  } : {}
);

// Init Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function processCheckoutSession() {
  try {
    // Get session ID from environment or command line args
    const sessionId = process.env.SESSION_ID || process.argv[2];
    if (!sessionId) {
      console.error('Error: SESSION_ID environment variable or command line argument is required');
      process.exit(1);
    }
    
    console.log(`Processing checkout session: ${sessionId}`);
    
    // Retrieve the full session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'payment_intent']
    });
    
    console.log(`Session status: ${session.status}`);
    console.log(`Customer email: ${session.customer_details?.email}`);
    
    if (session.status !== 'complete') {
      console.log('Session is not complete, skipping');
      return;
    }
    
    // Check if order already exists for this session
    const existingOrder = await prisma.order.findFirst({
      where: { stripeId: sessionId }
    });
    
    if (existingOrder) {
      console.log(`Order already exists with ID: ${existingOrder.id}`);
      return;
    }
    
    // Find the user by email
    const userEmail = session.customer_details?.email;
    let userId = null;
    
    if (userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (user) {
        userId = user.id;
        console.log(`Found user: ${user.name} (${userId})`);
      } else {
        console.log(`No user found for email ${userEmail}`);
      }
    }
    
    // Parse items from metadata
    let items = [];
    try {
      items = session.metadata?.items ? JSON.parse(session.metadata.items) : [];
      console.log(`Found ${items.length} items in metadata`);
    } catch (err) {
      console.error('Error parsing items from metadata:', err);
    }
    
    if (items.length === 0) {
      console.error('No items found in session metadata');
      return;
    }
    
    // Calculate total (should match Stripe amount)
    const calculatedTotal = items.reduce(
      (sum, item) => sum + (item.price * (item.quantity || 1)), 
      0
    );
    
    console.log(`Calculated total: ${calculatedTotal}`);
    
    // Create the order
    const order = await prisma.order.create({
      data: {
        userId: userId || 'anonymous',
        stripeId: sessionId,
        status: 'paid',
        total: calculatedTotal,
        shippingAddress: session.shipping_details || session.customer_details || {},
        billingAddress: session.customer_details || {},
        items: {
          create: items.map((item) => ({
            discogsId: item.id.toString(),
            title: item.title,
            price: item.price,
            quantity: item.quantity || 1,
            condition: item.condition || 'VG+'
          }))
        }
      },
      include: {
        items: true
      }
    });
    
    console.log(`Created order successfully with ID: ${order.id}`);
    console.log(`Order has ${order.items.length} items`);
    
    console.log('Process completed successfully!');
    
  } catch (error) {
    console.error('Error processing session:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processCheckoutSession();