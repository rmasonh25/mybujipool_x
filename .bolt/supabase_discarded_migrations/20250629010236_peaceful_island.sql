/*
  # Fix order_items RLS policy for checkout (handle existing policy)

  1. Security
    - Drop existing policy if it exists and recreate with correct auth.uid() function
    - Allow authenticated users to insert order items for their own orders
*/

-- Drop the policy if it exists and recreate it with the correct function
DROP POLICY IF EXISTS "Users can insert order items for their own orders" ON order_items;

CREATE POLICY "Users can insert order items for their own orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );