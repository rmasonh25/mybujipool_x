/*
  # Fix order_items RLS policy for checkout

  1. Security
    - Add INSERT policy for order_items table
    - Allow authenticated users to insert order items for their own orders
    - Use auth.uid() instead of uid() for Supabase authentication
*/

CREATE POLICY "Users can insert order items for their own orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );