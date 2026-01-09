# Troubleshooting "Failed to fetch menu items" Error

## The Error
You're getting: `{"error": "Failed to fetch menu items"}` from `/api/menu`

This means the API route is working, but the database query is failing.

---

## Step 1: Check Vercel Function Logs (Most Important!)

1. Go to **Vercel Dashboard**
2. Click on your project (`skc`)
3. Click on the **"Functions"** tab (or go to the latest deployment)
4. Click on the deployment that's live
5. Look for **"Function Logs"** or **"Runtime Logs"**
6. You should see the actual error message (not the generic one)

Common errors you might see:
- `Can't reach database server`
- `Environment variable not found: DATABASE_URL`
- `relation "menu_items" does not exist`
- `SSL connection required`

---

## Step 2: Verify DATABASE_URL Environment Variable

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Check if `DATABASE_URL` exists
3. Verify the value matches your Neon connection string exactly:
   ```
   postgresql://neondb_owner:npg_Y6eLED4VRvpG@ep-snowy-poetry-ahipvo5m-pooler.c-3.us-east-1.aws.neon.tech/skc?sslmode=require&channel_binding=require
   ```
4. Make sure it's enabled for **Production** environment
5. **Important**: After adding/changing environment variables, you MUST redeploy!

---

## Step 3: Redeploy After Setting Environment Variables

After adding/changing `DATABASE_URL`:

1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger a new deployment

**Environment variables only take effect on NEW deployments!**

---

## Step 4: Verify Database Tables Exist

Run this in Neon SQL Editor to check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('customers', 'menu_items', 'supervisors', 'orders', 'order_items', 'bills')
ORDER BY table_name;
```

You should see all 6 tables listed.

---

## Step 5: Test Database Connection

In Neon SQL Editor, try running:

```sql
SELECT COUNT(*) FROM menu_items;
```

If this works, your database connection is fine and tables exist.

---

## Common Issues & Solutions

### Issue 1: DATABASE_URL Not Set
**Solution**: Add it in Vercel → Settings → Environment Variables, then redeploy

### Issue 2: Wrong Connection String Format
**Solution**: Make sure it includes `?sslmode=require` at the end

### Issue 3: Database Connection Timeout
**Solution**: 
- Check if Neon project is active (not paused)
- Verify the connection string is correct
- Try using the direct connection string instead of pooler (remove `-pooler` from the hostname)

### Issue 4: Tables Don't Exist
**Solution**: Run the migration SQL in Neon SQL Editor (see `RUN_MIGRATIONS_NEON.md`)

### Issue 5: SSL Connection Required
**Solution**: Make sure connection string includes `?sslmode=require`

---

## Quick Checklist

- [ ] DATABASE_URL environment variable is set in Vercel
- [ ] Environment variable is enabled for Production
- [ ] Redeployed after setting environment variable
- [ ] Database tables exist (check in Neon)
- [ ] Connection string includes `?sslmode=require`
- [ ] Checked Vercel function logs for actual error

---

## Still Not Working?

Share the error message from Vercel Function Logs, and we can troubleshoot further!
