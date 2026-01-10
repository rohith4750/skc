# Payment Tracking Feature for Workforce

## Overview

This feature allows you to track payment status for each workforce member, showing whether payments have been made in full, partially, or are still pending.

## Database Changes

### New Fields Added to Expenses Table

1. **paidAmount** (Float, default: 0)
   - The actual amount paid for the expense
   - Can be less than or equal to the `amount` field
   - Used to track partial payments

2. **paymentStatus** (String, default: 'pending')
   - Status values: 'pending', 'partial', 'paid'
   - Automatically calculated based on paidAmount vs amount
   - 'pending': paidAmount = 0
   - 'partial': 0 < paidAmount < amount
   - 'paid': paidAmount >= amount

## How to Apply Database Migration

Run the migration SQL file to add the new fields:

```bash
# Option 1: Using Neon SQL Editor
1. Go to https://console.neon.tech
2. Select your project
3. Click "SQL Editor"
4. Copy and paste contents of ADD_PAYMENT_TRACKING_MIGRATION.sql
5. Click "Run"

# Option 2: Using Prisma (if using local database)
npx prisma migrate dev --name add_payment_tracking
```

## Features

### 1. Workforce Page Enhancements

The workforce page now shows:

- **Total / Paid Column**: 
  - Shows total amount expected
  - Shows total amount paid
  - Visual distinction between expected and paid amounts

- **Payment Status Column**:
  - Color-coded badges (Green=Paid, Yellow=Partial, Red=Pending)
  - Count of pending and partial expenses
  - Overall payment status for each member

- **Expense Details** (when expanded):
  - Payment status badge for each expense
  - Shows paid amount if different from total amount
  - Visual indicators for payment completion

### 2. API Updates

The expense API now:
- Automatically calculates payment status when creating/updating expenses
- Accepts `paidAmount` and `paymentStatus` fields
- Validates that paidAmount <= amount
- Sets default values if not provided (paidAmount = 0, paymentStatus = 'pending')

### 3. Payment Status Calculation

Payment status is automatically calculated:
- If paidAmount = 0 → 'pending'
- If 0 < paidAmount < amount → 'partial'
- If paidAmount >= amount → 'paid'

## Usage

### Creating Expenses

When creating a new expense:
- The expense is created with paidAmount = 0 and paymentStatus = 'pending'
- You can update it later to mark as paid or partial

### Updating Payment Status

To update payment status for an expense:

1. Edit the expense (via API or future UI)
2. Set `paidAmount` to the amount actually paid
3. The `paymentStatus` will be automatically calculated

Example API call:
```json
PUT /api/expenses/{id}
{
  "amount": 1000,
  "paidAmount": 500,
  "paymentStatus": "partial"  // Optional - will be calculated automatically
}
```

### Viewing Payment Status

1. Go to Workforce page
2. View the "Payment Status" column for each member
3. Expand a member's row to see individual expense payment statuses
4. Check the "Total / Paid" column to see payment breakdown

## Future Enhancements (Optional)

1. Add paidAmount and paymentStatus fields to expense create/edit forms
2. Add bulk payment status updates
3. Add payment history tracking
4. Add payment reminders/alerts for pending payments
5. Add payment date tracking (when payment was actually received)

## Notes

- Existing expenses will be updated to have paidAmount = amount and paymentStatus = 'paid' for backward compatibility
- Payment status is calculated automatically, but can also be set manually
- The system ensures paidAmount cannot exceed amount (enforced by database constraint)
