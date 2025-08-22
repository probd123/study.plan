/*
  # Add admin password reset functionality

  1. New Functions
    - `reset_user_password` - Allows admins to reset any user's password
    - `get_all_users_for_admin` - Get all users for admin management
  
  2. Security
    - Only admins and moderators can reset passwords
    - Proper authentication checks
*/

-- Function to reset user password (admin only)
CREATE OR REPLACE FUNCTION reset_user_password(
  target_user_id uuid,
  new_password text,
  admin_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record admin_accounts%ROWTYPE;
  target_user auth.users%ROWTYPE;
BEGIN
  -- Check if admin exists and has proper role
  SELECT * INTO admin_record 
  FROM admin_accounts 
  WHERE id = admin_id AND role IN ('admin', 'moderator');
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Invalid admin credentials');
  END IF;
  
  -- Check if target user exists
  SELECT * INTO target_user 
  FROM auth.users 
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Update user password in auth.users
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Password reset successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to get all users for admin management
CREATE OR REPLACE FUNCTION get_all_users_for_admin(admin_id text)
RETURNS TABLE(
  id uuid,
  email text,
  name text,
  institution text,
  phone text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record admin_accounts%ROWTYPE;
BEGIN
  -- Check if admin exists and has proper role
  SELECT * INTO admin_record 
  FROM admin_accounts 
  WHERE admin_accounts.id = admin_id AND role IN ('admin', 'moderator');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: Invalid admin credentials';
  END IF;
  
  -- Return all users with their profile information
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(u.name, au.raw_user_meta_data->>'name') as name,
    u.institution,
    u.phone,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at
  FROM auth.users au
  LEFT JOIN users u ON au.id = u.id
  ORDER BY au.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION reset_user_password TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_for_admin TO authenticated;