/*
  # Add INSERT policy for user registration

  1. Security Changes
    - Add INSERT policy for `users` table to allow new user registration
    - Policy allows authenticated users to insert their own user record during registration
    - Uses auth.uid() to ensure users can only create records for themselves

  This fixes the "new row violates row-level security policy" error during user registration.
*/

-- Add INSERT policy for users table to allow registration
CREATE POLICY "Users can insert their own data during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);