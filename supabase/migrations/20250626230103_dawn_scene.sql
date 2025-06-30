/*
  # Add agreement_accepted column to machine_owners table

  1. Changes
    - Add `agreement_accepted` column to `machine_owners` table
    - Add `agreement_accepted_at` column to track when agreement was accepted
    - Set default value for `agreement_accepted` to false

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add agreement_accepted column to machine_owners table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'machine_owners' AND column_name = 'agreement_accepted'
  ) THEN
    ALTER TABLE machine_owners ADD COLUMN agreement_accepted boolean DEFAULT false;
  END IF;
END $$;

-- Add agreement_accepted_at column to track when agreement was accepted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'machine_owners' AND column_name = 'agreement_accepted_at'
  ) THEN
    ALTER TABLE machine_owners ADD COLUMN agreement_accepted_at timestamptz;
  END IF;
END $$;