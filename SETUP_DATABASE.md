# PostgreSQL Database Setup Guide

This guide will help you set up PostgreSQL database for the Catering Management System.

## Prerequisites

1. **PostgreSQL installed** on your system
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`

2. **Node.js and npm** installed (already done)

## Step 1: Create Database

1. Open PostgreSQL command line or pgAdmin
2. Create a new database:

```sql
CREATE DATABASE catering_db;
```

Or using command line:
```bash
createdb catering_db
```

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env` (if it doesn't exist)
2. Update the `DATABASE_URL` in `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/catering_db?schema=public"
```

Replace:
- `username` with your PostgreSQL username (default: `postgres`)
- `password` with your PostgreSQL password
- `localhost:5432` with your database host and port (if different)
- `catering_db` with your database name (if different)

## Step 3: Generate Prisma Client

Run this command to generate the Prisma Client:

```bash
npx prisma generate
```

## Step 4: Run Database Migrations

This will create all the tables in your database:

```bash
npx prisma migrate dev --name init
```

## Step 5: (Optional) Seed Menu Data

If you want to populate the menu items from the data file:

1. Create a seed script (see `prisma/seed.ts` - to be created)
2. Run: `npx prisma db seed`

Or manually add menu items through the application.

## Step 6: Verify Setup

1. Check if tables are created:
```bash
npx prisma studio
```

This opens Prisma Studio where you can view and edit your database.

2. Or check using PostgreSQL:
```sql
\dt
```

## Step 7: Update Application to Use API Routes

To switch from localStorage to PostgreSQL:

1. **Option A: Update imports** (Recommended for production)
   - Replace `import { Storage } from '@/lib/storage'` 
   - With `import { Storage } from '@/lib/storage-api'`
   - Update all Storage method calls to use `await` (they're async now)

2. **Option B: Keep localStorage for development**
   - Continue using `lib/storage.ts` for quick testing
   - Switch to `lib/storage-api.ts` when ready for production

## Troubleshooting

### Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in .env file
- Ensure database exists
- Verify username/password are correct

### Migration Errors
- Make sure database is empty or use `--force` flag
- Check Prisma schema syntax

### Port Already in Use
- Change PostgreSQL port or stop other services using port 5432

## Useful Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio (Database GUI)
npx prisma studio

# View database schema
npx prisma format
```
