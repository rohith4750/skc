-- =====================================================
-- MISSED MIGRATIONS FOR PRODUCTION DATABASE
-- Run this in your production database (Neon SQL Editor)
-- =====================================================
-- 
-- This file contains the missing migrations that need to be applied
-- to your production database.
--
-- IMPORTANT: 
-- - Run this in your production database SQL Editor
-- - These migrations use "IF NOT EXISTS" to be safe
-- - Back up your database before running if possible
-- =====================================================

-- =====================================================
-- MIGRATION: Payment Tracking for Expenses
-- Date: 2026-01-10
-- Description: Adds paidAmount and paymentStatus fields to expenses table
-- =====================================================

-- Add paidAmount column (defaults to 0)
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add paymentStatus column (defaults to 'pending')
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'pending';

-- Update existing records: set paidAmount to amount and paymentStatus to 'paid' for backward compatibility
-- This assumes all existing expenses were fully paid
UPDATE "expenses" 
SET "paidAmount" = "amount", 
    "paymentStatus" = CASE 
        WHEN "amount" > 0 THEN 'paid' 
        ELSE 'pending' 
    END
WHERE "paidAmount" = 0;

-- Add check constraint to ensure paymentStatus is one of the valid values
-- Note: PostgreSQL doesn't support "ADD CONSTRAINT IF NOT EXISTS" directly
-- So we'll use DO block to check and add conditionally
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'expenses_paymentStatus_check'
    ) THEN
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paymentStatus_check" 
        CHECK ("paymentStatus" IN ('pending', 'partial', 'paid'));
    END IF;
END $$;

-- Add check constraint to ensure paidAmount is not negative and not greater than amount
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'expenses_paidAmount_check'
    ) THEN
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paidAmount_check" 
        CHECK ("paidAmount" >= 0 AND "paidAmount" <= "amount");
    END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the migration was successful
-- =====================================================

-- Check if columns exist
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'expenses' 
-- AND column_name IN ('paidAmount', 'paymentStatus');

-- Check if constraints exist
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'expenses' 
-- AND constraint_name IN ('expenses_paymentStatus_check', 'expenses_paidAmount_check');

-- =====================================================
-- END OF MIGRATION
-- =====================================================
