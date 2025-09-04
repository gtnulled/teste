/*
  # Fix infinite recursion in users table policies

  1. Problem
    - Current policies are causing infinite recursion by querying the users table from within the users table policies
    - This happens when policies try to check user permissions by querying the same table they're protecting

  2. Solution
    - Drop all existing problematic policies
    - Create simple, non-recursive policies that use auth.uid() directly
    - Use a separate approach for super admin checks that doesn't cause recursion

  3. New Policies
    - Users can read their own data using auth.uid() = id
    - Users can insert their own data using auth.uid() = id
    - Super admins are handled by checking the specific UUID directly
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "users_select_admin_policy" ON users;
DROP POLICY IF EXISTS "users_select_own_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_admin_policy" ON users;
DROP POLICY IF EXISTS "Super admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Super admins can update users" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "users_can_read_own_data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Super admin policy that doesn't cause recursion
CREATE POLICY "super_admin_full_access"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = 'a2651373-0eae-4673-ab9a-1c6ad32fc7bf'::uuid)
  WITH CHECK (auth.uid() = 'a2651373-0eae-4673-ab9a-1c6ad32fc7bf'::uuid);

-- Ensure the super admin user exists and is properly configured
INSERT INTO users (id, email, full_name, is_super_admin, is_approved)
VALUES (
  'a2651373-0eae-4673-ab9a-1c6ad32fc7bf'::uuid,
  'guthierresc@hotmail.com',
  'Super Admin',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_super_admin = true,
  is_approved = true,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;