/*
  # Fix get_all_users_for_admin function type mismatch

  1. Function Updates
    - Fix type mismatch in get_all_users_for_admin function
    - Ensure all returned columns match expected text types
    - Cast varchar columns to text to resolve the mismatch

  2. Changes
    - Update the function to properly cast all columns to text type
    - This resolves the "structure of query does not match function result type" error
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_all_users_for_admin();

-- Recreate the function with proper type casting
CREATE OR REPLACE FUNCTION get_all_users_for_admin()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  institution text,
  phone text,
  created_at timestamptz,
  updated_at timestamptz,
  role text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    CAST(u.name AS text),
    CAST(u.email AS text),
    CAST(u.institution AS text),
    CAST(u.phone AS text),
    u.created_at,
    u.updated_at,
    COALESCE(CAST(ur.role AS text), 'user'::text) as role
  FROM users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  ORDER BY u.created_at DESC;
END;
$$;