-- ===========================================
-- PRODUCT REVIEWS - COMPLETE TABLE WITH UPDATES
-- Run this in Supabase SQL Editor
-- ===========================================

-- Create the product_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns if table already exists (will be ignored if column exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'is_active') THEN
        ALTER TABLE product_reviews ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'is_featured') THEN
        ALTER TABLE product_reviews ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'sort_order') THEN
        ALTER TABLE product_reviews ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_active ON product_reviews(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON product_reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON product_reviews(rating);

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop if exists to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON product_reviews;
DROP POLICY IF EXISTS "Service role full access" ON product_reviews;
DROP POLICY IF EXISTS "Service role manages reviews" ON product_reviews;

-- Public can view approved+active reviews
CREATE POLICY "Anyone can view approved reviews" ON product_reviews
    FOR SELECT USING (is_approved = TRUE AND is_active = TRUE);

-- Anyone can submit a review
CREATE POLICY "Users can create reviews" ON product_reviews
    FOR INSERT WITH CHECK (TRUE);

-- Note: The backend uses service_role key which bypasses RLS for admin operations.
