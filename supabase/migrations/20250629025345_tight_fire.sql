/*
  # Add demo flag to rental machines

  1. New Fields
    - Add `is_demo` boolean field to rental_machines table
    - Default value is false
  
  2. Updates
    - Add index for efficient filtering of demo equipment
    - Update existing demo equipment to set the flag
*/

-- Add is_demo field to rental_machines table
ALTER TABLE rental_machines ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_rental_machines_demo ON rental_machines(is_demo) WHERE is_demo = true;

-- Mark existing demo equipment
UPDATE rental_machines 
SET is_demo = true
WHERE 
  name ILIKE '%demo%' OR 
  model ILIKE '%demo%' OR 
  description ILIKE '%demo%' OR
  name ILIKE '%test%' OR
  model ILIKE '%test%';

-- Add comment to explain the purpose of the is_demo flag
COMMENT ON COLUMN rental_machines.is_demo IS 'Flag indicating if this is a demonstration machine that should be marked as such in the UI';