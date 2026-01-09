-- Migration SQL for Expenses Table
-- Run this in your Neon SQL Editor or database client

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

-- Add foreign key constraint to link expenses to orders
ALTER TABLE "expenses" 
ADD CONSTRAINT "expenses_orderId_fkey" 
FOREIGN KEY ("orderId") 
REFERENCES "orders"("id") 
ON DELETE SET NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "expenses_orderId_idx" ON "expenses"("orderId");
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses"("category");
CREATE INDEX IF NOT EXISTS "expenses_paymentDate_idx" ON "expenses"("paymentDate");
