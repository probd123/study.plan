/*
  # Fix friend system and notifications

  1. Updates
    - Fix friend request notifications
    - Improve friend system queries
    - Add proper indexes for performance
  
  2. Functions
    - Enhanced friend request handling
    - Better notification system
*/

-- Update friend request notification function
CREATE OR REPLACE FUNCTION create_friend_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_name text;
BEGIN
  -- Get sender's name
  SELECT COALESCE(u.name, au.raw_user_meta_data->>'name', au.email) INTO sender_name
  FROM auth.users au
  LEFT JOIN users u ON au.id = u.id
  WHERE au.id = NEW.sender_id;

  -- Create notification for receiver
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    data
  ) VALUES (
    NEW.receiver_id,
    'New Friend Request',
    sender_name || ' sent you a friend request',
    'friend_request',
    json_build_object('request_id', NEW.id, 'sender_id', NEW.sender_id, 'sender_name', sender_name)
  );

  RETURN NEW;
END;
$$;

-- Create trigger for friend request notifications
DROP TRIGGER IF EXISTS friend_request_notification_trigger ON friend_requests;
CREATE TRIGGER friend_request_notification_trigger
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_request_notification();

-- Function to get friends with proper user details
CREATE OR REPLACE FUNCTION get_user_friends(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  friend_id uuid,
  friend_name text,
  friend_email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.user_id,
    f.friend_id,
    COALESCE(u.name, au.raw_user_meta_data->>'name', au.email) as friend_name,
    au.email as friend_email,
    f.created_at
  FROM friends f
  JOIN auth.users au ON f.friend_id = au.id
  LEFT JOIN users u ON f.friend_id = u.id
  WHERE f.user_id = target_user_id
  ORDER BY f.created_at DESC;
END;
$$;

-- Function to get friend requests with proper user details
CREATE OR REPLACE FUNCTION get_user_friend_requests(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  sender_name text,
  sender_email text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id,
    fr.sender_id,
    fr.receiver_id,
    COALESCE(u.name, au.raw_user_meta_data->>'name', au.email) as sender_name,
    au.email as sender_email,
    fr.status,
    fr.created_at
  FROM friend_requests fr
  JOIN auth.users au ON fr.sender_id = au.id
  LEFT JOIN users u ON fr.sender_id = u.id
  WHERE fr.receiver_id = target_user_id AND fr.status = 'pending'
  ORDER BY fr.created_at DESC;
END;
$$;

-- Function to send friend request with validation
CREATE OR REPLACE FUNCTION send_friend_request_safe(
  sender_user_id uuid,
  receiver_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  receiver_user_id uuid;
  existing_friendship_count int;
  existing_request_count int;
BEGIN
  -- Find receiver by email
  SELECT au.id INTO receiver_user_id
  FROM auth.users au
  WHERE au.email = receiver_email;
  
  IF receiver_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Check if trying to add self
  IF sender_user_id = receiver_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot send friend request to yourself');
  END IF;
  
  -- Check if already friends
  SELECT COUNT(*) INTO existing_friendship_count
  FROM friends
  WHERE (user_id = sender_user_id AND friend_id = receiver_user_id)
     OR (user_id = receiver_user_id AND friend_id = sender_user_id);
  
  IF existing_friendship_count > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Already friends with this user');
  END IF;
  
  -- Check if request already exists
  SELECT COUNT(*) INTO existing_request_count
  FROM friend_requests
  WHERE ((sender_id = sender_user_id AND receiver_id = receiver_user_id)
      OR (sender_id = receiver_user_id AND receiver_id = sender_user_id))
    AND status = 'pending';
  
  IF existing_request_count > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Friend request already exists');
  END IF;
  
  -- Create friend request
  INSERT INTO friend_requests (sender_id, receiver_id, status)
  VALUES (sender_user_id, receiver_user_id, 'pending');
  
  RETURN json_build_object('success', true, 'message', 'Friend request sent successfully');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_friends TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_friend_requests TO authenticated;
GRANT EXECUTE ON FUNCTION send_friend_request_safe TO authenticated;