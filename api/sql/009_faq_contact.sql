-- ===========================================
-- FAQ AND CONTACT INFO MIGRATION
-- Run this in Supabase SQL editor
-- Adds: faqs table, extends site_settings for contact/social links
-- ===========================================

-- FAQ table
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,           -- Rich text / markdown
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_faqs_updated_at ON faqs;
CREATE TRIGGER trigger_faqs_updated_at
    BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_faqs_updated_at();

-- RLS
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active faqs" ON faqs;
CREATE POLICY "Public read active faqs" ON faqs
    FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Service role full access to faqs" ON faqs;
CREATE POLICY "Service role full access to faqs" ON faqs
    FOR ALL USING (auth.role() = 'service_role');

-- Insert new site_settings for contact / social info (use ON CONFLICT DO NOTHING)
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('contact_whatsapp',  '',  'text',    'WhatsApp number with country code (e.g. +923001234567)')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('social_facebook',   '',  'text',    'Facebook page URL')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('social_instagram',  '',  'text',    'Instagram profile URL')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('social_youtube',    '',  'text',    'YouTube channel URL')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('about_description', '',  'text',    'About / Contact page description (shown on Contact Us page)')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('contact_email',     '',  'text',    'Primary contact email address')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('contact_phone',     '',  'text',    'Primary contact phone number')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('contact_address',   '',  'text',    'Physical address')
ON CONFLICT (setting_key) DO NOTHING;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
