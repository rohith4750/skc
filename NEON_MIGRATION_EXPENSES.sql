-- Migration SQL for Neon Database
-- Run this in Neon SQL Editor to update your production database
-- This adds the new fields to the expenses table

-- Step 1: Create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "recipient" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventDate" TIMESTAMP(3),
    "notes" TEXT,
    "calculationDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add foreign key constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'expenses_orderId_fkey'
    ) THEN
        ALTER TABLE "expenses" 
        ADD CONSTRAINT "expenses_orderId_fkey" 
        FOREIGN KEY ("orderId") 
        REFERENCES "orders"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 3: Add new columns if they don't exist (for existing tables)
ALTER TABLE "expenses" 
ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "calculationDetails" JSONB;

-- Step 4: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "expenses_orderId_idx" ON "expenses"("orderId");
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses"("category");
CREATE INDEX IF NOT EXISTS "expenses_paymentDate_idx" ON "expenses"("paymentDate");
CREATE INDEX IF NOT EXISTS "expenses_eventDate_idx" ON "expenses"("eventDate");

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;
