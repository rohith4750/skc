# Fix Migration Issues - Step by Step Guide

## Problem
The migration `20260124160830_customer_auth_and_public_orders` failed because it tried to drop a table `CustomerUser` that doesn't exist, blocking all new migrations.

## Solution Applied
✅ Fixed the migration to use `DROP TABLE IF EXISTS` instead of `DROP TABLE`
✅ Made the serial number migration idempotent (safe to run multiple times)

## Steps to Resolve

### Option 1: Mark Failed Migration as Resolved (Recommended)

```bash
# Step 1: Mark the failed migration as resolved
npx prisma migrate resolve --applied 20260124160830_customer_auth_and_public_orders

# Step 2: Apply pending migrations
npx prisma migrate deploy

# Step 3: Regenerate Prisma Client
npx prisma generate
```

### Option 2: Reset and Re-apply All Migrations (If Option 1 doesn't work)

⚠️ **WARNING:** This will drop all data! Only use in development.

```bash
# Reset database and apply all migrations
npx prisma migrate reset

# Regenerate Prisma Client
npx prisma generate
```

### Option 3: Manual Database Fix (Production Safe)

If you're on production and can't reset:

```bash
# Step 1: Manually mark the migration as applied in the database
npx prisma migrate resolve --applied 20260124160830_customer_auth_and_public_orders

# Step 2: Deploy remaining migrations
npx prisma migrate deploy

# Step 3: Regenerate client
npx prisma generate
```

## What Was Fixed

### 1. Fixed CustomerUser Migration
**File:** `prisma/migrations/20260124160830_customer_auth_and_public_orders/migration.sql`

**Before:**
```sql
DROP TABLE "CustomerUser";
```

**After:**
```sql
DROP TABLE IF EXISTS "CustomerUser";
```

### 2. Made Serial Number Migration Idempotent
**File:** `prisma/migrations/20260211_add_serial_numbers/migration.sql`

Now checks if columns exist before adding them:
```sql
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='serialNumber') THEN
        ALTER TABLE "orders" ADD COLUMN "serialNumber" SERIAL;
    END IF;
END $$;
```

## Expected Result

After running the commands, you should see:

```
✅ Migration 20260124160830_customer_auth_and_public_orders marked as applied
✅ Applying migration 20260211_add_serial_numbers
✅ All migrations successfully applied
```

## Verify Success

```bash
# Check migration status
npx prisma migrate status

# Should show all migrations as applied
```

## If Still Having Issues

### Check if table exists:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'customer_users';
```

### Check serialNumber columns:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name IN ('orders', 'bills') 
AND column_name = 'serialNumber';
```

## Next Steps After Success

1. ✅ Commit the migration fixes
2. ✅ Push to GitHub
3. ✅ Deploy to Vercel
4. ✅ Test Bill/Order number generation

---

**Created:** February 11, 2026  
**Status:** Ready to apply
