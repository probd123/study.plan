/*
  # Fix friends table RLS policy for bidirectional friendship

  1. Security Changes
    - Update the INSERT policy on friends table to allow users to create both sides of friendship
    - Allow insertion when auth.uid() matches either user_id OR friend_id
    - This enables proper bidirectional friendship creation when accepting friend requests

  2. Changes Made
    - Drop existing INSERT policy that only allowed user_id = auth.uid()
    - Create new INSERT policy that allows user_id = auth.uid() OR friend_id = auth.uid()
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create friendships" ON friends;

-- Create new INSERT policy that allows bidirectional friendship creation
CREATE POLICY "Users can create friendships"
  ON friends
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);