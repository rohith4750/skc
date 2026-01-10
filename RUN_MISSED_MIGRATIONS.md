# Run Missed Migrations in Production

This guide will help you run the missed migrations in your production database.

## 📋 Missing Migrations

The following migrations need to be applied to your production database:

1. **Payment Tracking for Expenses** - Adds `paidAmount` and `paymentStatus` fields
2. **Stock Management** - Creates `stock_items` and `stock_transactions` tables
3. **Inventory Management** - Creates `inventory_items` table

## 🚀 Quick Method: Run All Migrations at Once

### Step 1: Go to Neon SQL Editor

1. Visit https://console.neon.tech
2. Select your `skc` project
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Run the Migration SQL

1. Open the file: `ALL_MISSED_MIGRATIONS_PRODUCTION.sql`
2. Copy the entire contents
3. Paste into Neon SQL Editor
4. Click **"Run"**

This will apply all missing migrations at once.

---

## 🔧 Alternative: Run Migrations Separately

If you prefer to run migrations one at a time, you can use the individual files:

### Option 1: Payment Tracking Only

Run `MISSED_MIGRATIONS_PRODUCTION.sql` for just the payment tracking migration.

### Option 2: Using Prisma Migrate (Recommended for Future)

If you want to use Prisma migrations in the future:

```bash
# Set your production database URL
$env:DATABASE_URL="your-production-database-url"

# Create migration files (if they don't exist)
npx prisma migrate dev --create-only --name add_payment_tracking
npx prisma migrate dev --create-only --name add_stock_management
npx prisma migrate dev --create-only --name add_inventory_management

# Then deploy to production
npx prisma migrate deploy
```

---

## ✅ Verification

After running the migrations, verify they were applied:

### Check Tables

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stock_items', 'stock_transactions', 'inventory_items')
ORDER BY table_name;
```

### Check Expense Columns

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name IN ('paidAmount', 'paymentStatus');
```

### Check Constraints

```sql
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints 
WHERE table_name IN ('expenses', 'stock', 'stock_transactions', 'inventory')
ORDER BY table_name, constraint_name;
```

---

## ⚠️ Important Notes

1. **Backup First**: If possible, back up your database before running migrations
2. **Safe Operations**: All migrations use `IF NOT EXISTS` clauses to prevent errors if already applied
3. **Data Preservation**: These migrations will NOT delete or modify existing data
4. **Existing Expenses**: The payment tracking migration will set all existing expenses to "paid" status (paidAmount = amount)

---

## 🐛 Troubleshooting

### Error: "column already exists"
- This means the migration was already applied
- You can safely skip that part or comment it out
- Check if the column exists using the verification queries

### Error: "table already exists"
- This means the table was already created
- The `IF NOT EXISTS` clause should prevent this, but if you see it, the table is already there
- Continue with the rest of the migration

### Error: "constraint already exists"
- The constraint is already in place
- You can safely skip that part
- Check constraints using the verification query

---

## 📝 Summary

**Files to Use:**
- `ALL_MISSED_MIGRATIONS_PRODUCTION.sql` - All migrations in one file (recommended)
- `MISSED_MIGRATIONS_PRODUCTION.sql` - Payment tracking only

**What Gets Created:**
- ✅ `paidAmount` and `paymentStatus` columns in `expenses` table
- ✅ `stock` table
- ✅ `stock_transactions` table with foreign keys
- ✅ `inventory` table
- ✅ All necessary constraints

**Time Required:** ~1-2 minutes to run all migrations

---

## ✅ After Running Migrations

1. **Verify**: Run the verification queries above
2. **Test**: Test your application to ensure everything works
3. **Check Logs**: Monitor application logs for any errors
4. **Update Prisma Client**: Run `npx prisma generate` locally (already done if using db push)

Your production database will now be up to date! 🎉
