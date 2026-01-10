-- =====================================================
-- ALL MIGRATIONS FOR NEON DATABASE
-- Copy and paste this entire file into Neon SQL Editor
-- =====================================================

-- Migration 1: Initial Schema
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

CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supervisors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cateringServiceName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "supervisors_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

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

CREATE UNIQUE INDEX "bills_orderId_key" ON "bills"("orderId");

ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "supervisors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bills" ADD CONSTRAINT "bills_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migration 2: Add meal type amounts
ALTER TABLE "orders" ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "mealTypeAmounts" JSONB;
ALTER TABLE "orders" ADD COLUMN "stalls" JSONB;

-- Migration 3: Add expenses table
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

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migration 4: Add expense calculation fields
ALTER TABLE "expenses" ADD COLUMN "calculationDetails" JSONB;
ALTER TABLE "expenses" ADD COLUMN "eventDate" TIMESTAMP(3);

-- Migration 5: Make supervisor optional
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_supervisorId_fkey";
ALTER TABLE "orders" ALTER COLUMN "supervisorId" DROP NOT NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "supervisors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migration 6: Add Telugu fields
ALTER TABLE "menu_items" ADD COLUMN "descriptionTelugu" TEXT;
ALTER TABLE "menu_items" ADD COLUMN "nameTelugu" TEXT;

-- Migration 7: Add users table
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

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Migration 8: Add user role
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'admin';

-- Migration 9: Add workforce table
CREATE TABLE "workforce" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workforce_pkey" PRIMARY KEY ("id")
);
