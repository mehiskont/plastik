supabase is postreSQL
resend emails





ngrok http 3000   


# Test all connection configurations
npm run test:connections

# Run the comprehensive database verification
npm run test:db

# Run the final configuration test
npm run test:final




# Database (Required for Prisma)
DATABASE_URL="postgresql://username:password@host:6543/database?pgbouncer=true"
DIRECT_URL="postgresql://username:password@host:5432/database"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"  # In production, use your deployment URL
NEXTAUTH_SECRET="your-generated-secret-key"  # Generate with: openssl rand -base64 32

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Provider (for magic link signin)
EMAIL_SERVER_HOST="smtp.example.com"  # e.g., smtp.gmail.com
EMAIL_SERVER_PORT="587"  # Common ports: 587 (TLS) or 465 (SSL)
EMAIL_SERVER_USER="your-email@example.com"
EMAIL_SERVER_PASSWORD="your-email-password-or-app-specific-password"
EMAIL_FROM="noreply@example.com"  # The sender email address

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Same as STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET="whsec_..."

# Apple Pay Configuration
APPLE_PAY_MERCHANT_IDENTIFIER="merchant.com.your.domain"
APPLE_PAY_DOMAIN_NAME="your-domain.com"
NEXT_PUBLIC_APPLE_PAY_MERCHANT_IDENTIFIER="merchant.com.your.domain"  # Same as APPLE_PAY_MERCHANT_IDENTIFIER

# Discogs API Configuration
DISCOGS_USERNAME="your-discogs-username"
DISCOGS_CONSUMER_KEY="your-discogs-consumer-key"
DISCOGS_CONSUMER_SECRET="your-discogs-consumer-secret"
DISCOGS_API_TOKEN="your-discogs-api-token"

# Email Service (Resend)
RESEND_API_KEY="re_..."