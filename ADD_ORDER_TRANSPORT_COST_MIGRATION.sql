-- Migration: Add transportCost to orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "transportCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

