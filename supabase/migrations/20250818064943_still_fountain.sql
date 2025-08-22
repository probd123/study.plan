/*
  # Add Friend System and Group Study Features

  1. New Tables
    - `friends` - Friend relationships between users
    - `friend_requests` - Pending friend requests
    - `study_sessions` - Active study sessions for users
    - `group_messages` - Group chat messages
    - `user_preferences` - User settings including dark mode

  2. Security
    - Enable RLS on all new tables
    - Add policies for friends, messages, and study sessions
    - Ensure users can only see their own data and friends' data

  3. Features
    - Friend request system
    - Real-time study status tracking
    - Group chat with mentions
    - Dark mode preferences
*/

-- Friends table for managing friendships
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Friend requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Study sessions for tracking who's studying
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text DEFAULT 'offline' CHECK (status IN ('studying', 'break', 'offline')),
  subject text,
  started_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Group messages for chat
CREATE TABLE IF NOT EXISTS group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  mentions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- User preferences for dark mode and other settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dark_mode boolean DEFAULT false,
  notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Friends policies
CREATE POLICY "Users can view their friendships"
  ON friends
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can create friendships"
  ON friends
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their friendships"
  ON friends
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Friend requests policies
CREATE POLICY "Users can view their friend requests"
  ON friend_requests
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON friend_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update received requests"
  ON friend_requests
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

-- Study sessions policies
CREATE POLICY "Users can view friends' study sessions"
  ON study_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    user_id IN (
      SELECT friend_id FROM friends WHERE user_id = auth.uid()
      UNION
      SELECT user_id FROM friends WHERE friend_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their study session"
  ON study_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Group messages policies
CREATE POLICY "Friends can view group messages"
  ON group_messages
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT friend_id FROM friends WHERE user_id = auth.uid()
      UNION
      SELECT user_id FROM friends WHERE friend_id = auth.uid()
    )
  );

CREATE POLICY "Users can send group messages"
  ON group_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User preferences policies
CREATE POLICY "Users can manage their preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();