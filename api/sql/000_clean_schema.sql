-- ===========================================
-- DIET LEAVES - CLEAN DATABASE SCHEMA
-- Run this FRESH in Supabase SQL Editor
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- DROP EXISTING TABLES (if any) - in reverse order
-- ===========================================
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS homepage_sections CASCADE;
DROP TABLE IF EXISTS footer_items CASCADE;
DROP TABLE IF EXISTS navigation_items CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS hero_sections CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ===========================================
-- 1. PROFILES
-- ===========================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Pakistan',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 2. SITE SETTINGS
-- ===========================================
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
    ('site_name', 'Diet Leaves', 'text', 'Website name'),
    ('site_logo', '/images/logo.png', 'image', 'Website logo'),
    ('announcement_bar_text', 'FREE SHIPPING ON ORDERS ABOVE RS 2000', 'text', 'Top announcement bar text'),
    ('announcement_bar_enabled', 'true', 'boolean', 'Show/hide announcement bar'),
    ('primary_color', '#10B981', 'text', 'Primary brand color'),
    ('secondary_color', '#1F2937', 'text', 'Secondary brand color'),
    ('contact_email', 'info@dietleaves.pk', 'text', 'Contact email'),
    ('contact_phone', '+92 300 1234567', 'text', 'Contact phone'),
    ('contact_address', 'Lahore, Pakistan', 'text', 'Contact address'),
    ('free_shipping_threshold', '2000', 'number', 'Free shipping minimum order amount'),
    ('shipping_cost', '180', 'number', 'Standard shipping cost in PKR'),
    ('currency', 'PKR', 'text', 'Currency code'),
    ('currency_symbol', 'Rs.', 'text', 'Currency symbol');

-- ===========================================
-- 3. HERO SECTIONS
-- ===========================================
CREATE TABLE hero_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    subtitle VARCHAR(255),
    media_type VARCHAR(20) DEFAULT 'image',
    media_url TEXT NOT NULL DEFAULT '',
    media_width INTEGER DEFAULT 1920,
    media_height INTEGER DEFAULT 1080,
    link_url TEXT,
    link_text VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 4. BANNERS
-- ===========================================
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    description TEXT,
    image_url TEXT NOT NULL DEFAULT '',
    image_width INTEGER DEFAULT 1200,
    image_height INTEGER DEFAULT 400,
    link_url TEXT,
    position VARCHAR(50) DEFAULT 'homepage',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 5. NAVIGATION ITEMS
-- ===========================================
CREATE TABLE navigation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    parent_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO navigation_items (label, url, display_order) VALUES
    ('Home', '/', 1),
    ('Products', '/products', 2),
    ('Shop', '/shop', 3),
    ('FAQ''s', '/faqs', 4),
    ('Contact Us', '/contact', 5),
    ('Blog', '/blog', 6);

-- ===========================================
-- 6. FOOTER ITEMS
-- ===========================================
CREATE TABLE footer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label VARCHAR(100) NOT NULL,
    item_type VARCHAR(20) DEFAULT 'text',
    url TEXT,
    icon VARCHAR(50),
    section VARCHAR(50) DEFAULT 'main',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO footer_items (label, item_type, url, icon, section, display_order) VALUES
    ('Facebook', 'social_link', 'https://facebook.com/dietleaves', 'facebook', 'social', 1),
    ('Instagram', 'social_link', 'https://instagram.com/dietleaves', 'instagram', 'social', 2),
    ('YouTube', 'social_link', 'https://youtube.com/dietleaves', 'youtube', 'social', 3),
    ('© 2026, Diet Leaves', 'text', NULL, NULL, 'main', 1),
    ('Privacy Policy', 'page_link', '/privacy', NULL, 'legal', 1),
    ('Terms of Service', 'page_link', '/terms', NULL, 'legal', 2),
    ('Refund Policy', 'page_link', '/refund', NULL, 'legal', 3),
    ('Shipping', 'page_link', '/shipping', NULL, 'legal', 4);

-- ===========================================
-- 7. CATEGORIES
-- ===========================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO categories (name, slug, description) VALUES
    ('Sweeteners', 'sweeteners', 'Stevia-based natural sweeteners');

-- ===========================================
-- 8. PRODUCTS
-- ===========================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    category_id UUID REFERENCES categories(id),
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    weight DECIMAL(10, 2),
    weight_unit VARCHAR(10) DEFAULT 'g',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_on_sale BOOLEAN DEFAULT FALSE,
    nutritional_info JSONB,
    ingredients TEXT,
    servings_per_container INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 9. PRODUCT IMAGES
-- ===========================================
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 10. PRODUCT VARIANTS
-- ===========================================
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 11. PRODUCT REVIEWS
-- ===========================================
CREATE TABLE product_reviews (
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

-- ===========================================
-- 12. ORDERS
-- ===========================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE,
    user_id UUID REFERENCES profiles(id),
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_country VARCHAR(100) DEFAULT 'Pakistan',
    shipping_postal_code VARCHAR(20),
    billing_same_as_shipping BOOLEAN DEFAULT TRUE,
    billing_address TEXT,
    billing_city VARCHAR(100),
    billing_country VARCHAR(100),
    billing_postal_code VARCHAR(20),
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cod',
    payment_status VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'pending',
    tracking_number VARCHAR(100),
    shipping_carrier VARCHAR(100),
    customer_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 13. ORDER ITEMS
-- ===========================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 14. CART ITEMS
-- ===========================================
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    session_id VARCHAR(255),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 15. HOMEPAGE SECTIONS
-- ===========================================
CREATE TABLE homepage_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    subtitle TEXT,
    settings JSONB,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO homepage_sections (section_type, title, settings, display_order) VALUES
    ('hero', NULL, '{"autoplay": true, "interval": 5000}', 1),
    ('products', 'CHOOSE YOUR OWN FLAVOUR', '{"columns": 3, "limit": 6, "showSale": true}', 2),
    ('featured_product', NULL, '{"productId": null}', 3);

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_session ON cart_items(session_id);
CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_featured ON product_reviews(is_featured);
CREATE INDEX idx_reviews_approved ON product_reviews(is_approved);

-- ===========================================
-- ORDER NUMBER GENERATOR
-- ===========================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'DL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
    FOR EACH ROW WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- ===========================================
-- DONE - Schema created successfully!
-- ===========================================
