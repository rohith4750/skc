-- =====================================================
-- SAFE PRODUCTION MIGRATION (ZERO DATA LOSS GUARANTEE)
-- Run this in your Neon SQL Editor or via the script
-- =====================================================

DO $$
BEGIN
    -- 1. serviceCost column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'serviceCost'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "serviceCost" DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE 'Added serviceCost column to orders';
    END IF;

    -- 2. transportCost column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'transportCost'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "transportCost" DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE 'Added transportCost column to orders';
    END IF;

    -- 3. waterBottlesCost column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'waterBottlesCost'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "waterBottlesCost" DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE 'Added waterBottlesCost column to orders';
    END IF;

    -- 4. discount column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'discount'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "discount" DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE 'Added discount column to orders';
    END IF;

    -- 5. eventName column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'eventName'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "eventName" TEXT;
        RAISE NOTICE 'Added eventName column to orders';
    END IF;

    -- 6. services column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'services'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "services" JSONB;
        RAISE NOTICE 'Added services column to orders';
    END IF;

    -- 7. numberOfMembers column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'numberOfMembers'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "numberOfMembers" INTEGER;
        RAISE NOTICE 'Added numberOfMembers column to orders';
    END IF;

    -- 8. mealTypeAmounts column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'mealTypeAmounts'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "mealTypeAmounts" JSONB;
        RAISE NOTICE 'Added mealTypeAmounts column to orders';
    END IF;

    -- 9. stalls column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'stalls'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "stalls" JSONB;
        RAISE NOTICE 'Added stalls column to orders';
    END IF;

    -- 10. trackingToken on workforce table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'workforce' AND column_name = 'trackingToken'
    ) THEN
        ALTER TABLE "workforce" ADD COLUMN "trackingToken" TEXT;
        RAISE NOTICE 'Added trackingToken column to workforce';
    END IF;

END $$;
