-- ===========================================
-- INVENTORY DEDUCTIONS TRACKING MIGRATION
-- Run this AFTER 007_inventory_batches.sql
-- Purpose: Track exactly what inventory was deducted
--          per order so deductions can be reversed on cancellation.
-- ===========================================

-- Table to log every inventory deduction linked to a shipping order
CREATE TABLE IF NOT EXISTS order_inventory_deductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_deducted DECIMAL(12, 3) NOT NULL,
    -- Set to TRUE when order is cancelled/refunded and qty is restored
    is_reversed BOOLEAN DEFAULT FALSE,
    reversed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oid_order_id ON order_inventory_deductions(order_id);
CREATE INDEX IF NOT EXISTS idx_oid_item_id  ON order_inventory_deductions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_oid_reversed ON order_inventory_deductions(is_reversed);

-- RLS
ALTER TABLE order_inventory_deductions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access to order_inventory_deductions" ON order_inventory_deductions;
CREATE POLICY "Service role full access to order_inventory_deductions"
    ON order_inventory_deductions FOR ALL USING (auth.role() = 'service_role');

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
