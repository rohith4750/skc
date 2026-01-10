# Run Migrations on Neon Database

This guide will help you run all database migrations on your Neon production database.

---

## 🚀 Quick Method: Using Prisma Migrate Deploy (Recommended)

### Step 1: Set Your Neon Database URL

**Option A: Using PowerShell (Windows)**
```powershell
# Set the DATABASE_URL environment variable for this session
$env:DATABASE_URL="postgresql://neondb_owner:npg_Y6eLED4VRvpG@ep-snowy-poetry-ahipvo5m-pooler.c-3.us-east-1.aws.neon.tech/skc?sslmode=require&channel_binding=require"
```

**Option B: Create/Update .env file**
Create a `.env` file in your project root (or update existing one):
```env
DATABASE_URL=postgresql://neondb_owner:npg_Y6eLED4VRvpG@ep-snowy-poetry-ahipvo5m-pooler.c-3.us-east-1.aws.neon.tech/skc?sslmode=require&channel_binding=require
```

### Step 2: Run Migrations

Open terminal in your project directory and run:

```bash
npx prisma migrate deploy
```

This will:
- ✅ Check which migrations have been applied
- ✅ Apply all pending migrations in order
- ✅ Update the `_prisma_migrations` table
- ✅ Create/update all tables and schema

---

## 📋 Migrations That Will Be Applied

The following 10 migrations will be applied (if not already applied):

1. **20260108164022_init** - Initial schema (customers, menu_items, supervisors, orders, order_items, bills)
2. **20260108190048_add_meal_type_amounts** - Add meal type amounts and stalls to orders
3. **20260109083148_add_expense_fields** - Add expense fields
4. **20260109083310_add_expense_calculation_fields** - Add expense calculation fields
5. **20260109083433_add_expense_calculation_fields** - Update expense calculation fields
6. **20260109095232_make_supervisor_optional** - Make supervisor optional in orders
7. **20260109174729_add_telugu_fields** - Add Telugu fields to menu items
8. **20260109182740_add_user_model** - Add user model for authentication
9. **20260109203444_add_user_role** - Add role field to users
10. **20260109205009_add_workforce_model** - Add workforce model

---

## ✅ Verify Migrations Were Applied

After running migrations, verify they were applied:

**Option 1: Check in Neon SQL Editor**
1. Go to https://console.neon.tech
2. Select your `skc` project
3. Click "SQL Editor"
4. Run this query:
```sql
SELECT migration_name, finished_at 
FROM _prisma_migrations 
ORDER BY finished_at DESC;
```

You should see all 10 migrations listed.

**Option 2: Check Tables**
Run this query in Neon SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- bills
- customers
- expenses
- menu_items
- order_items
- orders
- supervisors
- users
- workforce
- _prisma_migrations

---

## 🔧 Alternative Method: Using Neon SQL Editor

If `prisma migrate deploy` doesn't work, you can run migrations manually:

### Step 1: Go to Neon SQL Editor
1. Visit https://console.neon.tech
2. Select your `skc` project
3. Click "SQL Editor" in the left sidebar

### Step 2: Run Each Migration SQL

You'll need to open each migration file from `prisma/migrations/` folder and run the SQL in order:

1. Open `prisma/migrations/20260108164022_init/migration.sql`
2. Copy all SQL
3. Paste into Neon SQL Editor
4. Click "Run"
5. Repeat for each migration in order

---

## ⚠️ Important Notes

1. **Backup First**: If you have data in your Neon database, consider backing it up before running migrations
2. **One-Time Operation**: `prisma migrate deploy` is idempotent - it only applies migrations that haven't been applied yet
3. **Production Safe**: This command is safe for production - it won't drop data or tables
4. **Connection String**: Make sure your connection string is correct and includes `?sslmode=require`

---

## 🐛 Troubleshooting

### Error: "Migration already applied"
- This is normal if you've run migrations before
- Prisma will skip already-applied migrations

### Error: "Connection timeout"
- Check your internet connection
- Verify the connection string is correct
- Try using the direct connection (without `-pooler`) in the connection string

### Error: "Table already exists"
- This might happen if tables were created manually
- You can either:
  - Drop the tables and run migrations fresh (⚠️ WARNING: This will delete data)
  - Or mark migrations as applied manually using `_prisma_migrations` table

### Error: "SSL connection required"
- Make sure your connection string includes `?sslmode=require`
- Neon requires SSL connections

---

## ✅ After Migrations

Once migrations are complete:

1. **Verify Tables**: Check that all tables exist (see verification section above)
2. **Test Your App**: Visit your Vercel deployment and test creating:
   - Customers
   - Menu items
   - Orders
   - Expenses
   - Users (if you have authentication)
   - Workforce members
3. **Check Logs**: Monitor your application logs for any database-related errors

---

## 📝 Complete Command (Copy-Paste Ready)

**For PowerShell:**
```powershell
cd d:\SKC\REACT
$env:DATABASE_URL="postgresql://neondb_owner:npg_Y6eLED4VRvpG@ep-snowy-poetry-ahipvo5m-pooler.c-3.us-east-1.aws.neon.tech/skc?sslmode=require&channel_binding=require"
npx prisma migrate deploy
```

**For Command Prompt (cmd):**
```cmd
cd d:\SKC\REACT
set DATABASE_URL=postgresql://neondb_owner:npg_Y6eLED4VRvpG@ep-snowy-poetry-ahipvo5m-pooler.c-3.us-east-1.aws.neon.tech/skc?sslmode=require&channel_binding=require
npx prisma migrate deploy
```

**For Bash/Linux/Mac:**
```bash
cd /path/to/your/project
export DATABASE_URL="postgresql://neondb_owner:npg_Y6eLED4VRvpG@ep-snowy-poetry-ahipvo5m-pooler.c-3.us-east-1.aws.neon.tech/skc?sslmode=require&channel_binding=require"
npx prisma migrate deploy
```

---

**That's it!** Your Neon database will now have all the latest schema changes. 🎉
