# Sync Telugu Translations to Production Database

## Problem
- Local database has Telugu translations (nameTelugu, descriptionTelugu)
- Production database has NULL values for Telugu fields
- Need to update production with Telugu translations

## Solution Options

### Option 1: Export from Local and Import to Production (Recommended)

1. **Export data from Local Database:**
```bash
# Connect to local database and export menu items with Telugu data
npx prisma studio
# Or use a SQL query to export
```

2. **Create a SQL update script from local data:**
```sql
-- Example SQL updates (replace with actual IDs and Telugu values from local DB)
UPDATE "MenuItem" SET "nameTelugu" = 'గోబీ 65' WHERE "name" = 'Gobi 65';
UPDATE "MenuItem" SET "nameTelugu" = 'చింతకాయ కొబ్బరి' WHERE "name" = 'Chinthakaaya Kobbarri';
UPDATE "MenuItem" SET "descriptionTelugu" = 'ఫ్రై (ఏదైనా ఒకటి)' WHERE "description" = 'FRY (Any One)';
-- Add all updates here
```

3. **Run the script on Production:**
   - Connect to production database
   - Execute the SQL updates

### Option 2: Use Prisma Studio Directly

1. **Connect to Production Database:**
   - Update `.env` or `.env.production` with production DATABASE_URL
   - Run: `npx prisma studio`
   - Navigate to MenuItem table

2. **Manually Update:**
   - For each menu item, copy Telugu values from local database
   - Paste into production database fields

### Option 3: Create a Migration Script

Create a TypeScript script that:
1. Reads from local database
2. Updates production database with Telugu values

### Option 4: Database Dump and Restore (if safe)

```bash
# Export menu items from local
pg_dump -t "MenuItem" local_database > menu_items.sql

# Import to production (be careful - this will overwrite!)
# Only import the Telugu columns, or merge data
```

## Quick SQL Template

```sql
-- Update Telugu names (replace with actual values)
UPDATE "MenuItem" SET 
  "nameTelugu" = CASE "name"
    WHEN 'Gobi 65' THEN 'గోబీ 65'
    WHEN 'Chinthakaaya Kobbarri' THEN 'చింతకాయ కొబ్బరి'
    WHEN 'Rumali Roti' THEN 'రుమాలి రొట్టి'
    -- Add all mappings here
    ELSE "nameTelugu"
  END,
  "descriptionTelugu" = CASE "description"
    WHEN 'FRY (Any One)' THEN 'ఫ్రై (ఏదైనా ఒకటి)'
    WHEN 'CHUTNEYS (Any One)' THEN 'చట్నీలు (ఏవైనా రెండు)'
    -- Add all mappings here
    ELSE "descriptionTelugu"
  END;
```
