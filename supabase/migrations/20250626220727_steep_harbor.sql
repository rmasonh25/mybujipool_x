/*
  # Rental System Implementation

  1. New Tables
    - `rental_machines` - Available machines for rent with pricing
    - `rentals` - Active rental agreements
    - `rental_payments` - Payment tracking for rentals
    - `machine_owners` - Owner payout information

  2. Security
    - Enable RLS on all new tables
    - Add policies for users to manage their rentals
    - Add policies for machine owners to manage their machines

  3. Sample Data
    - Insert 20 dummy machines with realistic specifications
    - Various ASIC models with different hashrates and pricing
*/

-- Rental machines table (available machines for rent)
CREATE TABLE IF NOT EXISTS rental_machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  model text NOT NULL,
  manufacturer text NOT NULL,
  hashrate numeric NOT NULL, -- TH/s
  power_consumption numeric NOT NULL, -- Watts
  efficiency numeric GENERATED ALWAYS AS (power_consumption / (hashrate * 1000)) STORED, -- J/GH
  daily_rate numeric NOT NULL, -- USD per day
  location text,
  description text,
  image_url text,
  specifications jsonb DEFAULT '{}',
  availability_calendar jsonb DEFAULT '{}', -- Track available dates
  min_rental_days integer DEFAULT 1,
  max_rental_days integer DEFAULT 30,
  is_available boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  total_rentals integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Machine owners payout information
CREATE TABLE IF NOT EXISTS machine_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) UNIQUE NOT NULL,
  stripe_account_id text, -- Stripe Connect account ID
  payout_enabled boolean DEFAULT false,
  bank_account_verified boolean DEFAULT false,
  tax_id text,
  business_name text,
  contact_email text,
  contact_phone text,
  address jsonb,
  payout_schedule text DEFAULT 'weekly', -- daily, weekly, monthly
  minimum_payout numeric DEFAULT 50.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rentals table (active rental agreements)
CREATE TABLE IF NOT EXISTS rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid REFERENCES rental_machines(id) NOT NULL,
  renter_id uuid REFERENCES users(id) NOT NULL,
  owner_id uuid REFERENCES users(id) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  daily_rate numeric NOT NULL,
  total_amount numeric GENERATED ALWAYS AS (daily_rate * (end_date - start_date + 1)) STORED,
  platform_fee numeric GENERATED ALWAYS AS (daily_rate * (end_date - start_date + 1) * 0.035) STORED,
  owner_payout numeric GENERATED ALWAYS AS (daily_rate * (end_date - start_date + 1) * 0.965) STORED,
  status text DEFAULT 'pending', -- pending, confirmed, active, completed, cancelled
  payment_status text DEFAULT 'pending', -- pending, paid, failed, refunded
  stripe_payment_intent_id text,
  stripe_session_id text,
  mining_pool_config jsonb,
  wallet_address text NOT NULL,
  performance_data jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rental payments tracking
CREATE TABLE IF NOT EXISTS rental_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid REFERENCES rentals(id) NOT NULL,
  payment_type text NOT NULL, -- rental_payment, owner_payout, platform_fee
  amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  stripe_payment_intent_id text,
  stripe_transfer_id text, -- For owner payouts
  status text DEFAULT 'pending', -- pending, completed, failed, cancelled
  processed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rental_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_payments ENABLE ROW LEVEL SECURITY;

-- Rental machines policies
CREATE POLICY "Anyone can read available machines"
  ON rental_machines
  FOR SELECT
  TO authenticated
  USING (is_available = true);

