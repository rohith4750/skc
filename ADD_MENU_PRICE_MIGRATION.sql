-- Migration to add price and unit columns to menu_items table

ALTER TABLE "menu_items" ADD COLUMN "price" DECIMAL(10, 2);
ALTER TABLE "menu_items" ADD COLUMN "unit" TEXT;
