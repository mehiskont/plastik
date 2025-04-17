// Script to fix the webhook conflict by removing duplicate webhook handlers
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function fixWebhookConflict() {
  console.log('Fixing webhook conflict by disabling duplicate handlers...');
  
  const rootDir = path.resolve(__dirname, '..');
  
  // List of duplicate webhook handlers to disable
  const duplicates = [
    // Leave this one active as our primary handler
    // '/app/api/webhooks/stripe/route.ts',
    
    // Disable these duplicates
    '/app/api/webhook/stripe/route.ts',
    '/app/api/webhook/route.ts'
  ];
  
  for (const relPath of duplicates) {
    const fullPath = path.join(rootDir, relPath);
    const bakPath = `${fullPath}.bak`;
    
    if (fs.existsSync(fullPath)) {
      console.log(`Disabling duplicate webhook handler: ${relPath}`);
      
      // Backup the file
      fs.copyFileSync(fullPath, bakPath);
      console.log(`  Created backup at: ${relPath}.bak`);
      
      // Replace file content with disabled version
      const originalContent = fs.readFileSync(fullPath, 'utf8');
      
      const disabledContent = 
`// THIS WEBHOOK HANDLER IS DISABLED TO PREVENT CONFLICTS
// The active webhook handler is at /app/api/webhooks/stripe/route.ts
// Original content is saved in this file with .bak extension

import { NextResponse } from "next/server"

export async function POST(req: Request) {
  return NextResponse.json({ 
    message: "This webhook endpoint is disabled to prevent conflicts. Use /api/webhooks/stripe instead." 
  }, { status: 404 })
}
`;
      
      fs.writeFileSync(fullPath, disabledContent, 'utf8');
      console.log(`  Disabled webhook handler: ${relPath}`);
    } else {
      console.log(`Webhook handler not found: ${relPath}`);
    }
  }
  
  console.log('\nWebhook conflict resolution completed.');
  console.log('The primary webhook handler at /app/api/webhooks/stripe/route.ts is now active.');
  console.log('Backups of the disabled handlers are saved with .bak extension.');
  
  console.log('\nMake sure your .env file contains a valid STRIPE_WEBHOOK_SECRET.');
  console.log('To get a webhook secret, run scripts/create-stripe-webhook.js');
}

fixWebhookConflict();