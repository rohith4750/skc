/*
  Warnings:

  - You are about to alter the column `totalAmount` on the `bills` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `advancePaid` on the `bills` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `remainingAmount` on the `bills` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `paidAmount` on the `bills` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - The `status` column on the `bills` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `amount` on the `expenses` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `paidAmount` on the `expenses` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - The `paymentStatus` column on the `expenses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `condition` column on the `inventory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `purchasePrice` on the `inventory` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `totalAmount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `advancePaid` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `remainingAmount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - The `status` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `discount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `transportCost` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `currentStock` on the `stock` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `minStock` on the `stock` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `maxStock` on the `stock` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `stock` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `quantity` on the `stock_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `stock_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `totalAmount` on the `stock_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `CustomerUser` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `type` on the `stock_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'partial', 'paid');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'super_admin');

-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('in', 'out');

-- CreateEnum
CREATE TYPE "InventoryCondition" AS ENUM ('good', 'fair', 'damaged', 'repair');

-- DropForeignKey
ALTER TABLE "bills" DROP CONSTRAINT "bills_orderId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customerId_fkey";

-- AlterTable
ALTER TABLE "bills" ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "advancePaid" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "remainingAmount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "inventory" DROP COLUMN "condition",
ADD COLUMN     "condition" "InventoryCondition" NOT NULL DEFAULT 'good',
ALTER COLUMN "purchasePrice" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "mealType" TEXT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "advancePaid" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "remainingAmount" SET DATA TYPE DECIMAL(10,2),
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'pending',
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "transportCost" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "stock" ALTER COLUMN "currentStock" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "minStock" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "maxStock" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "stock_transactions" DROP COLUMN "type",
ADD COLUMN     "type" "StockTransactionType" NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'admin';

-- DropTable
DROP TABLE "CustomerUser";

-- CreateTable
CREATE TABLE "customer_users" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_users_customerId_key" ON "customer_users"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_users_phone_key" ON "customer_users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customer_users_email_key" ON "customer_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_users_username_key" ON "customer_users"("username");

-- AddForeignKey
ALTER TABLE "customer_users" ADD CONSTRAINT "customer_users_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
