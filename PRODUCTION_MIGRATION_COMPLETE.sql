-- =====================================================
-- COMPLETE PRODUCTION DATABASE MIGRATION
-- Run this SQL in your production database (Neon SQL Editor)
-- This file includes ALL tables and columns needed
-- =====================================================

-- =====================================================
-- 1. CORE TABLES (Customers, Menu, Supervisors, Orders)
-- =====================================================

-- Create customers table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
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
        RAISE NOTICE 'Customers table created';
    END IF;
END $$;

-- Create menu_items table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_items') THEN
        CREATE TABLE "menu_items" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "description" TEXT,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
        );
        RAISE NOTICE 'Menu items table created';
    END IF;
END $$;

-- Add Telugu columns to menu_items if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'nameTelugu') THEN
        ALTER TABLE "menu_items" ADD COLUMN "nameTelugu" TEXT;
        RAISE NOTICE 'nameTelugu column added to menu_items';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'descriptionTelugu') THEN
        ALTER TABLE "menu_items" ADD COLUMN "descriptionTelugu" TEXT;
        RAISE NOTICE 'descriptionTelugu column added to menu_items';
    END IF;
END $$;

-- Create supervisors table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supervisors') THEN
        CREATE TABLE "supervisors" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "phone" TEXT NOT NULL,
            "cateringServiceName" TEXT NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "supervisors_pkey" PRIMARY KEY ("id")
        );
        RAISE NOTICE 'Supervisors table created';
    END IF;
END $$;

-- Create orders table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        CREATE TABLE "orders" (
            "id" TEXT NOT NULL,
            "customerId" TEXT NOT NULL,
            "supervisorId" TEXT,
            "totalAmount" DOUBLE PRECISION NOT NULL,
            "advancePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "remainingAmount" DOUBLE PRECISION NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'pending',
            "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "mealTypeAmounts" JSONB,
            "stalls" JSONB,
            "eventName" TEXT,
            "services" JSONB,
            "numberOfMembers" INTEGER,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
        );
        RAISE NOTICE 'Orders table created';
    END IF;
END $$;

-- Add missing columns to orders table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'discount') THEN
        ALTER TABLE "orders" ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
        RAISE NOTICE 'discount column added to orders';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'mealTypeAmounts') THEN
        ALTER TABLE "orders" ADD COLUMN "mealTypeAmounts" JSONB;
        RAISE NOTICE 'mealTypeAmounts column added to orders';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'stalls') THEN
        ALTER TABLE "orders" ADD COLUMN "stalls" JSONB;
        RAISE NOTICE 'stalls column added to orders';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'eventName') THEN
        ALTER TABLE "orders" ADD COLUMN "eventName" TEXT;
        RAISE NOTICE 'eventName column added to orders';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'services') THEN
        ALTER TABLE "orders" ADD COLUMN "services" JSONB;
        RAISE NOTICE 'services column added to orders';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'numberOfMembers') THEN
        ALTER TABLE "orders" ADD COLUMN "numberOfMembers" INTEGER;
        RAISE NOTICE 'numberOfMembers column added to orders';
    END IF;
    
    -- Make supervisorId nullable if it's not already
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'supervisorId' AND is_nullable = 'NO') THEN
        ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_supervisorId_fkey";
        ALTER TABLE "orders" ALTER COLUMN "supervisorId" DROP NOT NULL;
        RAISE NOTICE 'supervisorId made nullable in orders';
    END IF;
END $$;

-- Create order_items table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
        CREATE TABLE "order_items" (
            "id" TEXT NOT NULL,
            "orderId" TEXT NOT NULL,
            "menuItemId" TEXT NOT NULL,
            "quantity" INTEGER DEFAULT 1,
            CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
        );
        RAISE NOTICE 'Order items table created';
    END IF;
END $$;

-- Create bills table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
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
        
        CREATE UNIQUE INDEX IF NOT EXISTS "bills_orderId_key" ON "bills"("orderId");
        RAISE NOTICE 'Bills table created';
    END IF;
END $$;

-- =====================================================
-- 2. EXPENSES TABLE
-- =====================================================

-- Create expenses table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        CREATE TABLE "expenses" (
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
        RAISE NOTICE 'Expenses table created';
    END IF;
END $$;

-- Add missing columns to expenses if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'eventDate') THEN
        ALTER TABLE "expenses" ADD COLUMN "eventDate" TIMESTAMP(3);
        RAISE NOTICE 'eventDate column added to expenses';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'calculationDetails') THEN
        ALTER TABLE "expenses" ADD COLUMN "calculationDetails" JSONB;
        RAISE NOTICE 'calculationDetails column added to expenses';
    END IF;
END $$;

-- =====================================================
-- 3. USERS TABLE
-- =====================================================

-- Create users table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        CREATE TABLE "users" (
            "id" TEXT NOT NULL,
            "username" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "passwordHash" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT 'admin',
            "resetToken" TEXT,
            "resetTokenExpiry" TIMESTAMP(3),
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "users_pkey" PRIMARY KEY ("id")
        );
        
        CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
        CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
        RAISE NOTICE 'Users table created';
    END IF;
END $$;

-- Add role column to users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'admin';
        RAISE NOTICE 'role column added to users';
    END IF;
END $$;

-- =====================================================
-- 4. WORKFORCE TABLE
-- =====================================================

-- Create workforce table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workforce') THEN
        CREATE TABLE "workforce" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "role" TEXT NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "workforce_pkey" PRIMARY KEY ("id")
        );
        RAISE NOTICE 'Workforce table created';
    END IF;
END $$;

-- =====================================================
-- 5. STOCK MANAGEMENT TABLES
-- =====================================================

-- Create stock table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock') THEN
        CREATE TABLE "stock" (
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
        RAISE NOTICE 'Stock table created';
    END IF;
END $$;

-- Create stock_transactions table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_transactions') THEN
        CREATE TABLE "stock_transactions" (
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
        RAISE NOTICE 'Stock transactions table created';
    END IF;
END $$;

-- =====================================================
-- 6. INVENTORY TABLE
-- =====================================================

-- Create inventory table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory') THEN
        CREATE TABLE "inventory" (
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
        RAISE NOTICE 'Inventory table created';
    END IF;
END $$;

-- =====================================================
-- 7. FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign keys if they don't exist
DO $$
BEGIN
    -- Orders -> Customers
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_customerId_fkey') THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" 
            FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key orders_customerId_fkey created';
    END IF;
    
    -- Orders -> Supervisors
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_supervisorId_fkey') THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_supervisorId_fkey" 
            FOREIGN KEY ("supervisorId") REFERENCES "supervisors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key orders_supervisorId_fkey created';
    END IF;
    
    -- Order Items -> Orders
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_orderId_fkey') THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" 
            FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key order_items_orderId_fkey created';
    END IF;
    
    -- Order Items -> Menu Items
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_menuItemId_fkey') THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" 
            FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key order_items_menuItemId_fkey created';
    END IF;
    
    -- Bills -> Orders
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_orderId_fkey') THEN
        ALTER TABLE "bills" ADD CONSTRAINT "bills_orderId_fkey" 
            FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key bills_orderId_fkey created';
    END IF;
    
    -- Expenses -> Orders
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_orderId_fkey') THEN
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_orderId_fkey" 
            FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key expenses_orderId_fkey created';
    END IF;
    
    -- Stock Transactions -> Stock
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_transactions_stockId_fkey') THEN
        ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_stockId_fkey" 
            FOREIGN KEY ("stockId") REFERENCES "stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'Foreign key stock_transactions_stockId_fkey created';
    END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE!
-- All tables and columns have been created/updated
-- =====================================================
