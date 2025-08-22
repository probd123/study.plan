/*
  # Enhanced User Statistics and Complaint Management System

  1. New Tables
    - `user_statistics` - Track total user counts and other metrics
    - Enhanced `complaints` table with better tracking

  2. Functions
    - `update_user_statistics()` - Automatically update user counts
    - `get_total_users()` - Get current user count

  3. Triggers
    - Auto-update user statistics when users are added/removed

  4. Security
    - Enable RLS on all tables
    - Add appropriate policies for admin access
*/

-- Create user statistics table
CREATE TABLE IF NOT EXISTS user_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_users integer DEFAULT 0,
  total_complaints integer DEFAULT 0,
  pending_complaints integer DEFAULT 0,
  resolved_complaints integer DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;

-- Allow public to read statistics
CREATE POLICY "Anyone can view user statistics"
  ON user_statistics
  FOR SELECT
  TO public
  USING (true);

-- Allow service role to manage statistics
CREATE POLICY "Service role can manage statistics"
  ON user_statistics
  FOR ALL
  TO service_role
  USING (true);

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count integer;
  total_complaints_count integer;
  pending_complaints_count integer;
  resolved_complaints_count integer;
BEGIN
  -- Count total users from auth.users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Count complaints
  SELECT COUNT(*) INTO total_complaints_count FROM complaints;
  SELECT COUNT(*) INTO pending_complaints_count FROM complaints WHERE status = 'pending';
  SELECT COUNT(*) INTO resolved_complaints_count FROM complaints WHERE status = 'resolved';
  
  -- Update or insert statistics
  INSERT INTO user_statistics (
    id,
    total_users,
    total_complaints,
    pending_complaints,
    resolved_complaints,
    last_updated
  ) VALUES (
    gen_random_uuid(),
    user_count,
    total_complaints_count,
    pending_complaints_count,
    resolved_complaints_count,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    total_complaints = EXCLUDED.total_complaints,
    pending_complaints = EXCLUDED.pending_complaints,
    resolved_complaints = EXCLUDED.resolved_complaints,
    last_updated = EXCLUDED.last_updated;
  
  -- Keep only the latest record
  DELETE FROM user_statistics 
  WHERE id NOT IN (
    SELECT id FROM user_statistics 
    ORDER BY last_updated DESC 
    LIMIT 1
  );
END;
$$;

-- Function to get current statistics
CREATE OR REPLACE FUNCTION get_current_statistics()
RETURNS TABLE (
  total_users integer,
  total_complaints integer,
  pending_complaints integer,
  resolved_complaints integer,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update statistics first
  PERFORM update_user_statistics();
  
  -- Return current statistics
  RETURN QUERY
  SELECT 
    us.total_users,
    us.total_complaints,
    us.pending_complaints,
    us.resolved_complaints,
    us.last_updated
  FROM user_statistics us
  ORDER BY us.last_updated DESC
  LIMIT 1;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_status_created ON complaints(status, created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_replied_by ON complaints(replied_by);

-- Add a trigger to update statistics when complaints change
CREATE OR REPLACE FUNCTION trigger_update_statistics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM update_user_statistics();
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for complaints
DROP TRIGGER IF EXISTS complaints_statistics_trigger ON complaints;
CREATE TRIGGER complaints_statistics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_statistics();

-- Initialize statistics
SELECT update_user_statistics();

-- Add better complaint tracking columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE complaints ADD COLUMN user_agent text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE complaints ADD COLUMN ip_address text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'priority'
  ) THEN
    ALTER TABLE complaints ADD COLUMN priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;
END $$;

-- Enhanced complaint management view for admins
CREATE OR REPLACE VIEW admin_complaints_view AS
SELECT 
  c.*,
  CASE 
    WHEN c.replied_by IS NOT NULL THEN u.name
    ELSE NULL
  END as replied_by_name,
  CASE
    WHEN c.created_at > now() - interval '1 day' THEN 'new'
    WHEN c.created_at > now() - interval '7 days' THEN 'recent'
    ELSE 'old'
  END as age_category
FROM complaints c
LEFT JOIN users u ON c.replied_by = u.id
ORDER BY 
  CASE c.status WHEN 'pending' THEN 1 ELSE 2 END,
  CASE c.priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'normal' THEN 3 
    WHEN 'low' THEN 4 
    ELSE 5 
  END,
  c.created_at DESC;

-- Grant access to the view for authenticated users
GRANT SELECT ON admin_complaints_view TO authenticated;