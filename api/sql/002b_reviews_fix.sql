-- ===========================================
-- REVIEWS FIX - Add missing columns
-- Run this in Supabase SQL Editor if you get 
-- "column product_reviews.is_featured does not exist" errors
-- ===========================================

DO $$ 
BEGIN
    -- Add is_active column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_reviews' AND column_name = 'is_active') THEN
        ALTER TABLE product_reviews ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column';
    END IF;
    
    -- Add is_featured column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_reviews' AND column_name = 'is_featured') THEN
        ALTER TABLE product_reviews ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_featured column';
    END IF;
    
    -- Add sort_order column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_reviews' AND column_name = 'sort_order') THEN
        ALTER TABLE product_reviews ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added sort_order column';
    END IF;

    -- Add is_approved column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_reviews' AND column_name = 'is_approved') THEN
        ALTER TABLE product_reviews ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_approved column';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_active ON product_reviews(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON product_reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(is_approved);

-- Enable RLS (safe to run multiple times)
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop and recreate clean RLS policies
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON product_reviews;
DROP POLICY IF EXISTS "Service role full access" ON product_reviews;
DROP POLICY IF EXISTS "Service role manages reviews" ON product_reviews;

CREATE POLICY "Anyone can view approved reviews" ON product_reviews
    FOR SELECT USING (is_approved = TRUE AND is_active = TRUE);

CREATE POLICY "Users can create reviews" ON product_reviews
    FOR INSERT WITH CHECK (TRUE);

-- Verify columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'product_reviews'
ORDER BY ordinal_position;

-- Force PostgREST to reload its schema cache so the new columns are immediately visible
-- Without this, you may get PGRST205 errors until the auto-refresh (every ~5 min)
NOTIFY pgrst, 'reload schema';
