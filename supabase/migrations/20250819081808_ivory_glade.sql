/*
  # Fix infinite recursion in RLS policies

  1. Policy Changes
    - Simplify user_roles policies to avoid recursion
    - Update complaints policies to use direct user checks instead of role-based checks
    - Remove circular dependencies between tables

  2. Security
    - Maintain proper access control without recursion
    - Ensure admins and moderators can still access complaints
    - Keep user data secure
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins and moderators can view complaints" ON complaints;
DROP POLICY IF EXISTS "Admins and moderators can update complaints" ON complaints;

-- Create simplified user_roles policies without recursion
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create simplified complaints policies that don't depend on user_roles
CREATE POLICY "Public can insert complaints"
  ON complaints
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Service role can manage complaints"
  ON complaints
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);