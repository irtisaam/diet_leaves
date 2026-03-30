-- ===========================================
-- COMPLETE MIGRATION - Run this in Supabase SQL Editor
-- This single file includes ALL missing schema changes:
-- 1. Review columns (is_featured, is_approved, is_active, sort_order)
-- 2. Inventory tables (inventory_categories, inventory_items, product_inventory_items)
-- 3. Schema cache reload notification
-- ===========================================

-- ===========================================
-- PART 1: REVIEW COLUMNS
-- ===========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_reviews' AND column_name = 'is_active') THEN
        ALTER TABLE product_reviews ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_reviews' AND column_name = 'is_featured') THEN
        ALTER TABLE product_reviews ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_reviews' AND column_name = 'sort_order') THEN
        ALTER TABLE product_reviews ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'product_reviews' AND column_name = 'is_approved') THEN
        ALTER TABLE product_reviews ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_active ON product_reviews(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_featured ON product_reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(is_approved);

-- ===========================================
-- PART 2: INVENTORY TABLES
-- ===========================================
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    unit_cost DECIMAL(12, 2) DEFAULT 0,
    quantity_available DECIMAL(12, 3) DEFAULT 0,
    quantity_in_use DECIMAL(12, 3) DEFAULT 0,
    quantity_consumed DECIMAL(12, 3) DEFAULT 0,
    min_stock_level DECIMAL(12, 3) DEFAULT 0,
    expiry_date DATE,
    description TEXT,
    supplier VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_per_unit DECIMAL(12, 3) NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, inventory_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry ON inventory_items(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_inventory_product ON product_inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_item ON product_inventory_items(inventory_item_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_inventory_categories_updated_at ON inventory_categories;
CREATE TRIGGER set_inventory_categories_updated_at
    BEFORE UPDATE ON inventory_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER set_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to inventory_categories" ON inventory_categories;
CREATE POLICY "Service role full access to inventory_categories" ON inventory_categories
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to inventory_items" ON inventory_items;
CREATE POLICY "Service role full access to inventory_items" ON inventory_items
    FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to product_inventory_items" ON product_inventory_items;
CREATE POLICY "Service role full access to product_inventory_items" ON product_inventory_items
    FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- PART 3: CREATE A HELPER FUNCTION FOR SCHEMA RELOAD
-- This function can be called via supabase.rpc('reload_schema')
-- ===========================================
CREATE OR REPLACE FUNCTION reload_schema()
RETURNS TEXT AS $$
BEGIN
    NOTIFY pgrst, 'reload schema';
    RETURN 'Schema reload notification sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION reload_schema() TO service_role;

-- ===========================================
-- PART 4: FORCE SCHEMA CACHE RELOAD
-- ===========================================
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
