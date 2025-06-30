/*
  # Clean up pricing products

  1. Changes
     - Remove duplicate Launch Special products
     - Remove deprecated Miner Membership
     - Remove deprecated Annual Membership
     - Update Enterprise Plan to be quote-only
     - Set correct sort order for remaining products
*/

-- First, deactivate all deprecated or duplicate products
UPDATE products 
SET is_active = false
WHERE 
  (name LIKE '%Launch Special%' AND id NOT IN (
    SELECT id FROM products 
    WHERE name LIKE '%Launch Special%' 
    ORDER BY created_at DESC 
    LIMIT 1
  )) OR
  name LIKE '%Miner Membership%' OR
  name LIKE '%Annual%' OR
  (name LIKE '%Enterprise%' AND name NOT LIKE '%Enterprise Plan%');

-- Update Enterprise Plan to be quote-only
UPDATE products
SET 
  price = 0.00,
  description = 'Custom solution for large-scale operations - Contact for volume pricing',
  features = COALESCE(features, '[]'::jsonb) || '"Quote only - contact sales"'::jsonb
WHERE name = 'Enterprise Plan' AND is_active = true;

-- Ensure correct sort order for active products
UPDATE products SET sort_order = 1 WHERE name LIKE '%Launch Special%' AND is_active = true;
UPDATE products SET sort_order = 2 WHERE name LIKE '%Single Rig Plan%' AND is_active = true;
UPDATE products SET sort_order = 3 WHERE name LIKE '%10-Rig%' AND is_active = true;
UPDATE products SET sort_order = 4 WHERE name = 'Enterprise Plan' AND is_active = true;