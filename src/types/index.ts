export interface User {
  id: string;
  name: string;
  email: string;
  institution?: string;
  phone?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Exam {
  id: string;
  subject: string;
  date: string;
  time: string;
}

export interface TimerSettings {
  workTime: number;
  breakTime: number;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  friend_name: string;
  friend_email: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  sender_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  user_name: string;
  status: 'studying' | 'break' | 'offline';
  subject?: string;
  started_at: string;
  last_active: string;
}

export interface GroupMessage {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  mentions: string[];
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  dark_mode: boolean;
  notifications: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  is_group_note: boolean;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  created_at: string;
  admin_reply?: string;
  replied_at?: string;
  replied_by?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: 'user' | 'moderator' | 'admin';
  assigned_by: string;
  created_at: string;
}