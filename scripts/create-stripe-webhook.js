// Script to create a Stripe webhook endpoint for testing
require('dotenv').config();
const { execSync } = require('child_process');
const crypto = require('crypto');

async function createStripeWebhook() {
  try {
    console.log('Setting up Stripe CLI and webhook...');
    
    // Check if the Stripe CLI is installed
    try {
      execSync('stripe --version');
      console.log('✅ Stripe CLI is installed');
    } catch (error) {
      console.error('❌ Stripe CLI is not installed. Please install it first:');
      console.log('https://stripe.com/docs/stripe-cli#install');
      process.exit(1);
    }
    
    // Generate a random webhook signing secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');
    console.log(`\nGenerated webhook secret: ${webhookSecret}`);
    console.log('Add this to your .env file:');
    console.log(`STRIPE_WEBHOOK_SECRET="${webhookSecret}"`);
    
    // Instructions for forwarding Stripe webhooks locally
    console.log('\nTo test webhooks locally, run this command in a separate terminal:');
    console.log('stripe listen --forward-to https://plastik.komeh.tech/api/webhooks/stripe');
    
    // Manually trigger a sample webhook event
    console.log('\nTo manually trigger a webhook event, run:');
    console.log('stripe trigger payment_intent.succeeded');
    console.log('\nOr create a test checkout using your website and the Stripe CLI will forward it automatically.');
    
    // Check for multiple webhook handlers
    console.log('\nMake sure only one webhook handler is active. Current webhook handlers:');
    console.log('- /api/webhooks/stripe/route.ts (RECOMMENDED)');
    console.log('- /api/webhook/stripe/route.ts');
    console.log('- /api/webhook/route.ts');
    console.log('\nYou should update the Stripe dashboard to point to the correct endpoint:');
    console.log('https://dashboard.stripe.com/webhooks');
    console.log('Add an endpoint with URL: https://plastik.komeh.tech/api/webhooks/stripe');
    
  } catch (error) {
    console.error('Error setting up webhook:', error);
  }
}

createStripeWebhook();