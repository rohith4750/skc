-- Migration: Add paymentHistory to bills
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "paymentHistory" JSONB;

