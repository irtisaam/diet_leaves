-- ===========================================
-- BLOG MODULE MIGRATION
-- Run this in Supabase SQL editor
-- Adds: blog_posts table with rich content support
-- ===========================================

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT,              -- Excerpt shown on listing cards
    content TEXT NOT NULL,               -- Full blog content (HTML/rich text)
    hero_image_url TEXT,                 -- Hero/banner image URL
    author TEXT DEFAULT 'Diet Leaves',
    is_published BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,     -- Pinned posts appear first
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_pinned ON blog_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_blog_order ON blog_posts(display_order);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trigger_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_blog_posts_updated_at();

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published blogs" ON blog_posts;
CREATE POLICY "Public read published blogs" ON blog_posts
    FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Service role full access to blogs" ON blog_posts;
CREATE POLICY "Service role full access to blogs" ON blog_posts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
