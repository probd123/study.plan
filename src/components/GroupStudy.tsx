import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Send, UserPlus, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendsContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import Sidebar from './Sidebar';

interface GroupMessage {
  id: string;
  user_id: string;
  message: string;
  mentions: string[];
  created_at: string;
  user_name: string;
}

const GroupStudy: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { friends, studySessions, isLoading } = useFriends();
  
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('group_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'group_messages' },
        (payload) => {
          const newMessage = payload.new as GroupMessage;
          // Get user name from friends list or current user
          const userName = newMessage.user_id === user?.id 
            ? (user?.user_metadata?.name || user?.email || 'You')
            : friends.find(f => f.friend_id === newMessage.user_id)?.friend_name || 'Unknown User';
          
          setMessages(prev => [...prev, { ...newMessage, user_name: userName }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friends]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Add user names to messages
      const messagesWithNames = data.map(msg => ({
        ...msg,
        user_name: msg.user_id === user?.id 
          ? (user?.user_metadata?.name || user?.email || 'You')
          : friends.find(f => f.friend_id === msg.user_id)?.friend_name || 'Unknown User'
      }));

      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          user_id: user.id,
          message: newMessage.trim(),
          mentions: selectedFriends
        });

      if (error) throw error;

      setNewMessage('');
      setSelectedFriends([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStudyingFriends = () => studySessions.filter(s => s.status === 'studying');

  if (isLoading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading group study...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      
      <div className="flex-1 flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-1`}>Group Study</h1>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Study together with your friends • {friends.length} friends online
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Users className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getStudyingFriends().length} studying now
                </span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                  No messages yet
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Start a conversation with your study group!
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.user_id === user?.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-200 border border-gray-600'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {message.user_id !== user?.id && (
                      <div className={`text-xs font-medium mb-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {message.user_name}
                      </div>
                    )}
                    <div className="break-words">{message.message}</div>
                    <div className={`text-xs mt-1 ${
                      message.user_id === user?.id 
                        ? 'text-blue-100' 
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4`}>
            {selectedFriends.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {selectedFriends.map(friendId => {
                    const friend = friends.find(f => f.friend_id === friendId);
                    return (
                      <span
                        key={friendId}
                        className={`px-3 py-1 rounded-full text-sm ${
                          isDarkMode 
                            ? 'bg-blue-900 bg-opacity-30 text-blue-300 border border-blue-600'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        @{friend?.friend_name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className={`w-full px-4 py-3 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                      : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'
                  } border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200`}
                  rows={2}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Friends Sidebar */}
        <div className={`w-80 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l`}>
          <div className="p-6">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-4`}>
              Study Friends
            </h2>

            {/* Currently Studying */}
            <div className="mb-6">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3 flex items-center`}>
                <BookOpen className="w-4 h-4 mr-2" />
                Currently Studying ({getStudyingFriends().length})
              </h3>
              <div className="space-y-2">
                {getStudyingFriends().map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedFriends.includes(session.user_id)
                        ? isDarkMode 
                          ? 'bg-blue-900 bg-opacity-30 border border-blue-600'
                          : 'bg-blue-100 border border-blue-300'
                        : isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                    onClick={() => toggleFriendSelection(session.user_id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {session.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {session.user_name}
                        </div>
                        <div className={`text-xs truncate ${
                          selectedFriends.includes(session.user_id)
                            ? isDarkMode ? 'text-blue-300' : 'text-blue-700'
                            : isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`}>
                          {session.subject ? `Studying ${session.subject}` : 'Studying'}
                        </div>
                      </div>
                      {selectedFriends.includes(session.user_id) && (
                        <UserPlus className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All Friends */}
            <div>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3 flex items-center`}>
                <Users className="w-4 h-4 mr-2" />
                All Friends ({friends.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {friends.map((friend) => {
                  const isStudying = studySessions.some(s => s.user_id === friend.friend_id && s.status === 'studying');
                  return (
                    <div
                      key={friend.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                        selectedFriends.includes(friend.friend_id)
                          ? isDarkMode 
                            ? 'bg-blue-900 bg-opacity-30 border border-blue-600'
                            : 'bg-blue-100 border border-blue-300'
                          : isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                      onClick={() => toggleFriendSelection(friend.friend_id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isStudying 
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600'
                        }`}>
                          <span className="text-white text-sm font-medium">
                            {friend.friend_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {friend.friend_name}
                          </div>
                          <div className={`text-xs ${
                            isStudying 
                              ? isDarkMode ? 'text-green-400' : 'text-green-600'
                              : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {isStudying ? 'Studying' : 'Offline'}
                          </div>
                        </div>
                        {selectedFriends.includes(friend.friend_id) && (
                          <UserPlus className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupStudy;