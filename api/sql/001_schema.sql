    -- ===========================================
    -- DIET LEAVES DATABASE SCHEMA
    -- Version: 1.0.0
    -- Execute this script in Supabase SQL Editor
    -- ===========================================

    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- ===========================================
    -- 1. USER PROFILES (extends Supabase auth.users)
    -- ===========================================
    CREATE TABLE IF NOT EXISTS profiles (
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
    -- 2. SITE SETTINGS (Admin Customization)
    -- ===========================================
    CREATE TABLE IF NOT EXISTS site_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'text', -- text, image, json, boolean, number
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Insert default site settings
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
        ('currency_symbol', 'Rs.', 'text', 'Currency symbol')
    ON CONFLICT (setting_key) DO NOTHING;

    -- ===========================================
    -- 3. HERO SECTIONS (Homepage Hero)
    -- ===========================================
    CREATE TABLE IF NOT EXISTS hero_sections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255),
        subtitle VARCHAR(255),
        media_type VARCHAR(20) DEFAULT 'image', -- image or video
        media_url TEXT NOT NULL,
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
    -- 4. BANNERS (Promotional banners)
    -- ===========================================
    CREATE TABLE IF NOT EXISTS banners (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255),
        description TEXT,
        image_url TEXT NOT NULL,
        image_width INTEGER DEFAULT 1200,
        image_height INTEGER DEFAULT 400,
        link_url TEXT,
        position VARCHAR(50) DEFAULT 'homepage', -- homepage, shop, product-page
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
    CREATE TABLE IF NOT EXISTS navigation_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        label VARCHAR(100) NOT NULL,
        url VARCHAR(255) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        parent_id UUID REFERENCES navigation_items(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Insert default navigation
    INSERT INTO navigation_items (label, url, display_order) VALUES
        ('Home', '/', 1),
        ('Products', '/products', 2),
        ('Shop', '/shop', 3),
        ('FAQ''s', '/faqs', 4),
        ('Contact Us', '/contact', 5),
        ('Blog', '/blog', 6)
    ON CONFLICT DO NOTHING;

    -- ===========================================
    -- 6. FOOTER ITEMS
    -- ===========================================
    CREATE TABLE IF NOT EXISTS footer_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        label VARCHAR(100) NOT NULL,
        item_type VARCHAR(20) DEFAULT 'text', -- text, social_link, page_link
        url TEXT,
        icon VARCHAR(50), -- For social links: facebook, instagram, youtube, etc.
        section VARCHAR(50) DEFAULT 'main', -- main, social, legal
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Insert default footer items
    INSERT INTO footer_items (label, item_type, url, icon, section, display_order) VALUES
        ('Facebook', 'social_link', 'https://facebook.com/dietleaves', 'facebook', 'social', 1),
        ('Instagram', 'social_link', 'https://instagram.com/dietleaves', 'instagram', 'social', 2),
        ('YouTube', 'social_link', 'https://youtube.com/dietleaves', 'youtube', 'social', 3),
        ('© 2026, Diet Leaves', 'text', NULL, NULL, 'main', 1),
        ('Privacy Policy', 'page_link', '/privacy', NULL, 'legal', 1),
        ('Terms of Service', 'page_link', '/terms', NULL, 'legal', 2),
        ('Refund Policy', 'page_link', '/refund', NULL, 'legal', 3),
        ('Shipping', 'page_link', '/shipping', NULL, 'legal', 4)
    ON CONFLICT DO NOTHING;

    -- ===========================================
    -- 7. PRODUCT CATEGORIES
    -- ===========================================
    CREATE TABLE IF NOT EXISTS categories (
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

    -- Insert default category
    INSERT INTO categories (name, slug, description) VALUES
        ('Sweeteners', 'sweeteners', 'Stevia-based natural sweeteners')
    ON CONFLICT (slug) DO NOTHING;

    -- ===========================================
    -- 8. PRODUCTS
    -- ===========================================
    CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        short_description TEXT,
        category_id UUID REFERENCES categories(id),
        price DECIMAL(10, 2) NOT NULL,
        compare_at_price DECIMAL(10, 2), -- Original price for sale display
        sku VARCHAR(50) UNIQUE,
        barcode VARCHAR(50),
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        weight DECIMAL(10, 2),
        weight_unit VARCHAR(10) DEFAULT 'g',
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        is_on_sale BOOLEAN DEFAULT FALSE,
        nutritional_info JSONB, -- {calories: 0, sugar: 0, fat: 0, etc.}
        ingredients TEXT,
        servings_per_container INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- ===========================================
    -- 9. PRODUCT IMAGES
    -- ===========================================
    CREATE TABLE IF NOT EXISTS product_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        alt_text VARCHAR(255),
        display_order INTEGER DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- ===========================================
    -- 10. PRODUCT VARIANTS (sizes, flavors, etc.)
    -- ===========================================
    CREATE TABLE IF NOT EXISTS product_variants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL, -- e.g., "Pack of 3", "Large"
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- ===========================================
    -- 12. ORDERS
    -- ===========================================
    CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id UUID REFERENCES profiles(id),
        
        -- Customer Info
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        customer_name VARCHAR(255) NOT NULL,
        
        -- Shipping Address
        shipping_address TEXT NOT NULL,
        shipping_city VARCHAR(100) NOT NULL,
        shipping_country VARCHAR(100) DEFAULT 'Pakistan',
        shipping_postal_code VARCHAR(20),
        
        -- Billing Address (if different)
        billing_same_as_shipping BOOLEAN DEFAULT TRUE,
        billing_address TEXT,
        billing_city VARCHAR(100),
        billing_country VARCHAR(100),
        billing_postal_code VARCHAR(20),
        
        -- Order Details
        subtotal DECIMAL(10, 2) NOT NULL,
        shipping_cost DECIMAL(10, 2) DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL,
        
        -- Payment
        payment_method VARCHAR(50) DEFAULT 'cod', -- cod, jazzcash, easypaisa
        payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
        
        -- Order Status
        status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
        
        -- Tracking
        tracking_number VARCHAR(100),
        shipping_carrier VARCHAR(100),
        
        -- Notes
        customer_notes TEXT,
        admin_notes TEXT,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- ===========================================
    -- 13. ORDER ITEMS
    -- ===========================================
    CREATE TABLE IF NOT EXISTS order_items (
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
    -- 14. SHOPPING CART
    -- ===========================================
    CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES profiles(id),
        session_id VARCHAR(255), -- For guest carts
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        variant_id UUID REFERENCES product_variants(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- ===========================================
    -- 15. HOMEPAGE SECTIONS (for customizable layout)
    -- ===========================================
    CREATE TABLE IF NOT EXISTS homepage_sections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        section_type VARCHAR(50) NOT NULL, -- hero, products, banner, testimonials
        title VARCHAR(255),
        subtitle TEXT,
        settings JSONB, -- Flexible settings for each section type
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Insert default homepage sections
    INSERT INTO homepage_sections (section_type, title, settings, display_order) VALUES
        ('hero', NULL, '{"autoplay": true, "interval": 5000}', 1),
        ('products', 'CHOOSE YOUR OWN FLAVOUR', '{"columns": 3, "limit": 6, "showSale": true}', 2),
        ('featured_product', NULL, '{"productId": null}', 3)
    ON CONFLICT DO NOTHING;

    -- ===========================================
    -- INDEXES FOR PERFORMANCE
    -- ===========================================
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_items(session_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);

    -- ===========================================
    -- ROW LEVEL SECURITY POLICIES
    -- ===========================================

    -- Enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

    -- Profiles: Users can only see/edit their own profile
    CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);

    -- Orders: Users can only see their own orders
    CREATE POLICY "Users can view own orders" ON orders
        FOR SELECT USING (auth.uid() = user_id);

    -- Cart: Users can manage their own cart
    CREATE POLICY "Users can manage own cart" ON cart_items
        FOR ALL USING (auth.uid() = user_id OR session_id IS NOT NULL);

    -- Reviews: Anyone can view approved reviews
    CREATE POLICY "Anyone can view approved reviews" ON product_reviews
        FOR SELECT USING (is_approved = TRUE);

    CREATE POLICY "Users can create reviews" ON product_reviews
        FOR INSERT WITH CHECK (TRUE);

    -- ===========================================
    -- FUNCTIONS & TRIGGERS
    -- ===========================================

    -- Function to update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Apply trigger to relevant tables
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Function to generate order number
    CREATE OR REPLACE FUNCTION generate_order_number()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.order_number = 'DL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER set_order_number BEFORE INSERT ON orders
        FOR EACH ROW EXECUTE FUNCTION generate_order_number();

    -- Function to create profile on user signup
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO profiles (id, email, full_name)
        VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
        RETURN NEW;
    END;
    $$ language 'plpgsql' SECURITY DEFINER;

    -- Trigger to create profile on signup
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
