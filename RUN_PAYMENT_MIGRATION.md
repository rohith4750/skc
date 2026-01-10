# Run Payment Tracking Migration

The error shows: **"The column `expenses.paidAmount` does not exist in the current database"**

You need to run the migration SQL file on your database.

## Option 1: Using psql (PostgreSQL Command Line)

1. **Open Command Prompt or PowerShell**
2. **Connect to your database:**
   ```bash
   psql -U your_username -d your_database_name
   ```
   
   Or if using default postgres user:
   ```bash
   psql -U postgres -d your_database_name
   ```

3. **Run the migration:**
   ```sql
   \i ADD_PAYMENT_TRACKING_MIGRATION.sql
   ```
   
   Or copy-paste the SQL directly:
   ```sql
   ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
   ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'pending';
   UPDATE "expenses" SET "paidAmount" = "amount", "paymentStatus" = CASE WHEN "amount" > 0 THEN 'paid' ELSE 'pending' END WHERE "paidAmount" = 0;
   ```

## Option 2: Using pgAdmin or Database GUI Tool

1. Open pgAdmin (or your database GUI tool)
2. Connect to your database
3. Open Query Tool
4. Copy the contents of `ADD_PAYMENT_TRACKING_MIGRATION.sql`
5. Paste and run the SQL

## Option 3: Using Prisma DB Push (Quick Fix)

```bash
npx prisma db push
```

This will push the schema changes directly to the database without creating a migration file.

## Option 4: Using Prisma Migrate (Recommended for Production)

1. Create a migration:
   ```bash
   npx prisma migrate dev --name add_payment_tracking
   ```

2. This will:
   - Create a migration file
   - Apply it to your database
   - Regenerate Prisma client

## After Running Migration

1. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## Verify Migration Worked

Run this SQL to check if columns exist:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name IN ('paidAmount', 'paymentStatus');
```

You should see both columns listed!
