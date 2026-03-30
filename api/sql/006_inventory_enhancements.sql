-- ===========================================
-- INVENTORY ENHANCEMENTS MIGRATION
-- Run this AFTER 005_complete_migration.sql
-- Adds: purchase_date, purchased_by to inventory_items
-- ===========================================

-- Add purchase_date column to inventory_items
ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS purchase_date DATE,
    ADD COLUMN IF NOT EXISTS purchased_by VARCHAR(255);

-- Create inventory_adjustments table for audit trail
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_before DECIMAL(12, 3),
    quantity_after DECIMAL(12, 3),
    expiry_date DATE,
    purchase_date DATE,
    purchased_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_adj_item ON inventory_adjustments(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inv_adj_created ON inventory_adjustments(created_at DESC);

-- RLS for new table
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access to inventory_adjustments" ON inventory_adjustments;
CREATE POLICY "Service role full access to inventory_adjustments" ON inventory_adjustments
    FOR ALL USING (auth.role() = 'service_role');

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
