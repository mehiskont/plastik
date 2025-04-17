import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Get GitHub webhook secret from environment variable
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT;

// Verify GitHub signature
function verifySignature(payload: string, signature: string): boolean {
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  try {
    // Get GitHub signature and event
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    
    // Log the request
    console.log(`Received ${event} event`);
    
    // Only process push events
    if (event !== 'push') {
      return NextResponse.json({ status: 'ok', message: 'Ignored event type' }, { status: 200 });
    }
    
    // Get the request body
    const payload = await request.text();
    
    // Verify signature if secret is set
    if (signature) {
      if (!WEBHOOK_SECRET) {
        console.warn('GitHub webhook secret not configured in environment variables');
        return NextResponse.json({ status: 'error', message: 'Webhook secret not configured' }, { status: 500 });
      }
      
      if (!verifySignature(payload, signature)) {
        console.warn('Invalid GitHub signature received');
        return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 401 });
      }
    }
    
    // Parse the payload
    const data = JSON.parse(payload);
    
    // Check if push is to main branch
    if (data.ref !== 'refs/heads/main') {
      return NextResponse.json({ 
        status: 'ok', 
        message: `Ignored push to ${data.ref}` 
      }, { status: 200 });
    }
    
    // Check if the deploy script exists
    if (!fs.existsSync(DEPLOY_SCRIPT)) {
      console.error(`Deployment script not found at path: ${DEPLOY_SCRIPT}`);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Deployment script not found' 
      }, { status: 500 });
    }
    
    console.log(`Executing deployment script: ${DEPLOY_SCRIPT}`);
    
    // Execute the deployment script
    exec(`bash ${DEPLOY_SCRIPT}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Deployment error: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
      } else {
        console.log('Deployment successful');
        console.log(`Stdout: ${stdout}`);
      }
    });
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Deployment triggered' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}