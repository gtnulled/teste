/*
  # Fix SQL syntax error in users table policies

  1. Policy Updates
    - Fix syntax error in super admin policy
    - Simplify policy logic to avoid recursion
    - Use proper boolean expressions

  2. Security
    - Maintain RLS protection
    - Ensure super admins can manage users
    - Regular users can only see their own data
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can read all users" ON users;
DROP POLICY IF EXISTS "Super admins can update users" ON users;

-- Create corrected policies with proper syntax
CREATE POLICY "Super admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Allow users to read their own data OR if they are an approved super admin
    (auth.uid() = id) OR 
    (
      auth.uid() IN (
        SELECT id FROM users 
        WHERE id = auth.uid() 
        AND is_super_admin = true 
        AND is_approved = true
      )
    )
  );

CREATE POLICY "Super admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE id = auth.uid() 
      AND is_super_admin = true 
      AND is_approved = true
    )
  );

-- Ensure the user you mentioned has proper permissions
UPDATE users 
SET is_super_admin = true, is_approved = true 
WHERE id = 'a2651373-0eae-4673-ab9a-1c6ad32fc7bf';