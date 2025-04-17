-- This is a no-op migration that adds @@map annotations to the Prisma schema
-- It doesn't make any actual database changes, but ensures the schema matches
-- the expected table names in the database

-- The @@map annotations were added to every model in the schema:
-- model Account -> @@map("accounts")
-- model Session -> @@map("sessions")
-- model User -> @@map("users")
-- model VerificationToken -> @@map("verification_tokens")
-- model Order -> @@map("orders")
-- model OrderItem -> @@map("order_items")
-- model DiscogsAuth -> @@map("discogs_auth")
-- model WebhookLog -> @@map("webhook_logs")

-- This aligns the Prisma schema with the table naming convention that was
-- established in the 20250227145016_v25_updates migration.