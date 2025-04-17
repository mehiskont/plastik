#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define variables
APP_NAME="plastik-frontend" # Choose a relevant name
REGION="fra1" # Example region, change if needed
PLAN="basic-xxs" # Example plan, change if needed

# Navigate to the project directory (optional, if script is run from elsewhere)
# cd /path/to/your/project

echo "Starting deployment process..."

# 1. Install dependencies
echo "Installing dependencies..."
npm install

# 2. Build the Next.js application
echo "Building the application..."
npm run build

# 3. Database setup (Removed)
# Remove database migrations step
# echo "Running database migrations with Supabase schema..."
# npx prisma db push --schema=./prisma/schema.supabase.prisma

echo "Database migrations skipped (handled by backend API deployment)."

# 4. Deploy to DigitalOcean App Platform (Example)
# Replace with your actual deployment command or process
echo "Deploying to DigitalOcean App Platform..."
# Example using doctl (ensure doctl is configured)
# doctl apps create --spec .do/app.yaml 
# OR update existing app:
# doctl apps update YOUR_APP_ID --spec .do/app.yaml

echo "Deployment command placeholder. Replace with your actual deployment steps."

# Example: If deploying static site to Netlify/Vercel
# echo "Deploying to Vercel..."
# vercel --prod

echo "Deployment process finished."