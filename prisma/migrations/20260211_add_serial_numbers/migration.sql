-- Add serialNumber to Order table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='serialNumber') THEN
        ALTER TABLE "orders" ADD COLUMN "serialNumber" SERIAL;
    END IF;
END $$;

-- Add serialNumber to Bill table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bills' AND column_name='serialNumber') THEN
        ALTER TABLE "bills" ADD COLUMN "serialNumber" SERIAL;
    END IF;
END $$;

-- Create unique indexes (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "orders_serialNumber_key" ON "orders"("serialNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "bills_serialNumber_key" ON "bills"("serialNumber");

-- Update existing orders with sequential numbers (starting from 1)
DO $$
DECLARE
    r RECORD;
    counter INT := 1;
BEGIN
    FOR r IN SELECT id FROM "orders" ORDER BY "createdAt" ASC
    LOOP
        UPDATE "orders" SET "serialNumber" = counter WHERE id = r.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Update existing bills with sequential numbers (starting from 1)
DO $$
DECLARE
    r RECORD;
    counter INT := 1;
BEGIN
    FOR r IN SELECT id FROM "bills" ORDER BY "createdAt" ASC
    LOOP
        UPDATE "bills" SET "serialNumber" = counter WHERE id = r.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Make serialNumber NOT NULL
ALTER TABLE "orders" ALTER COLUMN "serialNumber" SET NOT NULL;
ALTER TABLE "bills" ALTER COLUMN "serialNumber" SET NOT NULL;
