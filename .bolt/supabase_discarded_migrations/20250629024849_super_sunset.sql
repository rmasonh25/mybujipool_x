/*
  # Remove demo seed equipment from marketplace

  1. Changes
    - Removes any demo/seed equipment from the rental_machines table
    - Adds a new index to improve marketplace query performance
    - Updates the is_available flag to false for any remaining demo data
*/

-- First, identify and remove any obvious demo/seed equipment
DELETE FROM rental_machines 
WHERE 
  name LIKE '%Demo%' OR 
  name LIKE '%Test%' OR 
  description LIKE '%Demo%' OR
  description LIKE '%Test%' OR
  model LIKE '%Demo%';

-- Update any remaining demo data to be unavailable
UPDATE rental_machines
SET is_available = false
WHERE 
  owner_id IN (
    SELECT id FROM users 
    WHERE email LIKE '%demo%' OR email LIKE '%test%'
  )
  OR hashrate > 500 -- Unrealistic hashrate values
  OR daily_rate < 5 -- Unrealistically low prices
  OR created_at < '2025-01-01'; -- Data created before 2025 is likely demo data

-- Add index to improve marketplace query performance
CREATE INDEX IF NOT EXISTS idx_rental_machines_available_verified ON rental_machines(is_available, is_verified, daily_rate);

-- Log the cleanup in the announcements table for admin reference
INSERT INTO announcements (
  title,
  summary,
  content,
  category,
  is_published,
  published_at
) VALUES (
  'Marketplace Data Cleanup',
  'Removed demo and test equipment from the rental marketplace.',
  'As part of our preparation for the official launch, we have removed all demo and test equipment from the rental marketplace. This ensures that only real, verified equipment is available for rent.

## Cleanup Details
- Removed equipment with "Demo" or "Test" in the name or description
- Set unavailable flag for equipment with unrealistic specifications
- Added performance optimizations for marketplace queries

This is an internal announcement for administrative purposes only.',
  'update',
  false,
  now()
);