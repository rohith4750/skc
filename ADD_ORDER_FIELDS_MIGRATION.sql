-- =====================================================
-- Add Event Name, Services, and Number of Members to Orders Table
-- Run this in Neon SQL Editor
-- =====================================================

-- Add eventName column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'eventName'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "eventName" TEXT;
        RAISE NOTICE 'eventName column added to orders table';
    ELSE
        RAISE NOTICE 'eventName column already exists in orders table';
    END IF;
END $$;

-- Add services column (JSONB to store array of services)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'services'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "services" JSONB;
        RAISE NOTICE 'services column added to orders table';
    ELSE
        RAISE NOTICE 'services column already exists in orders table';
    END IF;
END $$;

-- Add numberOfMembers column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'numberOfMembers'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "numberOfMembers" INTEGER;
        RAISE NOTICE 'numberOfMembers column added to orders table';
    ELSE
        RAISE NOTICE 'numberOfMembers column already exists in orders table';
    END IF;
END $$;

-- =====================================================
-- Migration Complete!
-- =====================================================
-- New fields added to orders table:
-- - eventName (TEXT, nullable)
-- - services (JSONB, nullable) - stores array like ["buffet", "vaddana", "handover"]
-- - numberOfMembers (INTEGER, nullable)
-- =====================================================
