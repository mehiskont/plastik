# Plastik

## Supabase Integration

This project supports integration with Supabase for database and authentication services.

### Setting up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your Supabase URL and anon key from the project settings
3. Update the `.env.supabase` file with your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project-id.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:password@db.your-project-id.supabase.co:5432/postgres
```

4. To switch to Supabase, update your environment configuration:

```bash
cp .env.supabase .env.local
```

5. Test the connection:

```bash
npx ts-node scripts/test-supabase-connection.ts
```

### Using the MCP Supabase Tool

The project includes a Model Control Plane (MCP) tool for Claude to interact with Supabase. This tool provides functions for querying, inserting, updating, and deleting data.

See the `MCP-SUPABASE-TOOL.md` file for detailed documentation on using this tool.

## Environment Variables Setup

This project uses environment variables for configuration. Follow these guidelines for proper setup:

### Configuration Files

- `.env` - Production environment (deployed with the application)
- `.env.local` - Local development overrides (not committed to git)
- `.env.example` - Template showing all required variables

### Local Development

1. Use `.env.local` for all your local development settings
2. Any values not found in `.env.local` will fall back to `.env`
3. Never commit sensitive local credentials to any env file

### Production

1. Production settings should be in `.env`
2. Before deployment, ensure `.env` contains valid production credentials
3. Consider using environment variable injection from your hosting platform for sensitive values

### Environment Files Priority

Next.js loads environment variables in the following order:

1. `process.env`
2. `.env.$(NODE_ENV).local` (e.g. `.env.development.local`)
3. `.env.local` (except in test environment)
4. `.env.$(NODE_ENV)` (e.g. `.env.development`)
5. `.env`

### Public vs Server-Only Variables

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- All other variables are only available on the server
- Never store secrets in `NEXT_PUBLIC_` variables

## Development

```bash
# Install dependencies
npm install

# Start local database and Redis
docker-compose up -d

# Run development server
npm run dev
```

## Redis Cache (Optional)

This application uses Redis for caching release information only (30 days TTL).

Redis is optional and can be enabled/disabled with environment variables:
- `REDIS_ENABLED`: Set to "false" to completely disable Redis
- `REDIS_URL`: Connection string for Redis instance

For production:
- Set `REDIS_URL` to your hosted Redis instance
- The application will work without Redis if it's unavailable or disabled

For best performance in production, Redis is recommended but not required.

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## GitHub Webhook for Automated Deployment

This application supports automated deployments using GitHub webhooks. When set up correctly, pushing to the main branch will trigger an automatic deployment on your production server.

### Setup Instructions

1. Add environment variables to your `.env` file:
   ```
   GITHUB_WEBHOOK_SECRET="your-secret-here"
   DEPLOY_SCRIPT="/path/to/deploy.sh"
   ```

2. Create a webhook in your GitHub repository:
   - Go to your repository → Settings → Webhooks → Add webhook
   - Set Payload URL to: `https://yourdomain.com/api/webhooks/github`
   - Content type: `application/json`
   - Secret: Same value as your `GITHUB_WEBHOOK_SECRET`
   - Select "Just the push event"
   - Enable SSL verification
   - Click "Add webhook"

3. Ensure your deploy script is executable:
   ```bash
   chmod +x /path/to/deploy.sh
   ```

4. Automated deployments will now run when you push to the main branch

### Manual Scripts
```bash
# with supabase
npm run dev:supabase