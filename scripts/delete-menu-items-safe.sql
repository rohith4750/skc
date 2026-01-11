-- =====================================================
-- SAFE SQL Commands to Delete Menu Items
-- Must delete order_items FIRST to avoid foreign key constraint error
-- =====================================================

-- =====================================================
-- OPTION 1: Delete ALL Menu Items (Recommended)
-- =====================================================

-- Step 1: Delete all order_items FIRST (this removes the foreign key references)
DELETE FROM "order_items";

-- Step 2: Now you can safely delete all menu items
DELETE FROM "menu_items";

-- =====================================================
-- OPTION 2: Using Transaction (Safe - Can Rollback)
-- =====================================================

BEGIN;

-- Delete order_items first
DELETE FROM "order_items";

-- Then delete menu_items
DELETE FROM "menu_items";

-- Verify the deletion
SELECT COUNT(*) as remaining_menu_items FROM "menu_items";
SELECT COUNT(*) as remaining_order_items FROM "order_items";

-- If everything looks good, commit the transaction
COMMIT;

-- If something went wrong, you can rollback:
-- ROLLBACK;

-- =====================================================
-- OPTION 3: Delete Only Order Items (Keep Menu Items)
-- =====================================================

-- If you only want to clear order items but keep menu items:
-- DELETE FROM "order_items";

-- =====================================================
-- VERIFICATION QUERIES (Run Before Deletion)
-- =====================================================

-- Check how many order items reference menu items
SELECT COUNT(*) as order_items_count FROM "order_items";

-- Check how many menu items exist
SELECT COUNT(*) as menu_items_count FROM "menu_items";

-- See which menu items are referenced in orders
SELECT DISTINCT mi.id, mi.name, COUNT(oi.id) as order_count
FROM "menu_items" mi
LEFT JOIN "order_items" oi ON mi.id = oi."menuItemId"
GROUP BY mi.id, mi.name
ORDER BY order_count DESC;
