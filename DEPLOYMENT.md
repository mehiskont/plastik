# Deploying to Zone.ee

This guide provides steps for deploying the Plastik Records application to Zone.ee.

## Database Configuration

### BigInt for Discogs IDs

The `discogsId` field in the `cart_items` table needs to be changed from INT to BIGINT to support large Discogs IDs that exceed PostgreSQL's INT4 range (max 2,147,483,647).

Run the following SQL command on your production database:

```sql
ALTER TABLE cart_items ALTER COLUMN "discogsId" TYPE BIGINT;
```

After deploying the updated code, verify that cart persistence works correctly with the following steps:

1. Log in with a user account
2. Add items to the cart
3. Verify items are stored in the database
4. Log out and confirm the cart appears empty in the UI
5. Log back in and verify the previously added items are restored

### PostgreSQL UUID Extension Issue

Zone.ee's PostgreSQL installation doesn't support the `uuid-ossp` extension which was previously required in our migrations. We've modified the migrations to remove this dependency by:

1. Using CUID instead of UUID for primary keys in our Prisma schema
2. Removing the `CREATE EXTENSION` commands from the migration files
3. Adding `@@map` annotations to all models in the Prisma schema to correctly map between PascalCase model names and snake_case table names

The Prisma schema now properly maps between model names and table names:
- `model Account` maps to the `accounts` table
- `model User` maps to the `users` table 
- etc.

### Deployment Steps

#### First-time Deployment

If this is your first deployment to Zone.ee and the database doesn't exist yet:

1. Set up your database credentials in Zone.ee
2. Update your `.env` file with the correct DATABASE_URL and DIRECT_URL:

```
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?schema=public"
DIRECT_URL="postgresql://username:password@hostname:5432/database_name?schema=public"
```

3. Deploy your application
4. Run migrations as part of your deployment process:

```bash
npx prisma migrate deploy
```

#### Troubleshooting Migration Issues

If you encounter migration errors related to the UUID extension:

1. Connect to your Zone.ee database via psql
2. Check if any tables exist:
   ```sql
   \dt
   ```

3. If tables don't exist:
   - You can simply drop the database and let Prisma create it from scratch:
   ```sql
   DROP DATABASE your_database_name;
   CREATE DATABASE your_database_name;
   ```
   - Then run migrations again

4. If tables exist with data you want to preserve:
   - Export your data
   - Drop affected tables
   - Run migrations to recreate tables
   - Import your data back

## Environment Variables

Ensure these environment variables are configured on Zone.ee:

```
NEXTAUTH_URL=https://your-production-url
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=postgresql://username:password@hostname:5432/database_name?schema=public
DIRECT_URL=postgresql://username:password@hostname:5432/database_name?schema=public
REDIS_URL=redis://your-redis-url
REDIS_ENABLED=true
NEXT_PUBLIC_APP_URL=https://your-production-url
```

## Deployment Commands

```bash
# Build the application
npm run build

# Start the application
npm start
```

## Automated Deployment with PM2

To set up automated deployment with PM2 and GitHub webhooks:

1. Install PM2 globally on your server:

```bash
npm install -g pm2
```

2. Create a PM2 ecosystem file (ecosystem.config.js) in your project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'plastik',
      script: 'npm',
      args: 'start',
      cwd: '/data03/virt136643/domeenid/www.komeh.tech/plastik/rekords',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      instances: 1,
      autorestart: true,
    },
  ],
};
```

3. Create a deployment script (deploy.sh):

```bash
#!/bin/bash
# Change to your project directory
cd /domeenid/www.komeh.tech/plastik/rekords

# Pull the latest changes from GitHub
git pull origin main

# Install dependencies
npm install --production

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Restart the PM2 process
pm2 restart rekords
```

4. Make the deployment script executable:

```bash
chmod +x deploy.sh
```

5. Set up a webhook on your GitHub repository to trigger the deployment script when changes are pushed.

## Post-Deployment Verification

1. Check if authentication works
2. Verify that the record inventory loads correctly
3. Test the cart functionality
4. Make sure the sign-in button appears properly