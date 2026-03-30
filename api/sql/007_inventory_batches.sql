-- ===========================================
-- INVENTORY BATCHES MIGRATION
-- Run this AFTER 006_inventory_enhancements.sql
-- Adds: inventory_batches table for tracking multiple
--        quantities with different expiry dates per item
-- ===========================================

-- Create inventory_batches table
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity DECIMAL(12, 3) NOT NULL DEFAULT 0,
    expiry_date DATE,
    purchase_date DATE,
    purchased_by VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_batch_item ON inventory_batches(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inv_batch_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inv_batch_active ON inventory_batches(is_active);

-- RLS for inventory_batches
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access to inventory_batches" ON inventory_batches;
CREATE POLICY "Service role full access to inventory_batches" ON inventory_batches
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_inventory_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inv_batch_timestamp ON inventory_batches;
CREATE TRIGGER trigger_update_inv_batch_timestamp
    BEFORE UPDATE ON inventory_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_batches_updated_at();

-- Migrate existing inventory items into batches
-- For each inventory item that has quantity > 0, create one batch
INSERT INTO inventory_batches (inventory_item_id, quantity, expiry_date, purchase_date, purchased_by, notes)
SELECT
    id,
    quantity_available,
    expiry_date,
    purchase_date,
    purchased_by,
    'Migrated from initial stock'
FROM inventory_items
WHERE quantity_available > 0
  AND is_active = TRUE
ON CONFLICT DO NOTHING;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
