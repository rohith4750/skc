-- Add role column to workforce_payments (optional - for role-based payment tracking)
ALTER TABLE "workforce_payments" ADD COLUMN IF NOT EXISTS "role" TEXT;
