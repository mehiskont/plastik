-- Removed UUID extension requirement
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
