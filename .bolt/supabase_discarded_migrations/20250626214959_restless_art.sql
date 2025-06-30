/*
  # Add INSERT policy for order_items table

  1. Security
    - Add policy for authenticated users to insert order items for their own orders
    - This allows the checkout process to create order items when users place orders

  The policy ensures users can only create order items for orders that belong to them,
  maintaining data security while enabling the cart checkout functionality.
*/

CREATE POLICY "Users can insert order items for their own orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE user_id = uid()
    )
  );