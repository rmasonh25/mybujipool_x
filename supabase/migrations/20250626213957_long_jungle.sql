/*
  # Add cart and products system for Stripe integration

  1. New Tables
    - `products` - Available products/services (memberships, etc.)
    - `cart_items` - User cart items
    - `orders` - Completed orders
    - `order_items` - Items in completed orders

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Products table for memberships and services
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'membership', -- membership, service, rental
  price numeric NOT NULL,
  billing_period text DEFAULT 'monthly', -- monthly, yearly, one-time
  stripe_price_id text,
  stripe_product_id text,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1,
  price_at_time numeric NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Orders table for completed purchases
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text DEFAULT 'pending', -- pending, completed, failed, refunded
  total_amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity integer DEFAULT 1,
  price_at_time numeric NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Cart policies
CREATE POLICY "Users can read their own cart"
  ON cart_items
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own cart items"
  ON cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cart items"
  ON cart_items
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own cart items"
  ON cart_items
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Orders policies
CREATE POLICY "Users can read their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Order items policies
CREATE POLICY "Users can read their own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  ));

-- Insert default products
INSERT INTO products (name, description, type, price, billing_period, features, sort_order) VALUES
(
  'Miner Membership - Launch Special',
  'Early access membership with 50% off for the first 3 months',
  'membership',
  9.98,
  'monthly',
  '["Access to solo mining pool", "Use your own equipment", "Rent available ASICs", "Keep 100% of block rewards", "Real-time statistics", "Equipment management", "24/7 support"]',
  1
),
(
  'Miner Membership - Regular',
  'Full access to solo mining pool and ASIC rentals',
  'membership',
  19.95,
  'monthly',
  '["Access to solo mining pool", "Use your own equipment", "Rent available ASICs", "Keep 100% of block rewards", "Real-time statistics", "Equipment management", "24/7 support", "Mobile app access"]',
  2
),
(
  'Miner Membership - Annual',
  'Annual membership with 2 months free',
  'membership',
  199.50,
  'yearly',
  '["Access to solo mining pool", "Use your own equipment", "Rent available ASICs", "Keep 100% of block rewards", "Real-time statistics", "Equipment management", "24/7 support", "Mobile app access", "Priority support"]',
  3
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active, sort_order);