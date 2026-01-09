# Deploy Expense Management System to Production

## ✅ Step 1: Code Already Pushed to GitHub
Your changes have been committed and pushed to GitHub. Vercel should automatically start building.

## 📋 Step 2: Apply Database Migrations in Neon

You need to run the SQL migration in your Neon database to add the expenses table and new fields.

### Quick Steps:

1. **Go to Neon Console**: https://console.neon.tech
2. **Select your project** (`skc`)
3. **Click "SQL Editor"** in the left sidebar
4. **Copy and paste the entire contents of `NEON_MIGRATION_EXPENSES.sql`**
5. **Click "Run"**

This will:
- Create the expenses table if it doesn't exist
- Add `eventDate` and `calculationDetails` columns
- Create necessary indexes
- Set up foreign key constraints

## 🔍 Step 3: Verify Database Schema

Run this query in Neon SQL Editor to verify:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;
```

You should see all 12 columns including `eventDate` and `calculationDetails`.

## 🚀 Step 4: Monitor Vercel Deployment

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Check the "Deployments" tab
4. The latest deployment should show "Building" or "Ready"
5. If it fails, check the build logs

## ✅ Step 5: Verify Environment Variables

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Verify `DATABASE_URL` is set correctly (your Neon connection string)

## 🧪 Step 6: Test the Deployment

Once deployed, visit your site and:

1. **Navigate to Expenses page** (new menu item in sidebar)
2. **Test adding expenses**:
   - ✅ Chef expense (try both "Plate-wise" and "Total Amount")
   - ✅ Supervisor expense (event amount)
   - ✅ Labours expense (with event date, number of labours, amount per labour)
   - ✅ Boys expense (with event date, number of boys, payment per boy)
   - ✅ Other categories (simple amount)

3. **Verify calculations**:
   - Plate-wise: Should show "X plates × ₹Y = ₹Z"
   - Labours: Should calculate "X labours × ₹Y = ₹Z"
   - Boys: Should calculate "X boys × ₹Y = ₹Z"

4. **Check filtering**:
   - Filter by Event/Order
   - Filter by Category
   - View expenses grouped by event

## 🔧 Troubleshooting

### Error: "expenses table doesn't exist"
- Run the `NEON_MIGRATION_EXPENSES.sql` script in Neon SQL Editor

### Error: "Column eventDate does not exist"
- Run the migration SQL to add the columns
- Check that you ran the complete migration script

### Error: "Cannot read property 'calculationDetails'"
- Verify the database migration was applied
- Check Vercel build logs for any errors
- Try redeploying if needed

### Vercel Build Fails
- Check build logs in Vercel dashboard
- Verify `DATABASE_URL` environment variable is set
- Ensure all dependencies are in `package.json`

## 📝 Migration Files Reference

- **`NEON_MIGRATION_EXPENSES.sql`** - Use this for Neon database (recommended)
- **`EXPENSE_MIGRATION.sql`** - Complete table creation (if table doesn't exist)
- **`EXPENSE_MIGRATION_UPDATE.sql`** - Updates only (if table exists)

## ✨ What's New

1. **Expenses Page** - New menu item in sidebar
2. **Category-specific calculations**:
   - Chef: Plate-wise or total
   - Supervisor: Event amount
   - Labours: Count × amount with event date
   - Boys: Count × amount with event date
3. **Event/Order linking** - Link expenses to specific events
4. **Filtering & grouping** - View expenses by event or category
5. **Summary cards** - Total expenses and category totals

## 🎉 Deployment Complete!

Once all steps are done, your expense management system will be live and ready to use!
