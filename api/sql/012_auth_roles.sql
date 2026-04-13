-- ===========================================
-- 012: Authentication & User Roles
-- ===========================================

-- Drop Supabase auth dependency: profiles becomes standalone auth table
-- Add password_hash, role, email_notifications, phone uniqueness

-- Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- Make email unique if not already
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_unique'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    END IF;
END $$;

-- Make phone unique (allow NULL but no duplicates)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_phone_unique'
    ) THEN
        CREATE UNIQUE INDEX profiles_phone_unique ON profiles (phone) WHERE phone IS NOT NULL AND phone != '';
    END IF;
END $$;

-- Role check constraint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin'));
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token ON profiles(reset_token) WHERE reset_token IS NOT NULL;

-- Add email_notifications to orders (per-order opt-in from checkout)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false;
-- Add user_id FK if not exists (link orders to profiles)
-- user_id column already exists, just ensure it can be used

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
