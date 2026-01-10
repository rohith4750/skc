-- =====================================================
-- CREATE ONLY MISSING TABLES AND COLUMNS
-- Safe to run - checks if things exist first
-- =====================================================

-- Check and create users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        CREATE TABLE "users" (
            "id" TEXT NOT NULL,
            "username" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "passwordHash" TEXT NOT NULL,
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
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;
END $$;

-- Add role column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'admin';
        RAISE NOTICE 'Role column added to users table';
    ELSE
        RAISE NOTICE 'Role column already exists in users table';
    END IF;
END $$;

-- Check and create workforce table if it doesn't exist
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
    ELSE
        RAISE NOTICE 'Workforce table already exists';
    END IF;
END $$;

-- Add Telugu columns to menu_items if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items' 
        AND column_name = 'nameTelugu'
    ) THEN
        ALTER TABLE "menu_items" ADD COLUMN "nameTelugu" TEXT;
        RAISE NOTICE 'nameTelugu column added to menu_items';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items' 
        AND column_name = 'descriptionTelugu'
    ) THEN
        ALTER TABLE "menu_items" ADD COLUMN "descriptionTelugu" TEXT;
        RAISE NOTICE 'descriptionTelugu column added to menu_items';
    END IF;
END $$;

-- Add columns to orders table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'discount'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
        RAISE NOTICE 'discount column added to orders';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'mealTypeAmounts'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "mealTypeAmounts" JSONB;
        RAISE NOTICE 'mealTypeAmounts column added to orders';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'stalls'
    ) THEN
        ALTER TABLE "orders" ADD COLUMN "stalls" JSONB;
        RAISE NOTICE 'stalls column added to orders';
    END IF;
END $$;

-- Make supervisorId nullable in orders if it's not already
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'supervisorId'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_supervisorId_fkey";
        ALTER TABLE "orders" ALTER COLUMN "supervisorId" DROP NOT NULL;
        ALTER TABLE "orders" ADD CONSTRAINT "orders_supervisorId_fkey" 
            FOREIGN KEY ("supervisorId") REFERENCES "supervisors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'supervisorId made nullable in orders';
    END IF;
END $$;

-- Check and create expenses table if it doesn't exist
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
            "notes" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
        );

        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_orderId_fkey" 
            FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Expenses table created';
    ELSE
        RAISE NOTICE 'Expenses table already exists';
    END IF;
END $$;

-- Add expense calculation columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'calculationDetails'
    ) THEN
        ALTER TABLE "expenses" ADD COLUMN "calculationDetails" JSONB;
        RAISE NOTICE 'calculationDetails column added to expenses';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'eventDate'
    ) THEN
        ALTER TABLE "expenses" ADD COLUMN "eventDate" TIMESTAMP(3);
        RAISE NOTICE 'eventDate column added to expenses';
    END IF;
END $$;

-- =====================================================
-- DONE! All missing tables and columns have been created
-- =====================================================
