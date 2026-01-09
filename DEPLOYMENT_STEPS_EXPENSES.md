# Deployment Steps for Expense Management System

## Overview
This guide will help you deploy the updated application with the new expense management system to Vercel with Neon database.

## Prerequisites
- GitHub repository connected to Vercel
- Neon PostgreSQL database
- DATABASE_URL environment variable in Vercel

## Step 1: Apply Database Migrations in Neon

Since we've created new migrations locally, you need to apply them to your production Neon database:

1. **Go to Neon Console**: https://console.neon.tech
2. **Select your project** (skc)
3. **Click "SQL Editor"** in the left sidebar
4. **Run the following SQL** to update the expenses table:

```sql
-- Add eventDate and calculationDetails columns if they don't exist
ALTER TABLE "expenses" 
ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "calculationDetails" JSONB;
```

**OR** if the expenses table doesn't exist yet, run the complete migration from `EXPENSE_MIGRATION.sql`.

## Step 2: Verify Database Schema

Run this query to verify all columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;
```

You should see:
- id
- orderId
- category
- amount
- description
- recipient
- paymentDate
- eventDate
- notes
- calculationDetails
- createdAt
- updatedAt

## Step 3: Deploy to Vercel

### Option A: Automatic Deployment (if connected to GitHub)
1. Push your changes to GitHub (already done if you ran `git push`)
2. Vercel will automatically detect the push and start building
3. Monitor the deployment at: https://vercel.com/dashboard

### Option B: Manual Deployment
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Click "Deployments" tab
4. Click "Redeploy" on the latest deployment

## Step 4: Verify Environment Variables

Make sure these environment variables are set in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `DATABASE_URL` is set correctly (your Neon connection string)

## Step 5: Test the Deployment

1. Visit your deployed site
2. Navigate to the "Expenses" page
3. Try adding a new expense with:
   - Chef expense (plate-wise calculation)
   - Labours expense (with event date)
   - Boys expense (with event date)
   - Supervisor expense

## Troubleshooting

### Issue: Expenses page shows errors
- Check Vercel deployment logs for errors
- Verify database migrations were applied in Neon
- Check that DATABASE_URL is correctly set

### Issue: Calculations not working
- Verify the frontend code was deployed correctly
- Check browser console for JavaScript errors
- Verify the expense form fields are visible

### Issue: Database connection errors
- Verify DATABASE_URL in Vercel matches your Neon connection string
- Check Neon dashboard for connection status
- Ensure the connection string includes SSL mode

## Migration Files Reference

- **EXPENSE_MIGRATION.sql** - Complete expenses table creation (if table doesn't exist)
- **EXPENSE_MIGRATION_UPDATE.sql** - Updates to existing table (if table exists)
- **prisma/migrations/** - Prisma migration files (already applied locally)

## Post-Deployment Checklist

- [ ] Database migrations applied in Neon
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Environment variables verified
- [ ] Expenses page loads correctly
- [ ] Can add expenses with all category types
- [ ] Calculations work correctly (chef, labours, boys)
- [ ] Expenses are linked to orders/events correctly
