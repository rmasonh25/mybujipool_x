/*
  # Add user_equipment table

  1. New Tables
    - `user_equipment`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, foreign key to users)
      - `name` (text, equipment name)
      - `type` (text, equipment type)
      - `model` (text, equipment model)
      - `hashrate` (numeric, mining hashrate)
      - `power` (numeric, power consumption)
      - `wallet_address` (text, mining wallet address)
      - `pool_config` (jsonb, pool configuration)
      - `status` (text, equipment status)
      - `created_at` (timestamp, creation time)

  2. Security
    - Enable RLS on `user_equipment` table
    - Add policies for users to manage their own equipment
*/

CREATE TABLE IF NOT EXISTS user_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'ASIC',
  model text,
  hashrate numeric,
  power numeric,
  wallet_address text,
  pool_config jsonb,
  status text DEFAULT 'offline',
  created_at timestamp DEFAULT now()
);

ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own equipment"
  ON user_equipment
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own equipment"
  ON user_equipment
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own equipment"
  ON user_equipment
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own equipment"
  ON user_equipment
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());