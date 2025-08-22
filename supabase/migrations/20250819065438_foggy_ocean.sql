/*
  # Fix Admin System and Add Moderator Support

  1. New Tables
    - Update user_roles table to support admin login with ID/password
    - Add admin_accounts table for admin login system
    - Fix complaints table and policies
    - Add proper triggers and functions

  2. Security
    - Enable RLS on all tables
    - Add proper policies for admin and moderator access
    - Add complaint reply notifications

  3. Changes
    - Fix donators table and policies
    - Add proper admin authentication system
    - Add moderator creation functionality
*/

-- Create admin_accounts table for admin login
CREATE TABLE IF NOT EXISTS admin_accounts (
  id text PRIMARY KEY,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  can_change_password boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default admin account
INSERT INTO admin_accounts (id, password_hash, name, role) 
VALUES ('2513967', crypt('Srijon', gen_salt('bf')), 'Admin', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on admin_accounts
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;

-- Admin accounts policies
CREATE POLICY "Admins can manage admin accounts"
  ON admin_accounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_accounts aa 
      WHERE aa.id = current_setting('app.current_admin_id', true) 
      AND aa.role = 'admin'
    )
  );

-- Fix complaints table - ensure it exists with proper structure
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'admin_reply'
  ) THEN
    ALTER TABLE complaints ADD COLUMN admin_reply text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'replied_at'
  ) THEN
    ALTER TABLE complaints ADD COLUMN replied_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'replied_by'
  ) THEN
    ALTER TABLE complaints ADD COLUMN replied_by text;
  END IF;
END $$;

-- Fix donators table policies
DROP POLICY IF EXISTS "Anyone can view donators" ON donators;
CREATE POLICY "Anyone can view donators"
  ON donators
  FOR SELECT
  TO public
  USING (true);

-- Add policy for inserting donators
CREATE POLICY "Anyone can add donators"
  ON donators
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Fix complaints policies for admin/moderator access
DROP POLICY IF EXISTS "Moderators and admins can view complaints" ON complaints;
DROP POLICY IF EXISTS "Moderators and admins can update complaints" ON complaints;

CREATE POLICY "Admins and moderators can view complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('moderator', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_accounts aa
      WHERE aa.id = current_setting('app.current_admin_id', true)
      AND aa.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can update complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('moderator', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_accounts aa
      WHERE aa.id = current_setting('app.current_admin_id', true)
      AND aa.role IN ('admin', 'moderator')
    )
  );

-- Function to authenticate admin
CREATE OR REPLACE FUNCTION authenticate_admin(admin_id text, admin_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record admin_accounts;
  result json;
BEGIN
  SELECT * INTO admin_record
  FROM admin_accounts
  WHERE id = admin_id
  AND password_hash = crypt(admin_password, password_hash);

  IF admin_record.id IS NOT NULL THEN
    -- Update last login
    UPDATE admin_accounts 
    SET updated_at = now() 
    WHERE id = admin_id;

    result := json_build_object(
      'success', true,
      'admin', json_build_object(
        'id', admin_record.id,
        'name', admin_record.name,
        'role', admin_record.role,
        'can_change_password', admin_record.can_change_password
      )
    );
  ELSE
    result := json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  RETURN result;
END;
$$;

-- Function to change admin password
CREATE OR REPLACE FUNCTION change_admin_password(admin_id text, old_password text, new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record admin_accounts;
  result json;
BEGIN
  -- Verify old password
  SELECT * INTO admin_record
  FROM admin_accounts
  WHERE id = admin_id
  AND password_hash = crypt(old_password, password_hash);

  IF admin_record.id IS NOT NULL THEN
    -- Update password
    UPDATE admin_accounts 
    SET password_hash = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = admin_id;

    result := json_build_object('success', true, 'message', 'Password updated successfully');
  ELSE
    result := json_build_object('success', false, 'error', 'Invalid current password');
  END IF;

  RETURN result;
END;
$$;

-- Function to create moderator account
CREATE OR REPLACE FUNCTION create_moderator_account(admin_id text, mod_id text, mod_password text, mod_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record admin_accounts;
  result json;
BEGIN
  -- Verify admin
  SELECT * INTO admin_record
  FROM admin_accounts
  WHERE id = admin_id AND role = 'admin';

  IF admin_record.id IS NOT NULL THEN
    -- Create moderator account
    INSERT INTO admin_accounts (id, password_hash, name, role)
    VALUES (mod_id, crypt(mod_password, gen_salt('bf')), mod_name, 'moderator');

    result := json_build_object('success', true, 'message', 'Moderator account created successfully');
  ELSE
    result := json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  RETURN result;
EXCEPTION
  WHEN unique_violation THEN
    result := json_build_object('success', false, 'error', 'Moderator ID already exists');
    RETURN result;
END;
$$;

-- Function to send complaint reply notification
CREATE OR REPLACE FUNCTION create_complaint_reply_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create notification if admin_reply was added
  IF OLD.admin_reply IS NULL AND NEW.admin_reply IS NOT NULL THEN
    -- Try to find user by email and create notification
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      u.id,
      'Reply to Your Complaint',
      'We have replied to your complaint: "' || NEW.subject || '". Check your email for the full response.',
      'complaint_reply',
      json_build_object('complaint_id', NEW.id)
    FROM users u
    WHERE u.email = NEW.email;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for complaint reply notifications
DROP TRIGGER IF EXISTS complaint_reply_notification_trigger ON complaints;
CREATE TRIGGER complaint_reply_notification_trigger
  AFTER UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION create_complaint_reply_notification();

-- Update updated_at trigger for admin_accounts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_admin_accounts_updated_at
  BEFORE UPDATE ON admin_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();