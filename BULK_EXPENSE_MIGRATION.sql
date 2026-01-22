-- Bulk Expense Allocation Migration
-- Run this migration on your production database to add bulk expense support
-- Date: 2026-01-22

-- Add bulk expense fields to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS "isBulkExpense" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "bulkAllocations" JSONB,
ADD COLUMN IF NOT EXISTS "allocationMethod" VARCHAR(50);

-- Add index for efficient bulk expense queries
CREATE INDEX IF NOT EXISTS idx_expenses_is_bulk ON expenses("isBulkExpense") WHERE "isBulkExpense" = true;

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
    AND column_name IN ('isBulkExpense', 'bulkAllocations', 'allocationMethod');

-- Example: Check if columns were added successfully
-- This should return 3 rows if migration was successful

/*
========================================
USAGE NOTES:
========================================

1. isBulkExpense (Boolean):
   - true: This expense covers multiple events
   - false: Regular single-event expense

2. bulkAllocations (JSONB Array):
   Store allocation details for each event:
   [
     {
       "orderId": "uuid-of-order-1",
       "orderName": "Customer Name - Event Name (Date)",
       "amount": 200.00,
       "percentage": 40,
       "plates": 100
     },
     {
       "orderId": "uuid-of-order-2",
       "orderName": "Customer Name - Event Name (Date)",
       "amount": 300.00,
       "percentage": 60,
       "plates": 150
     }
   ]

3. allocationMethod (VARCHAR):
   - 'equal': Split amount equally among events
   - 'manual': User specified exact amounts
   - 'by-plates': Proportional to number of plates/members
   - 'by-percentage': User specified percentages

========================================
EXAMPLE QUERIES:
========================================

-- Find all bulk expenses
SELECT * FROM expenses WHERE "isBulkExpense" = true;

-- Find bulk expenses for a specific order
SELECT * FROM expenses 
WHERE "isBulkExpense" = true 
  AND "bulkAllocations" @> '[{"orderId": "your-order-uuid"}]';

-- Get allocation amount for a specific order from bulk expenses
SELECT 
  e.id,
  e.category,
  e.recipient,
  e.amount as total_amount,
  alloc->>'amount' as allocated_amount,
  alloc->>'orderName' as event_name
FROM expenses e,
  jsonb_array_elements(e."bulkAllocations") as alloc
WHERE e."isBulkExpense" = true
  AND alloc->>'orderId' = 'your-order-uuid';

-- Calculate total expenses for an order (including bulk allocations)
WITH order_expenses AS (
  -- Direct expenses
  SELECT amount FROM expenses WHERE "orderId" = 'your-order-uuid'
  UNION ALL
  -- Bulk allocated expenses
  SELECT (alloc->>'amount')::numeric as amount
  FROM expenses e,
    jsonb_array_elements(e."bulkAllocations") as alloc
  WHERE e."isBulkExpense" = true
    AND alloc->>'orderId' = 'your-order-uuid'
)
SELECT SUM(amount) as total_expense FROM order_expenses;

*/

