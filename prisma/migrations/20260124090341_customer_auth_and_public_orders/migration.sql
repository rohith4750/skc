-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('EVENT', 'LUNCH_PACK');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('ADMIN', 'CUSTOMER');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "city" TEXT,
ADD COLUMN     "customerContactEmail" TEXT,
ADD COLUMN     "customerContactName" TEXT,
ADD COLUMN     "customerContactPhone" TEXT,
ADD COLUMN     "eventDate" TIMESTAMP(3),
ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "internalNote" TEXT,
ADD COLUMN     "menuPackage" TEXT,
ADD COLUMN     "orderSource" "OrderSource" DEFAULT 'ADMIN',
ADD COLUMN     "orderType" "OrderType" DEFAULT 'EVENT',
ADD COLUMN     "sourceDomain" TEXT,
ADD COLUMN     "specialRequests" TEXT,
ADD COLUMN     "timeSlot" TEXT,
ADD COLUMN     "venue" TEXT,
ADD COLUMN     "venueAddress" TEXT,
ADD COLUMN     "venueType" TEXT;

-- CreateTable
CREATE TABLE "CustomerUser" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "CustomerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_otps" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "source" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_sessions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "customer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerUser_customerId_key" ON "CustomerUser"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerUser_phone_key" ON "CustomerUser"("phone");

-- CreateIndex
CREATE INDEX "customer_otps_phone_code_idx" ON "customer_otps"("phone", "code");

-- CreateIndex
CREATE INDEX "customer_otps_phone_createdAt_idx" ON "customer_otps"("phone", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "customer_sessions_token_key" ON "customer_sessions"("token");

-- AddForeignKey
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
