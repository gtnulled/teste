/*
  # Create users table for Seminary Dispensary CRM

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - User identifier from Supabase Auth
      - `email` (text, unique) - User email address
      - `full_name` (text) - Complete user name
      - `is_super_admin` (boolean) - Administrative privileges flag
      - `is_approved` (boolean) - Account approval status
      - `created_at` (timestamp) - Account creation timestamp

  2. Security
    - Enable RLS on `users` table
    - Add policies for authenticated users to read their own data
    - Add policies for super admins to manage all user accounts
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  is_super_admin boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_super_admin = true AND is_approved = true
    )
  );

CREATE POLICY "Super admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_super_admin = true AND is_approved = true
    )
  );

CREATE POLICY "Allow user signup"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);