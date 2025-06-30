/*
  # Stripe Integration Schema Updates

  1. New Tables
    - Add stripe-related columns to existing tables
    - Create payment tracking tables
    
  2. Security
    - Enable RLS on new tables
    - Add policies for payment data access
    
  3. Indexes
    - Add indexes for Stripe-related lookups
*/

-- Add Stripe columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- Add Stripe columns to rentals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rentals' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE rentals ADD COLUMN stripe_payment_intent_id text;
  END IF;
END $$;

-- Add indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_customer_id ON orders(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_rentals_stripe_payment_intent ON rentals(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_machine_owners_stripe_account ON machine_owners(stripe_account_id);

-- Create webhook events table for debugging
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed boolean DEFAULT false,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on webhook events table
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Create policy for webhook events (admin only)
CREATE POLICY "Admin can manage webhook events"
  ON stripe_webhook_events
  FOR ALL
  TO service_role
  USING (true);

-- Add index for webhook event lookups
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);