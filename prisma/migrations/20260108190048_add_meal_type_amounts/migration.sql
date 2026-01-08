-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "mealTypeAmounts" JSONB,
ADD COLUMN     "stalls" JSONB;
