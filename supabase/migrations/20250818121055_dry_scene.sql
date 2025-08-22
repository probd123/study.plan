/*
  # Create notifications system

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `message` (text)
      - `type` (text) - complaint_reply, system, friend_request
      - `read` (boolean, default false)
      - `data` (jsonb) - additional data
      - `created_at` (timestamp)

  2. Updates to existing tables
    - Add reply fields to complaints table
      - `admin_reply` (text)
      - `replied_at` (timestamp)
      - `replied_by` (uuid, references auth.users)

  3. Security
    - Enable RLS on notifications table
    - Add policies for users to manage their own notifications
    - Add trigger to create notifications when complaints are replied to
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add reply fields to complaints table
DO $$
BEGIN
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
    ALTER TABLE complaints ADD COLUMN replied_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Function to create notification when complaint is replied
CREATE OR REPLACE FUNCTION create_complaint_reply_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if admin_reply was added
  IF OLD.admin_reply IS NULL AND NEW.admin_reply IS NOT NULL THEN
    -- Find the user who submitted the complaint by email
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      u.id,
      'Reply to your complaint',
      'We have replied to your complaint: ' || NEW.subject,
      'complaint_reply',
      jsonb_build_object(
        'complaint_id', NEW.id,
        'complaint_subject', NEW.subject,
        'admin_reply', NEW.admin_reply
      )
    FROM users u
    WHERE u.email = NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for complaint replies
DROP TRIGGER IF EXISTS complaint_reply_notification_trigger ON complaints;
CREATE TRIGGER complaint_reply_notification_trigger
  AFTER UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION create_complaint_reply_notification();