CREATE POLICY "Owners can manage their machines"
  ON rental_machines
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Machine owners policies
CREATE POLICY "Users can read their own owner profile"
  ON machine_owners
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own owner profile"
  ON machine_owners
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Rentals policies
CREATE POLICY "Users can read their own rentals"
  ON rentals
  FOR SELECT
  TO authenticated
  USING (renter_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Users can create rentals as renters"
  ON rentals
  FOR INSERT
  TO authenticated
  WITH CHECK (renter_id = auth.uid());

CREATE POLICY "Owners and renters can update their rentals"
  ON rentals
  FOR UPDATE
  TO authenticated
  USING (renter_id = auth.uid() OR owner_id = auth.uid())
  WITH CHECK (renter_id = auth.uid() OR owner_id = auth.uid());

-- Rental payments policies
CREATE POLICY "Users can read payments for their rentals"
  ON rental_payments
  FOR SELECT
  TO authenticated
  USING (
    rental_id IN (
      SELECT id FROM rentals 
      WHERE renter_id = auth.uid() OR owner_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rental_machines_available ON rental_machines(is_available, daily_rate);
CREATE INDEX IF NOT EXISTS idx_rental_machines_owner ON rental_machines(owner_id);
CREATE INDEX IF NOT EXISTS idx_rentals_machine ON rentals(machine_id);
CREATE INDEX IF NOT EXISTS idx_rentals_renter ON rentals(renter_id);
CREATE INDEX IF NOT EXISTS idx_rentals_owner ON rentals(owner_id);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rental_payments_rental ON rental_payments(rental_id);

-- Insert dummy machine owners (create some test users first)
INSERT INTO users (id, email, is_paid_member) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'owner1@example.com', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'owner2@example.com', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'owner3@example.com', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'owner4@example.com', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'owner5@example.com', true)
ON CONFLICT (id) DO NOTHING;

-- Insert machine owner profiles
INSERT INTO machine_owners (user_id, stripe_account_id, payout_enabled, business_name, contact_email) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'acct_test_001', true, 'CryptoMine Solutions', 'owner1@example.com'),
  ('550e8400-e29b-41d4-a716-446655440002', 'acct_test_002', true, 'HashPower Rentals', 'owner2@example.com'),
  ('550e8400-e29b-41d4-a716-446655440003', 'acct_test_003', true, 'Mining Farm Co', 'owner3@example.com'),
  ('550e8400-e29b-41d4-a716-446655440004', 'acct_test_004', true, 'BitRent LLC', 'owner4@example.com'),
  ('550e8400-e29b-41d4-a716-446655440005', 'acct_test_005', true, 'ProMiner Rentals', 'owner5@example.com');

-- Insert 20 dummy rental machines
INSERT INTO rental_machines (
  owner_id, name, model, manufacturer, hashrate, power_consumption, daily_rate, 
  location, description, image_url, is_available, is_verified, total_rentals, average_rating
) VALUES
  -- Antminer S19 Series
  ('550e8400-e29b-41d4-a716-446655440001', 'Beast S19 Pro #1', 'Antminer S19 Pro', 'Bitmain', 110, 3250, 28.50, 'Texas, USA', 'Professional grade ASIC miner with excellent efficiency', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 15, 4.8),
  ('550e8400-e29b-41d4-a716-446655440001', 'Beast S19 Pro #2', 'Antminer S19 Pro', 'Bitmain', 110, 3250, 29.00, 'Texas, USA', 'High-performance mining rig in climate-controlled facility', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 12, 4.9),
  ('550e8400-e29b-41d4-a716-446655440002', 'Lightning S19j Pro', 'Antminer S19j Pro', 'Bitmain', 104, 3068, 26.75, 'Washington, USA', 'Efficient miner with lower power consumption', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 8, 4.7),
  ('550e8400-e29b-41d4-a716-446655440002', 'Thunder S19 XP', 'Antminer S19 XP', 'Bitmain', 140, 3010, 35.00, 'Washington, USA', 'Latest generation high-efficiency miner', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 5, 5.0),
  
  -- Antminer S21 Series
  ('550e8400-e29b-41d4-a716-446655440003', 'Titan S21 #1', 'Antminer S21', 'Bitmain', 200, 3550, 45.00, 'Georgia, USA', 'Next-gen ASIC with incredible hashrate', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 3, 4.9),
  ('550e8400-e29b-41d4-a716-446655440003', 'Titan S21 #2', 'Antminer S21', 'Bitmain', 200, 3550, 44.50, 'Georgia, USA', 'Premium mining equipment with 24/7 monitoring', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 2, 5.0),
  
  -- WhatsMiner M30S Series
  ('550e8400-e29b-41d4-a716-446655440004', 'Rocket M30S++ #1', 'WhatsMiner M30S++', 'MicroBT', 112, 3472, 29.75, 'Kentucky, USA', 'Reliable WhatsMiner with proven track record', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 18, 4.6),
  ('550e8400-e29b-41d4-a716-446655440004', 'Rocket M30S++ #2', 'WhatsMiner M30S++', 'MicroBT', 112, 3472, 30.00, 'Kentucky, USA', 'Industrial-grade miner in professional data center', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 14, 4.8),
  ('550e8400-e29b-41d4-a716-446655440005', 'Storm M30S+ #1', 'WhatsMiner M30S+', 'MicroBT', 100, 3400, 27.25, 'Montana, USA', 'Stable performer with excellent uptime', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 20, 4.7),
  ('550e8400-e29b-41d4-a716-446655440005', 'Storm M30S+ #2', 'WhatsMiner M30S+', 'MicroBT', 100, 3400, 26.90, 'Montana, USA', 'Cost-effective mining solution', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 16, 4.5),
  
  -- WhatsMiner M60S Series
  ('550e8400-e29b-41d4-a716-446655440001', 'Mega M60S++ #1', 'WhatsMiner M60S++', 'MicroBT', 270, 4750, 58.00, 'Texas, USA', 'Massive hashrate for serious miners', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 1, 5.0),
  ('550e8400-e29b-41d4-a716-446655440002', 'Mega M60S+ #1', 'WhatsMiner M60S+', 'MicroBT', 230, 4300, 52.50, 'Washington, USA', 'High-end mining equipment with premium support', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 2, 4.9),
  
  -- Antminer S17 Series (Older but reliable)
  ('550e8400-e29b-41d4-a716-446655440003', 'Classic S17 Pro', 'Antminer S17 Pro', 'Bitmain', 53, 2094, 18.75, 'Georgia, USA', 'Proven reliable miner at budget-friendly rates', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 25, 4.4),
  ('550e8400-e29b-41d4-a716-446655440004', 'Vintage S17+ #1', 'Antminer S17+', 'Bitmain', 73, 2920, 22.00, 'Kentucky, USA', 'Good value option for cost-conscious miners', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 22, 4.3),
  ('550e8400-e29b-41d4-a716-446655440005', 'Vintage S17+ #2', 'Antminer S17+', 'Bitmain', 73, 2920, 21.50, 'Montana, USA', 'Affordable entry point for solo mining', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 19, 4.2),
  
  -- Mixed newer models
  ('550e8400-e29b-41d4-a716-446655440001', 'Elite S19k Pro', 'Antminer S19k Pro', 'Bitmain', 120, 2760, 32.00, 'Texas, USA', 'Optimized efficiency with lower power draw', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 7, 4.8),
  ('550e8400-e29b-41d4-a716-446655440002', 'Power M50S++', 'WhatsMiner M50S++', 'MicroBT', 126, 3276, 33.25, 'Washington, USA', 'Balanced performance and efficiency', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 9, 4.7),
  ('550e8400-e29b-41d4-a716-446655440003', 'Turbo M53S++', 'WhatsMiner M53S++', 'MicroBT', 226, 4300, 51.00, 'Georgia, USA', 'High-performance mining for maximum returns', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 4, 4.9),
  ('550e8400-e29b-41d4-a716-446655440004', 'Apex S19 Hydro', 'Antminer S19 Hydro', 'Bitmain', 158, 5016, 42.75, 'Kentucky, USA', 'Liquid-cooled for maximum performance', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 6, 4.8),
  ('550e8400-e29b-41d4-a716-446655440005', 'Stealth M56S++', 'WhatsMiner M56S++', 'MicroBT', 212, 4200, 48.50, 'Montana, USA', 'Quiet operation with excellent cooling', 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg', true, true, 3, 4.9);