-- ===========================================
-- INVENTORY MANAGEMENT SYSTEM
-- Run this in your Supabase SQL Editor
-- ===========================================

-- ===========================================
-- 1. INVENTORY CATEGORIES
-- ===========================================
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 2. INVENTORY ITEMS
-- ===========================================
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',          -- kg, g, pcs, liters, etc.
    unit_cost DECIMAL(12, 2) DEFAULT 0,
    quantity_available DECIMAL(12, 3) DEFAULT 0,       -- ready to use
    quantity_in_use DECIMAL(12, 3) DEFAULT 0,          -- allocated to active orders
    quantity_consumed DECIMAL(12, 3) DEFAULT 0,        -- used in completed orders (lifetime)
    min_stock_level DECIMAL(12, 3) DEFAULT 0,          -- alert threshold
    expiry_date DATE,
    description TEXT,
    supplier VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 3. PRODUCT → INVENTORY MAPPING
-- One product can use multiple inventory items
-- ===========================================
CREATE TABLE IF NOT EXISTS product_inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_per_unit DECIMAL(12, 3) NOT NULL DEFAULT 1, -- inventory units used per product unit sold
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, inventory_item_id)
);

-- ===========================================
-- 4. ORDER INVENTORY USAGE LOG
-- Tracks which orders consumed which inventory
-- ===========================================
CREATE TABLE IF NOT EXISTS order_inventory_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_used DECIMAL(12, 3) NOT NULL,
    -- in_use = order placed/processing, consumed = order completed, returned = order cancelled/refunded
    status VARCHAR(20) NOT NULL DEFAULT 'in_use' CHECK (status IN ('in_use', 'consumed', 'returned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 5. INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry ON inventory_items(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_inventory_product ON product_inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_item ON product_inventory_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_order_inv_usage_order ON order_inventory_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_order_inv_usage_status ON order_inventory_usage(status);

-- ===========================================
-- 6. UPDATED_AT TRIGGERS
-- ===========================================
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

DROP TRIGGER IF EXISTS set_order_inv_usage_updated_at ON order_inventory_usage;
CREATE TRIGGER set_order_inv_usage_updated_at
    BEFORE UPDATE ON order_inventory_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 7. AUTOMATIC INVENTORY STATE TRANSITIONS
-- Triggered when order status changes:
--
-- pending → processing/shipped  => move available to in_use (allocate)
-- processing/shipped → completed => move in_use to consumed
-- any → cancelled/refunded       => return in_use back to available
-- ===========================================

CREATE OR REPLACE FUNCTION handle_order_inventory_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    allocate_statuses TEXT[] := ARRAY['processing', 'shipped', 'on_hold'];
    complete_statuses TEXT[] := ARRAY['completed', 'delivered'];
    cancel_statuses   TEXT[] := ARRAY['cancelled', 'refunded', 'failed'];
BEGIN
    -- Nothing to do if status didn't change
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- === ALLOCATE: move available → in_use ===
    -- When order moves into processing/shipped for the first time
    IF NEW.status = ANY(allocate_statuses) AND NOT (OLD.status = ANY(allocate_statuses)) AND NOT (OLD.status = ANY(complete_statuses)) THEN
        -- For each order_item, find mapped inventory items and allocate
        INSERT INTO order_inventory_usage (order_id, order_item_id, inventory_item_id, quantity_used, status)
        SELECT
            oi.order_id,
            oi.id AS order_item_id,
            pii.inventory_item_id,
            (pii.quantity_per_unit * oi.quantity) AS quantity_used,
            'in_use'
        FROM order_items oi
        JOIN product_inventory_items pii ON pii.product_id = oi.product_id
        WHERE oi.order_id = NEW.id
        ON CONFLICT DO NOTHING;

        -- Deduct from available, add to in_use
        UPDATE inventory_items ii
        SET
            quantity_available = GREATEST(0, quantity_available - sub.total_qty),
            quantity_in_use = quantity_in_use + sub.total_qty
        FROM (
            SELECT inventory_item_id, SUM(quantity_used) AS total_qty
            FROM order_inventory_usage
            WHERE order_id = NEW.id AND status = 'in_use'
            GROUP BY inventory_item_id
        ) sub
        WHERE ii.id = sub.inventory_item_id;
    END IF;

    -- === COMPLETE: move in_use → consumed ===
    IF NEW.status = ANY(complete_statuses) AND NOT (OLD.status = ANY(complete_statuses)) THEN
        -- Mark usage records as consumed
        UPDATE order_inventory_usage
        SET status = 'consumed'
        WHERE order_id = NEW.id AND status = 'in_use';

        -- Move quantities from in_use to consumed
        UPDATE inventory_items ii
        SET
            quantity_in_use = GREATEST(0, quantity_in_use - sub.total_qty),
            quantity_consumed = quantity_consumed + sub.total_qty
        FROM (
            SELECT inventory_item_id, SUM(quantity_used) AS total_qty
            FROM order_inventory_usage
            WHERE order_id = NEW.id AND status = 'consumed'
            GROUP BY inventory_item_id
        ) sub
        WHERE ii.id = sub.inventory_item_id;
    END IF;

    -- === CANCEL/REFUND: return in_use → available ===
    IF NEW.status = ANY(cancel_statuses) THEN
        -- Mark usage records as returned
        UPDATE order_inventory_usage
        SET status = 'returned'
        WHERE order_id = NEW.id AND status = 'in_use';

        -- Return quantities from in_use back to available
        UPDATE inventory_items ii
        SET
            quantity_available = quantity_available + sub.total_qty,
            quantity_in_use = GREATEST(0, quantity_in_use - sub.total_qty)
        FROM (
            SELECT inventory_item_id, SUM(quantity_used) AS total_qty
            FROM order_inventory_usage
            WHERE order_id = NEW.id AND status = 'returned'
            GROUP BY inventory_item_id
        ) sub
        WHERE ii.id = sub.inventory_item_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_inventory_status ON orders;
CREATE TRIGGER trg_order_inventory_status
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_inventory_on_status_change();

-- ===========================================
-- 8. ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_inventory_usage ENABLE ROW LEVEL SECURITY;

-- Admin full access via service role (bypasses RLS), plus explicit policies
CREATE POLICY "Admin full access inventory_categories"
    ON inventory_categories FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access inventory_items"
    ON inventory_items FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access product_inventory_items"
    ON product_inventory_items FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access order_inventory_usage"
    ON order_inventory_usage FOR ALL
    USING (true) WITH CHECK (true);

-- Force PostgREST to reload schema cache so new tables are immediately accessible
NOTIFY pgrst, 'reload schema';
