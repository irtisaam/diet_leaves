-- ===========================================
-- 011: Promo Codes Feature
-- ===========================================

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',  -- 'percentage' or 'flat'
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    max_discount_amount NUMERIC(10, 2),  -- cap for percentage discounts
    usage_limit INT,  -- NULL = unlimited
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT promo_codes_code_unique UNIQUE (code),
    CONSTRAINT promo_codes_discount_type_check CHECK (discount_type IN ('percentage', 'flat')),
    CONSTRAINT promo_codes_discount_value_check CHECK (discount_value > 0)
);

-- Promo code usage tracking (per order)
CREATE TABLE IF NOT EXISTS promo_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_applied NUMERIC(10, 2) NOT NULL DEFAULT 0,
    order_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    customer_email VARCHAR(255),
    used_at TIMESTAMPTZ DEFAULT now()
);

-- Add promo_code_id to orders table for quick reference
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_promo ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_order ON promo_code_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_promo_code_id ON orders(promo_code_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow full access via service role (API uses service key)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promo_codes' AND policyname = 'promo_codes_service_all') THEN
        CREATE POLICY promo_codes_service_all ON promo_codes FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promo_code_usage' AND policyname = 'promo_code_usage_service_all') THEN
        CREATE POLICY promo_code_usage_service_all ON promo_code_usage FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Updated_at trigger for promo_codes
CREATE OR REPLACE FUNCTION update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS promo_codes_updated_at ON promo_codes;
CREATE TRIGGER promo_codes_updated_at
    BEFORE UPDATE ON promo_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_promo_codes_updated_at();

-- Atomic increment for promo code usage count
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
