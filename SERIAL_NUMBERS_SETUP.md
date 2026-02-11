# Serial Numbers Setup - Bill & Order IDs

## Overview

Updated the system to use human-readable serial numbers instead of UUIDs for Bill Numbers and Order IDs.

## Changes Made

### 1. **Database Schema Updates** (`prisma/schema.prisma`)

Added `serialNumber` field to both `Order` and `Bill` models:

```prisma
model Order {
  id              String     @id @default(uuid())
  serialNumber    Int        @unique @default(autoincrement())
  // ... rest of fields
}

model Bill {
  id              String   @id @default(uuid())
  serialNumber    Int      @unique @default(autoincrement())
  // ... rest of fields
}
```

### 2. **New Formats**

#### Bill Number Format:
- **Old:** `BILL-2498B9EC` (UUID-based)
- **New:** `SKC-1`, `SKC-2`, `SKC-3`, etc.

#### Order ID Format:
- **Old:** `#A3F45B21` (UUID-based)
- **New:** `SKC-ORDER-1`, `SKC-ORDER-111`, etc.

### 3. **Files Updated**

#### PDF Template (`lib/pdf-template.tsx`)
- ✅ Removed status badge from bill PDF
- ✅ Changed bill number format to `SKC-{serialNumber}`
- ✅ Updated bill display to show "Bill No: SKC-1"

#### Bills Page (`app/bills/page.tsx`)
- ✅ Updated to pass `serialNumber` instead of UUID for bill number

#### Orders History (`app/orders/history/page.tsx`)
- ✅ Updated Order ID display to `SKC-ORDER-{serialNumber}`
- ✅ Updated PDF filename to include new format

#### Order Summary (`app/orders/summary/[id]/page.tsx`)
- ✅ Updated Order ID display to `SKC-ORDER-{serialNumber}`

#### Financial Page (`app/orders/financial/[id]/page.tsx`)
- ✅ Updated Order ID display to `SKC-ORDER-{serialNumber}`

#### Types (`types/index.ts`)
- ✅ Added `serialNumber?: number` to Order interface
- ✅ Added `serialNumber?: number` to Bill interface

### 4. **Migration Created**

Location: `prisma/migrations/20260211_add_serial_numbers/migration.sql`

The migration:
- ✅ Adds `serialNumber` column to both tables
- ✅ Creates unique indexes
- ✅ Updates existing records with sequential numbers (starting from 1)
- ✅ Sets serial number sequences for future records

## How to Apply

### Step 1: Run the Migration

```bash
# Apply the migration
npx prisma migrate deploy

# Or if using Prisma Studio
npx prisma migrate dev
```

### Step 2: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 3: Deploy to Vercel

```bash
git add .
git commit -m "Add serial numbers for bills and orders"
git push origin main
```

## Benefits

1. ✅ **Human-Readable:** Easy to reference bills and orders
2. ✅ **Sequential:** Numbers increment automatically (1, 2, 3...)
3. ✅ **Professional:** SKC-1, SKC-ORDER-111 looks more professional
4. ✅ **No Duplicates:** Unique constraint ensures no conflicts
5. ✅ **Clean PDFs:** Removed status, cleaner bill format

## Examples

### Bill PDF Header:
```
Bill No: SKC-1
Date: 12 Feb 2026
```

### Order Display:
```
#SKC-ORDER-111
Premium Catering Event
```

### File Names:
- Bill PDF: `order-SKC-ORDER-111.pdf`
- Old format maintained as fallback for existing records

## Notes

- ✅ Existing orders/bills will be numbered starting from 1
- ✅ New orders/bills will auto-increment from the highest number
- ✅ UUID `id` field is still primary key (unchanged)
- ✅ `serialNumber` is only for display purposes
- ✅ Fallback to UUID if `serialNumber` is not available (backward compatibility)

## Testing

1. **Create a new order** - should get next serial number
2. **Generate bill PDF** - should show "SKC-X" format
3. **View order details** - should show "SKC-ORDER-X" format
4. **Check uniqueness** - each number should be unique

---

**Last Updated:** February 11, 2026  
**Status:** Ready to deploy
