/*
  # Add unique constraint to machine_owners user_id

  1. Changes
    - Add UNIQUE constraint to `user_id` column in `machine_owners` table
    - This ensures each user can only have one owner profile
    - Enables proper upsert operations and prevents duplicate records

  2. Security
    - No changes to RLS policies needed
    - Maintains existing security model
*/

-- Add unique constraint to user_id column in machine_owners table
ALTER TABLE machine_owners ADD CONSTRAINT machine_owners_user_id_unique UNIQUE (user_id);