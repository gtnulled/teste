/*
  # Create withdrawals table for Seminary Dispensary withdrawal tracking

  1. New Tables
    - `withdrawals`
      - `id` (uuid, primary key) - Unique withdrawal identifier
      - `item_id` (uuid) - Reference to withdrawn item
      - `user_id` (uuid) - User who made the withdrawal
      - `quantity` (decimal) - Amount withdrawn
      - `withdrawn_at` (timestamp) - Withdrawal timestamp

  2. Security
    - Enable RLS on `withdrawals` table
    - Add policies for authenticated users to read their own withdrawals
    - Add policies for super admins to read all withdrawals
    - Add policies for approved users to create withdrawals
*/

CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  quantity decimal(10,2) NOT NULL,
  withdrawn_at timestamptz DEFAULT now()
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own withdrawals"
  ON withdrawals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all withdrawals"
  ON withdrawals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_super_admin = true AND is_approved = true
    )
  );

CREATE POLICY "Approved users can create withdrawals"
  ON withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_approved = true
    ) AND auth.uid() = user_id
  );