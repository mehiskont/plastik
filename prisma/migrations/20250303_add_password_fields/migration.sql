-- Add password authentication fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hashedPassword" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);
