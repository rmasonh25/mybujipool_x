/*
  # Update pricing structure and add comprehensive FAQ

  1. Updates
    - Update product pricing to be more competitive
    - Add comprehensive FAQ content
    - Ensure pricing is competitive with NiceHash/Brains

  2. Changes
    - Launch Special: $9.98/month (50% off)
    - Single Machine: $19.95/month  
    - 10 Machine: $99.95/month (reduced from $149.95)
    - Enterprise: Custom pricing
*/

-- Update existing product pricing
UPDATE products SET 
  price = 99.95,
  description = 'Perfect for serious miners with multiple machines - now more affordable'
WHERE name = '10 Machine Plan';

-- Update features for better value proposition
UPDATE products SET 
  features = '["Solo mining pool access", "10 machine slots (own or rent)", "Real-time statistics", "Priority support", "Advanced analytics", "Bulk rental discounts", "API access"]'::jsonb
WHERE name = '10 Machine Plan';

UPDATE products SET 
  features = '["Solo mining pool access", "Unlimited machine slots", "Dedicated support manager", "Custom integrations", "Volume discounts", "SLA guarantees", "White-label options", "Priority feature requests"]'::jsonb
WHERE name = 'Enterprise Plan';