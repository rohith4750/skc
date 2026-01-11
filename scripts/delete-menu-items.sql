-- =====================================================
-- SQL Commands to Delete Menu Items
-- =====================================================
-- WARNING: This will delete menu items from your database
-- Make sure you have a backup before running these commands!
-- =====================================================

-- =====================================================
-- OPTION 1: Delete ALL Menu Items (Recommended if you want to start fresh)
-- =====================================================

-- Step 1: First, delete all order items that reference menu items
-- (This is necessary due to foreign key constraints)
DELETE FROM "order_items";

-- Step 2: Now delete all menu items
DELETE FROM "menu_items";

-- =====================================================
-- OPTION 2: Delete Menu Items but Keep Order Items
-- (This will fail if foreign key constraints prevent it)
-- =====================================================

-- If you want to keep order_items but remove menu items,
-- you'll need to either:
-- 1. Make the foreign key nullable (not recommended)
-- 2. Delete order_items first (Option 1 above)

-- =====================================================
-- OPTION 3: Delete Specific Menu Items Only
-- =====================================================

-- Delete menu items by type
-- DELETE FROM "menu_items" WHERE type = 'breakfast';
-- DELETE FROM "menu_items" WHERE type = 'lunch';
-- DELETE FROM "menu_items" WHERE type = 'dinner';
-- DELETE FROM "menu_items" WHERE type = 'snacks';
-- DELETE FROM "menu_items" WHERE type = 'sweets';

-- Delete menu items by name
-- DELETE FROM "menu_items" WHERE name = 'Gobi 65';
-- DELETE FROM "menu_items" WHERE name LIKE 'Gobi%';

-- Delete inactive menu items only
-- DELETE FROM "menu_items" WHERE "isActive" = false;

-- =====================================================
-- OPTION 4: Delete Menu Items with Telugu Fields Empty
-- =====================================================

-- Delete menu items that don't have Telugu translations
-- DELETE FROM "order_items" WHERE "menuItemId" IN (
--   SELECT id FROM "menu_items" WHERE "nameTelugu" IS NULL
-- );
-- DELETE FROM "menu_items" WHERE "nameTelugu" IS NULL;

-- =====================================================
-- OPTION 5: Reset Auto-increment/Sequences (if using)
-- =====================================================

-- Note: PostgreSQL with UUID doesn't use sequences, but if you're using
-- auto-increment IDs, you might want to reset sequences after deletion:
-- ALTER SEQUENCE menu_items_id_seq RESTART WITH 1;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check how many menu items exist
-- SELECT COUNT(*) FROM "menu_items";

-- Check how many order items exist (before deletion)
-- SELECT COUNT(*) FROM "order_items";

-- List all menu items
-- SELECT id, name, type FROM "menu_items" ORDER BY type, name;

-- =====================================================
-- COMPLETE RESET (Delete Everything Related)
-- =====================================================

-- If you want to completely reset and start fresh:
-- 1. Delete order items
-- DELETE FROM "order_items";
-- 
-- 2. Delete menu items
-- DELETE FROM "menu_items";
-- 
-- 3. Delete orders (if you want)
-- DELETE FROM "orders";
-- 
-- 4. Delete bills (if you want)
-- DELETE FROM "bills";

-- =====================================================
-- SAFE DELETE (With Transaction - Rollback if error)
-- =====================================================

-- Use transaction to safely delete (you can rollback if something goes wrong)
-- BEGIN;
-- 
-- DELETE FROM "order_items";
-- DELETE FROM "menu_items";
-- 
-- -- Check the results
-- SELECT COUNT(*) FROM "menu_items";
-- 
-- -- If everything looks good, commit:
-- COMMIT;
-- 
-- -- If something went wrong, rollback:
-- -- ROLLBACK;
