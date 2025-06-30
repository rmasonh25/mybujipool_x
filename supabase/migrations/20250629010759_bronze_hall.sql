/*
  # New Business Model Migration

  1. New Tables
    - `announcements` - For news and announcements
    - Updated `products` table structure for new pricing tiers
    - `user_subscriptions` - Track user subscription details
    
  2. Changes
    - Restructure pricing model
    - Add announcement system
    - Update user capabilities based on subscription tier
    
  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  content text NOT NULL,
  image_url text,
  author_id uuid REFERENCES users(id),
  category text DEFAULT 'general',
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  subscription_tier text NOT NULL, -- 'launch_special', 'single', 'multi', 'enterprise'
  machine_limit integer NOT NULL DEFAULT 1,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text DEFAULT 'active', -- 'active', 'cancelled', 'past_due'
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "Anyone can read published announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage announcements"
  ON announcements
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users WHERE email LIKE '%@mybuji.com'
  ));

-- User subscriptions policies
CREATE POLICY "Users can read their own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Insert new product tiers
INSERT INTO products (name, description, type, price, billing_period, features, is_active, sort_order) VALUES
(
  'Launch Special',
  'Limited time offer - Solo mining access with 1 machine slot',
  'subscription',
  9.98,
  'monthly',
  '["Solo mining pool access", "1 machine slot (own or rent)", "Real-time statistics", "24/7 support", "Launch special pricing"]'::jsonb,
  true,
  1
),
(
  'Single Machine Plan',
  'Perfect for individual miners with one machine',
  'subscription',
  19.95,
  'monthly',
  '["Solo mining pool access", "1 machine slot (own or rent)", "Real-time statistics", "24/7 support", "Equipment management"]'::jsonb,
  true,
  2
),
(
  '10 Machine Plan',
  'Ideal for serious miners with multiple machines',
  'subscription',
  149.95,
  'monthly',
  '["Solo mining pool access", "10 machine slots (own or rent)", "Real-time statistics", "Priority support", "Advanced analytics", "Bulk rental discounts"]'::jsonb,
  true,
  3
),
(
  'Enterprise Plan',
  'Custom solution for large-scale operations',
  'subscription',
  999.00,
  'monthly',
  '["Solo mining pool access", "Unlimited machine slots", "Dedicated support", "Custom integrations", "Volume discounts", "SLA guarantees"]'::jsonb,
  true,
  4
);

-- Insert sample announcements
INSERT INTO announcements (title, summary, content, category, is_featured, is_published, published_at, author_id) VALUES
(
  'Mybuji Platform Launch - July 15, 2025',
  'We are excited to announce the official launch of Mybuji, the revolutionary solo mining platform that lets you keep 100% of block rewards.',
  'After months of development and testing, we are thrilled to announce that Mybuji will officially launch on July 15, 2025. Our platform represents a fundamental shift in how Bitcoin mining works, giving individual miners the opportunity to mine solo while keeping 100% of any block rewards they find.

## What Makes Mybuji Different

Unlike traditional mining pools where rewards are shared among thousands of miners, Mybuji enables true solo mining. When you find a block, you keep the entire 3.125 BTC reward plus transaction fees - potentially worth over $200,000 at current prices.

## Launch Special Pricing

To celebrate our launch, we are offering special pricing for early adopters:
- Launch Special: $9.98/month (50% off regular price)
- Valid for the first 3 months
- Limited time offer until July 15, 2025

## Key Features

- **Non-custodial mining**: Mine directly to your wallet
- **Use your own equipment**: Connect ASICs, GPUs, or CPUs
- **Rent additional hashpower**: Access professional mining equipment
- **Real-time statistics**: Monitor your mining performance
- **24/7 support**: Get help when you need it

Join the solo mining revolution and start your journey toward potentially life-changing Bitcoin rewards.',
  'announcement',
  true,
  true,
  now(),
  (SELECT id FROM users LIMIT 1)
),
(
  'New Pricing Tiers Now Available',
  'We have restructured our pricing to better serve miners of all sizes, from individual hobbyists to enterprise operations.',
  'We are excited to introduce our new pricing structure designed to accommodate miners of all sizes and needs.

## New Pricing Tiers

### Launch Special - $9.98/month
Perfect for getting started with solo mining. Includes access to our solo mining pool and support for 1 machine (your own or rented).

### Single Machine Plan - $19.95/month
Ideal for individual miners with one machine. Full access to all platform features with support for 1 machine slot.

### 10 Machine Plan - $149.95/month
Designed for serious miners operating multiple machines. Includes priority support, advanced analytics, and bulk rental discounts.

### Enterprise Plan - Custom Pricing
For large-scale operations requiring unlimited machine slots, dedicated support, and custom integrations. Contact us for volume pricing.

## Flexible Mining Options

Each plan allows you to:
- Use your own mining equipment
- Rent additional hashpower from our marketplace
- Combine both approaches to optimize your mining strategy

## Competitive Pricing

Our pricing is designed to be highly competitive with platforms like NiceHash and Brains, while offering the unique advantage of solo mining with 100% reward retention.',
  'product',
  true,
  true,
  now() - interval '2 days',
  (SELECT id FROM users LIMIT 1)
),
(
  'Enhanced Security and Performance Updates',
  'We have implemented several security enhancements and performance improvements to ensure the best possible mining experience.',
  'We are committed to providing the most secure and reliable solo mining platform available. This week, we have deployed several important updates:

## Security Enhancements

- **Enhanced encryption**: All mining pool communications now use advanced encryption protocols
- **Multi-factor authentication**: Optional 2FA for additional account security
- **Audit logging**: Comprehensive logging of all mining activities and transactions

## Performance Improvements

- **Reduced latency**: Optimized mining pool infrastructure for faster share submission
- **Improved uptime**: Enhanced monitoring and failover systems for 99.9% uptime
- **Better statistics**: More detailed real-time mining statistics and historical data

## New Features

- **Mobile app preview**: Beta version of our mobile app now available for testing
- **Advanced alerts**: Customizable notifications for mining events and performance
- **API access**: RESTful API for advanced users and integrations

## What is Next

We continue to work on exciting new features including:
- Pool performance analytics
- Automated mining optimization
- Enhanced rental marketplace features
- Integration with popular mining management tools

Stay tuned for more updates as we continue to improve the Mybuji platform.',
  'update',
  false,
  true,
  now() - interval '5 days',
  (SELECT id FROM users LIMIT 1)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_featured ON announcements(is_featured, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);