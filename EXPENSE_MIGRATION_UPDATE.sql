-- Migration SQL to Update Expenses Table with new fields
-- Run this if you already have the expenses table created
-- Run this in your Neon SQL Editor or database client

-- Add new columns if they don't exist
ALTER TABLE "expenses" 
ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "calculationDetails" JSONB;

-- Update existing expenses table with orderId if not already added
ALTER TABLE "expenses" 
ADD COLUMN IF NOT EXISTS "orderId" TEXT;

-- Add foreign key constraint if not exists (this might fail if constraint already exists, that's okay)
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
        ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "expenses_orderId_idx" ON "expenses"("orderId");
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses"("category");
CREATE INDEX IF NOT EXISTS "expenses_paymentDate_idx" ON "expenses"("paymentDate");
CREATE INDEX IF NOT EXISTS "expenses_eventDate_idx" ON "expenses"("eventDate");
