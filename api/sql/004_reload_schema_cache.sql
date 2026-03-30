-- ===========================================
-- SCHEMA CACHE RELOAD
-- Run this AFTER running 002b_reviews_fix.sql
-- and 003_inventory.sql to force PostgREST to
-- see the new tables/columns immediately.
--
-- If this still doesn't work, go to:
--   Supabase Dashboard → Settings → API → 
--   click the "Reload" button at the top.
-- ===========================================

-- Method 1: NOTIFY command
NOTIFY pgrst, 'reload schema';

-- Method 2: pg_notify function (more reliable on some instances)
SELECT pg_notify('pgrst', 'reload schema');

-- Verify inventory tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('inventory_categories', 'inventory_items', 'product_inventory_items', 'order_inventory_usage')
ORDER BY table_name;

-- Verify review columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'product_reviews' 
  AND column_name IN ('is_featured', 'is_active', 'is_approved', 'sort_order')
ORDER BY column_name;
