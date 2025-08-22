import React, { createContext, useContext, useState, useEffect } from 'react';
import { Friend, FriendRequest, StudySession, GroupMessage } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseReady } from '../lib/supabase';

interface FriendsContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  studySessions: StudySession[];
  groupMessages: GroupMessage[];
  sendFriendRequest: (email: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  rejectFriendRequest: (requestId: string) => Promise<boolean>;
  removeFriend: (friendId: string) => Promise<boolean>;
  updateStudyStatus: (status: 'studying' | 'break' | 'offline', subject?: string) => Promise<void>;
  sendGroupMessage: (message: string, mentions?: string[]) => Promise<void>;
  isLoading: boolean;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFriendsData();
      setupRealtimeSubscriptions();
    } else {
      setFriends([]);
      setFriendRequests([]);
      setStudySessions([]);
      setGroupMessages([]);
    }
  }, [user]);

  const loadFriendsData = async () => {
    if (!user) return;
    
    if (!isSupabaseReady) {
      console.warn('Supabase is not configured properly. Skipping data load.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Load friends and friend requests first
      await Promise.all([
        loadFriends(),
        loadFriendRequests()
      ]);
      
      // Then load study sessions and group messages
      await Promise.all([
        loadStudySessions(),
        loadGroupMessages()
      ]);
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriends = async () => {
    if (!user) return;

    try {
      // Get friends first
      const { data: friendsData, error } = await supabase
        .from('friends')
        .select(`
          id,
          user_id,
          friend_id,
          created_at,
          friend:friend_id (
            id,
            name,
            email
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading friends:', error);
        return;
      }

      if (!friendsData || friendsData.length === 0) {
        setFriends([]);
        return;
      }

      // Transform the data to match the Friend interface
      const transformedFriends = friendsData.map(f => {
        const friendUser = f.friend;
        return {
          id: f.id,
          user_id: f.user_id,
          friend_id: f.friend_id,
          friend_name: friendUser?.name || friendUser?.email?.split('@')[0] || `User ${f.friend_id.slice(0, 8)}`,
          friend_email: friendUser?.email || '',
          created_at: f.created_at
        };
      });

      setFriends(transformedFriends);
    } catch (error) {
      console.error('Error in loadFriends:', error);
      setFriends([]);
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;

    try {
      // Get friend requests first
      const { data: requestsData, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          sender:sender_id (
            id,
            name,
            email
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error loading friend requests:', error);
        return;
      }

      if (!requestsData || requestsData.length === 0) {
        setFriendRequests([]);
        return;
      }

      // Transform the data to match the FriendRequest interface
      const transformedRequests = requestsData.map(r => {
        const senderUser = r.sender;
        return {
          id: r.id,
          sender_id: r.sender_id,
          receiver_id: r.receiver_id,
          sender_name: senderUser?.name || senderUser?.email?.split('@')[0] || `User ${r.sender_id.slice(0, 8)}`,
          sender_email: senderUser?.email || '',
          status: r.status as 'pending' | 'accepted' | 'rejected',
          created_at: r.created_at
        };
      });

      setFriendRequests(transformedRequests);
    } catch (error) {
      console.error('Error in loadFriendRequests:', error);
      setFriendRequests([]);
    }
  };

  const loadStudySessions = async () => {
    if (!user) return;

    try {
      // Get fresh friends data to ensure we have the latest friend list
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          friend_id,
          friend:friend_id (
            id,
            name,
            email
          )
        `)
        .eq('user_id', user.id);

      if (friendsError) {
        console.error('Error loading friends for study sessions:', friendsError);
        return;
      }

      const friendIds = friendsData?.map(f => f.friend_id) || [];
      const allUserIds = [user.id, ...friendIds];

      const { data: sessionsData, error } = await supabase
        .from('study_sessions')
        .select(`
          id,
          user_id,
          status,
          subject,
          started_at,
          last_active,
          user:user_id (
            id,
            name,
            email
          )
        `)
        .in('user_id', allUserIds);

      if (error) {
        console.error('Error loading study sessions:', error);
        return;
      }

      if (!sessionsData || sessionsData.length === 0) {
        setStudySessions([]);
        return;
      }

      // Map user details to sessions data
      const sessionsWithDetails = sessionsData.map(s => {
        let userName: string;
        
        if (!userName && s.user_id === user.id) {
          // Current user
          userName = user.user_metadata?.name || user.email?.split('@')[0] || 'You';
        } else {
          // Friend user - get from the joined data or fallback
          const sessionUser = s.user;
          const friendData = friendsData?.find(f => f.friend_id === s.user_id);
          userName = sessionUser?.name || 
                    friendData?.friend?.name || 
                    sessionUser?.email?.split('@')[0] || 
                    friendData?.friend?.email?.split('@')[0] || 
                    `User ${s.user_id.slice(0, 8)}`;
        }
        
        return {
          id: s.id,
          user_id: s.user_id,
          user_name: userName,
          status: s.status as 'studying' | 'break' | 'offline',
          subject: s.subject,
          started_at: s.started_at,
          last_active: s.last_active
        };
      });

      setStudySessions(sessionsWithDetails);
    } catch (error) {
      console.error('Error in loadStudySessions:', error);
      setStudySessions([]);
    }
  };

  const loadGroupMessages = async () => {
    if (!user) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('group_messages')
        .select(`
          id,
          user_id,
          message,
          mentions,
          created_at,
          user:user_id (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading group messages:', error);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        setGroupMessages([]);
        return;
      }

      // Map user details to messages data
      const messagesWithDetails = messagesData.map(m => {
        let userName: string;
        
        if (!userName && m.user_id === user.id) {
          // Current user
          userName = user.user_metadata?.name || user.email?.split('@')[0] || 'You';
        } else {
          // Friend user - get from the joined data or fallback
          const messageUser = m.user;
          const friend = friends.find(f => f.friend_id === m.user_id);
          userName = messageUser?.name || 
                    friend?.friend_name || 
                    messageUser?.email?.split('@')[0] || 
                    friend?.friend_email?.split('@')[0] || 
                    `User ${m.user_id.slice(0, 8)}`;
        }
        
        return {
          id: m.id,
          user_id: m.user_id,
          user_name: userName,
          message: m.message,
          mentions: m.mentions || [],
          created_at: m.created_at
        };
      });

      setGroupMessages(messagesWithDetails.reverse());
    } catch (error) {
      console.error('Error in loadGroupMessages:', error);
      setGroupMessages([]);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to friend requests
    const friendRequestsSubscription = supabase
      .channel('friend_requests')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friend_requests' },
        () => loadFriendRequests()
      )
      .subscribe();

    // Subscribe to study sessions
    const studySessionsSubscription = supabase
      .channel('study_sessions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'study_sessions' },
        () => loadStudySessions()
      )
      .subscribe();

    // Subscribe to group messages
    const groupMessagesSubscription = supabase
      .channel('group_messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages' },
        () => loadGroupMessages()
      )
      .subscribe();

    return () => {
      friendRequestsSubscription.unsubscribe();
      studySessionsSubscription.unsubscribe();
      groupMessagesSubscription.unsubscribe();
    };
  };

  const sendFriendRequest = async (email: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('send_friend_request_safe', {
        sender_user_id: user.id,
        receiver_email: email.trim()
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send friend request');
      }
      
      return data?.success || false;
    } catch (error) {
      console.error('Error sending friend request:', error);
      if (error instanceof Error) {
        throw error; // Re-throw to preserve the specific error message
      }
      throw new Error('Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get the request details
      const { data: request, error: requestError } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('id', requestId)
        .single();

      if (requestError || !request) throw requestError;

      // Check if friendship already exists
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user_id.eq.${request.receiver_id},friend_id.eq.${request.sender_id}),and(user_id.eq.${request.sender_id},friend_id.eq.${request.receiver_id})`)
        .limit(1);

      if (checkError) throw checkError;

      // Only create friendship if it doesn't already exist
      if (!existingFriendship || existingFriendship.length === 0) {
        const { error: friendError } = await supabase
          .from('friends')
          .insert([
            { user_id: request.receiver_id, friend_id: request.sender_id },
            { user_id: request.sender_id, friend_id: request.receiver_id }
          ]);

        if (friendError) throw friendError;
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      await loadFriends();
      await loadFriendRequests();
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
  };

  const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      await loadFriendRequests();
      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return false;
    }
  };

  const removeFriend = async (friendId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

      if (error) throw error;

      await loadFriends();
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  };

  const updateStudyStatus = async (status: 'studying' | 'break' | 'offline', subject?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('study_sessions')
        .upsert({
          user_id: user.id,
          status,
          subject: subject || null,
          last_active: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating study status:', error);
    }
  };

  const sendGroupMessage = async (message: string, mentions: string[] = []) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          user_id: user.id,
          message,
          mentions
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending group message:', error);
    }
  };

  return (
    <FriendsContext.Provider value={{
      friends,
      friendRequests,
      studySessions,
      groupMessages,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend,
      updateStudyStatus,
      sendGroupMessage,
      isLoading
    }}>
      {children}
    </FriendsContext.Provider>
  );
};