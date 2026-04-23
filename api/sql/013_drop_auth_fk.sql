-- ===========================================
-- 013: Drop auth.users FK from profiles
-- ===========================================
-- Our auth is standalone JWT+bcrypt, not Supabase Auth.
-- The FK to auth.users prevents creating profiles directly.
-- The handle_new_user trigger also interferes with auth.users inserts.

-- 1. Drop the trigger that auto-creates profiles on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Drop the foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Allow the idcd column to accept any UUID (not just auth.users IDs)
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Disable RLS so service-role inserts work without auth context
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
