-- Safe Migration SQL - Only creates tables if they don't exist
-- Run this if you want to ensure all tables exist without errors

-- Check and create customers table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
        CREATE TABLE "customers" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "phone" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "address" TEXT NOT NULL,
            "message" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Check and create menu_items table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'menu_items') THEN
        CREATE TABLE "menu_items" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "description" TEXT,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Check and create supervisors table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'supervisors') THEN
        CREATE TABLE "supervisors" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "phone" TEXT NOT NULL,
            "cateringServiceName" TEXT NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            CONSTRAINT "supervisors_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Check and create orders table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        CREATE TABLE "orders" (
            "id" TEXT NOT NULL,
            "customerId" TEXT NOT NULL,
            "supervisorId" TEXT NOT NULL,
            "totalAmount" DOUBLE PRECISION NOT NULL,
            "advancePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "remainingAmount" DOUBLE PRECISION NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'pending',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Check and create order_items table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
        CREATE TABLE "order_items" (
            "id" TEXT NOT NULL,
            "orderId" TEXT NOT NULL,
            "menuItemId" TEXT NOT NULL,
            "quantity" INTEGER DEFAULT 1,
            CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Check and create bills table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bills') THEN
        CREATE TABLE "bills" (
            "id" TEXT NOT NULL,
            "orderId" TEXT NOT NULL,
            "totalAmount" DOUBLE PRECISION NOT NULL,
            "advancePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "remainingAmount" DOUBLE PRECISION NOT NULL,
            "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "status" TEXT NOT NULL DEFAULT 'pending',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Add foreign keys if they don't exist
DO $$ 
BEGIN
    -- orders -> customers
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_customerId_fkey'
    ) THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" 
        FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- orders -> supervisors
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_supervisorId_fkey'
    ) THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_supervisorId_fkey" 
        FOREIGN KEY ("supervisorId") REFERENCES "supervisors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- order_items -> orders
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_items_orderId_fkey'
    ) THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- order_items -> menu_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_items_menuItemId_fkey'
    ) THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" 
        FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- bills -> orders
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bills_orderId_fkey'
    ) THEN
        ALTER TABLE "bills" ADD CONSTRAINT "bills_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Add unique index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "bills_orderId_key" ON "bills"("orderId");

-- Add columns to orders table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'discount') THEN
        ALTER TABLE "orders" ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'mealTypeAmounts') THEN
        ALTER TABLE "orders" ADD COLUMN "mealTypeAmounts" JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'stalls') THEN
        ALTER TABLE "orders" ADD COLUMN "stalls" JSONB;
    END IF;
END $$;
