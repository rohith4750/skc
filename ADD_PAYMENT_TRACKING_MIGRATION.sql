-- Migration: Add Payment Tracking Fields to Expenses
-- This adds paidAmount and paymentStatus fields to track payment completion status

-- Add paidAmount column (defaults to 0, will be updated to amount for existing records)
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
ALTER TABLE "expenses" ADD CONSTRAINT IF NOT EXISTS "expenses_paymentStatus_check" 
CHECK ("paymentStatus" IN ('pending', 'partial', 'paid'));

-- Add check constraint to ensure paidAmount is not negative and not greater than amount
ALTER TABLE "expenses" ADD CONSTRAINT IF NOT EXISTS "expenses_paidAmount_check" 
CHECK ("paidAmount" >= 0 AND "paidAmount" <= "amount");
