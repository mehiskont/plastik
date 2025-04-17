#!/bin/bash

# Log deployment start
echo "Deployment started: $(date)"

# Set error handling to stop on any error
set -e

# Change to your project directory
cd /data03/virt136643/domeenid/www.komeh.tech/plastik/rekords

# Pull the latest changes from GitHub
echo "Pulling latest code..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# SKIPPING DATABASE STEP FOR TROUBLESHOOTING
echo "Skipping database schema push for troubleshooting..."

# Build the application
echo "Building application..."
npm run build

# Create lib symlink in the .next directory to fix module resolution
echo "Creating lib symlinks for module resolution..."
mkdir -p .next/server/chunks
ln -sf ../../lib .next/server/chunks/lib
ln -sf ../../lib .next/server/lib
ln -sf ../lib .next/lib

# Restart the PM2 process
echo "Restarting application..."
pm2 restart rekords || pm2 start npm --name "rekords" -- start

echo "Deployment completed: $(date)" 