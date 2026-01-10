-- =====================================================
-- ALL MISSED MIGRATIONS FOR PRODUCTION DATABASE
-- Run this in your production database (Neon SQL Editor)
-- =====================================================
-- 
-- This file contains ALL missing migrations that need to be applied
-- to your production database, including:
-- 1. Payment Tracking for Expenses
-- 2. Stock Management
-- 3. Inventory Management
--
-- IMPORTANT: 
-- - Run this in your production database SQL Editor (Neon SQL Editor)
-- - These migrations use "IF NOT EXISTS" to be safe
-- - Back up your database before running if possible
-- - Run each section separately if you encounter any issues
-- =====================================================

-- =====================================================
-- MIGRATION 1: Payment Tracking for Expenses
-- Date: 2026-01-10
-- Description: Adds paidAmount and paymentStatus fields to expenses table
-- =====================================================

-- Add paidAmount column (defaults to 0)
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add paymentStatus column (defaults to 'pending')
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'pending';

-- Update existing records: set paidAmount to amount and paymentStatus to 'paid' for backward compatibility
UPDATE "expenses" 
SET "paidAmount" = "amount", 
    "paymentStatus" = CASE 
        WHEN "amount" > 0 THEN 'paid' 
        ELSE 'pending' 
    END
WHERE "paidAmount" = 0;

-- Add check constraint for paymentStatus
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

-- Add check constraint for paidAmount
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
-- MIGRATION 2: Stock Management
-- Date: 2026-01-10
-- Description: Creates stock and stock_transactions tables
-- =====================================================

-- CreateTable: stock
CREATE TABLE IF NOT EXISTS "stock" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStock" DOUBLE PRECISION,
    "maxStock" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "supplier" TEXT,
    "location" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable: stock_transactions
CREATE TABLE IF NOT EXISTS "stock_transactions" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: stock_transactions.stockId -> stock.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'stock_transactions_stockId_fkey'
    ) THEN
        ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_stockId_fkey" 
        FOREIGN KEY ("stockId") REFERENCES "stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- =====================================================
-- MIGRATION 3: Inventory Management
-- Date: 2026-01-10
-- Description: Creates inventory table
-- =====================================================

-- CreateTable: inventory
CREATE TABLE IF NOT EXISTS "inventory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "location" TEXT,
    "supplier" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify everything was created
-- =====================================================

-- Check if expense columns exist
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'expenses' 
-- AND column_name IN ('paidAmount', 'paymentStatus');

-- Check if stock tables exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('stock', 'stock_transactions');

-- Check if inventory table exists
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name = 'inventory';

-- Check all constraints
-- SELECT constraint_name, constraint_type, table_name
-- FROM information_schema.table_constraints 
-- WHERE table_name IN ('expenses', 'stock', 'stock_transactions', 'inventory')
-- ORDER BY table_name, constraint_name;

-- =====================================================
-- END OF ALL MIGRATIONS
-- =====================================================
-- 
-- After running these migrations:
-- 1. Verify all tables and columns were created
-- 2. Check that constraints are in place
-- 3. Test the application to ensure everything works
-- =====================================================
