/*
  # MyBujiPool v2 Pricing Model Update

  1. New Pricing Structure
    - Launch Special: $9.95/month (1 rig)
    - 10-Rig Block: $79.99/month ($7.99 per rig)
    - Enterprise: Custom pricing
    - No commission on rentals (0% vs competitors' 2-4%)

  2. Competitive Analysis Integration
    - Pricing designed to beat NiceHash (2%) and MRR (3%)
    - Fixed monthly fees vs percentage-based charges
    - Better value for high-volume miners

  3. Disclaimers
    - Startup pricing for first year
    - Right to adjust pricing with notice
*/

-- Update existing products with new v2 pricing
UPDATE products SET 
  price = 9.95,
  name = 'Launch Special - Single Rig',
  description = 'Startup pricing for early adopters - Solo mining with 1 rig slot',
  features = '["Solo mining pool access", "1 rig slot (own or rent)", "0% commission on rentals", "Real-time statistics", "24/7 support", "Startup pricing (subject to change)"]'::jsonb
WHERE name LIKE '%Launch Special%';

UPDATE products SET 
  price = 19.95,
  name = 'Single Rig Plan',
  description = 'Perfect for individual miners - Solo mining with 1 rig slot',
  features = '["Solo mining pool access", "1 rig slot (own or rent)", "0% commission on rentals", "Real-time statistics", "24/7 support", "Equipment management"]'::jsonb
WHERE name LIKE '%Single Machine%';

UPDATE products SET 
  price = 79.99,
  name = '10-Rig Block Plan',
  description = 'Best value for serious miners - $7.99 per rig per month',
  features = '["Solo mining pool access", "10 rig slots (own or rent)", "0% commission on rentals", "Priority support", "Advanced analytics", "Bulk rental discounts", "API access", "Best value per rig"]'::jsonb
WHERE name LIKE '%10 Machine%';

UPDATE products SET 
  price = 999.00,
  name = 'Enterprise Plan',
  description = 'Custom solution for large-scale operations - Contact for volume pricing',
  features = '["Solo mining pool access", "Unlimited rig slots", "0% commission on rentals", "Dedicated support manager", "Custom integrations", "Volume discounts", "SLA guarantees", "White-label options", "Priority feature requests"]'::jsonb
WHERE name LIKE '%Enterprise%';

-- Add new competitive advantage product for comparison
INSERT INTO products (name, description, type, price, billing_period, features, is_active, sort_order) VALUES
(
  'Competitive Analysis',
  'See how MyBujiPool v2 compares to NiceHash and traditional pools',
  'comparison',
  0.00,
  'one-time',
  '["Fixed monthly fees vs 2-4% commissions", "0% rental commissions", "100% block reward retention", "Predictable costs", "Better value for high-volume miners", "Solo mining advantage"]'::jsonb,
  false,
  5
) ON CONFLICT DO NOTHING;

-- Create pricing disclaimers table
CREATE TABLE IF NOT EXISTS pricing_disclaimers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL, -- 'startup_pricing', 'pricing_changes', 'competitive_analysis'
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pricing_disclaimers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to disclaimers
CREATE POLICY "Anyone can read active disclaimers"
  ON pricing_disclaimers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert pricing disclaimers
INSERT INTO pricing_disclaimers (title, content, type) VALUES
(
  'Startup Pricing Notice',
  'Current pricing represents our introductory rates for the first year of operation. As a startup platform, we reserve the right to adjust pricing with 30 days advance notice to existing subscribers. Early adopters will receive preferential pricing consideration for future rate changes.',
  'startup_pricing'
),
(
  'Pricing Change Policy',
  'MyBuji reserves the right to modify subscription pricing at any time. Existing subscribers will receive 30 days advance notice of any pricing changes. Price increases will not affect current subscribers until their next renewal period. We are committed to providing competitive pricing that delivers value to our mining community.',
  'pricing_changes'
),
(
  'Competitive Analysis Methodology',
  'Our pricing comparison is based on publicly available information from competitor websites and assumes average mining volumes. Actual costs may vary based on individual usage patterns, market conditions, and platform-specific features. Competitor pricing and fee structures are subject to change without notice.',
  'competitive_analysis'
),
(
  'No Rental Commission Policy',
  'Unlike traditional platforms that charge 2-4% commission on rental earnings, MyBuji charges 0% commission on equipment rentals. Our revenue comes exclusively from subscription fees, aligning our success with yours. This policy is subject to our terms of service and may be adjusted with advance notice.',
  'rental_commission'
);

-- Update announcements with v2 pricing information
INSERT INTO announcements (title, summary, content, category, is_featured, is_published, published_at) VALUES
(
  'Introducing MyBujiPool v2 - Competitive Pricing That Beats the Industry',
  'Our new pricing model is designed to directly compete with NiceHash and MiningRigRentals while offering the unique advantage of solo mining with 0% rental commissions.',
  '# MyBujiPool v2: Revolutionary Pricing Model

We are excited to announce MyBujiPool v2, featuring a completely redesigned pricing structure that puts more money in miners'' pockets.

## Competitive Analysis: Why We Win

### Traditional Platform Costs (Monthly)
- **NiceHash**: 2% commission = $100-200+ for high-volume miners
- **MiningRigRentals**: 3% commission = $150-300+ for high-volume miners  
- **Traditional Pools**: 1-3% of rewards = $50-150+ ongoing fees

### MyBujiPool v2 Costs (Monthly)
- **Single Rig**: $9.95/month (startup pricing)
- **10-Rig Block**: $79.99/month ($7.99 per rig)
- **Enterprise**: Custom volume pricing
- **Rental Commission**: 0% (vs competitors'' 2-4%)

## Real-World Example

**Scenario**: 1,000 rigs earning $900/month each in rental fees

- **MyBujiPool v2**: $7,990/month total cost (10-rig blocks)
- **NiceHash**: $18,000/month in commissions  
- **MiningRigRentals**: $27,000/month in commissions

**Result**: Miners keep $10,000-19,000 more per month with MyBujiPool v2!

## Key Advantages

### For Miners
- **Highest take-home earnings**: $892.01/month vs $882 (NiceHash) vs $873 (MRR)
- **Predictable costs**: Fixed monthly fees vs variable percentages
- **Solo mining potential**: 100% block reward retention (3.125+ BTC)
- **Dual revenue streams**: Mining rewards + rental income

### For Platform
- **Sustainable model**: Predictable recurring revenue
- **Aligned incentives**: We succeed when you succeed
- **Scalable growth**: Revenue grows with user base, not market volatility

## Startup Pricing Disclaimer

Current rates represent our introductory pricing for the first year. As we scale and add features, pricing may be adjusted with 30 days notice. Early adopters will receive preferential consideration for future rate changes.

## Get Started Today

Take advantage of our competitive pricing and join the solo mining revolution. With 0% rental commissions and fixed monthly fees, you''ll keep more of what you earn while having the chance to win life-changing block rewards.

*Pricing comparison based on publicly available competitor information and average mining volumes. Individual results may vary.*',
  'announcement',
  true,
  true,
  now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_disclaimers_type ON pricing_disclaimers(type, is_active);