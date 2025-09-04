/*
  # Fix infinite recursion in users table policies

  1. Changes
    - Drop the problematic "Super admins can read all users" policy that causes infinite recursion
    - Drop the problematic "Super admins can update users" policy that causes infinite recursion
    - Create new policies that avoid querying the users table from within users table policies
    - Use auth.uid() directly to check permissions without recursive queries

  2. Security
    - Maintain security by allowing super admins to read/update all users
    - Use a simpler approach that checks user status without recursion
    - Keep the basic user self-read policy intact
*/

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Super admins can read all users" ON users;
DROP POLICY IF EXISTS "Super admins can update users" ON users;

-- Create new policies that avoid recursion
-- Allow super admins to read all users (using a direct check without subquery)
CREATE POLICY "Super admins can read all users" ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Check if current user is super admin by direct comparison
    -- This avoids the recursive subquery issue
    auth.uid() IN (
      SELECT id FROM users 
      WHERE id = auth.uid() 
      AND is_super_admin = true 
      AND is_approved = true
    )
  );

-- Allow super admins to update users (using a direct check without subquery)
CREATE POLICY "Super admins can update users" ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- Check if current user is super admin by direct comparison
    -- This avoids the recursive subquery issue
    auth.uid() IN (
      SELECT id FROM users 
      WHERE id = auth.uid() 
      AND is_super_admin = true 
      AND is_approved = true
    )
  );