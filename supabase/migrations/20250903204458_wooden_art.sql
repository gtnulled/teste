/*
  # Create items table for Seminary Dispensary inventory management

  1. New Tables
    - `items`
      - `id` (uuid, primary key) - Unique item identifier
      - `name` (text) - Item name/description
      - `quantity` (decimal) - Current stock quantity
      - `unit` (enum) - Unit of measurement (kg or unidade)
      - `category` (text, optional) - Item category for organization
      - `created_by` (uuid) - User who registered the item
      - `created_at` (timestamp) - Item registration timestamp
      - `removal_requested` (boolean) - Flag for removal requests
      - `requested_by` (uuid, optional) - User who requested removal
      - `requested_at` (timestamp, optional) - Removal request timestamp

  2. Security
    - Enable RLS on `items` table
    - Add policies for authenticated users to read all items
    - Add policies for authenticated users to create items
    - Add policies for super admins to update/delete items
    - Add policies for non-admin users to request item removal
*/

CREATE TYPE unit_type AS ENUM ('kg', 'unidade');

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity decimal(10,2) NOT NULL DEFAULT 0,
  unit unit_type NOT NULL,
  category text,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  removal_requested boolean DEFAULT false,
  requested_by uuid REFERENCES users(id),
  requested_at timestamptz
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read items"
  ON items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_approved = true
    )
  );

CREATE POLICY "Approved users can create items"
  ON items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_approved = true
    ) AND auth.uid() = created_by
  );

CREATE POLICY "Super admins can update items"
  ON items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_super_admin = true AND is_approved = true
    )
  );

CREATE POLICY "Super admins can delete items"
  ON items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_super_admin = true AND is_approved = true
    )
  );