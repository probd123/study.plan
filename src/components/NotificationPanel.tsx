import React, { useState, useEffect } from 'react';
import { X, Bell, MessageCircle, CheckCircle, Trash2, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'complaint_reply' | 'system' | 'friend_request';
  read: boolean;
  created_at: string;
  data?: any;
}

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'complaint_reply':
        return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleFriendRequestAction = async (notificationId: string, requestId: string, action: 'accept' | 'reject') => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      if (action === 'accept') {
        // Get request details to create friendship
        const { data: request } = await supabase
          .from('friend_requests')
          .select('sender_id, receiver_id')
          .eq('id', requestId)
          .single();

        if (request) {
          // Create friendship (both directions)
          await supabase
            .from('friends')
            .insert([
              { user_id: request.receiver_id, friend_id: request.sender_id },
              { user_id: request.sender_id, friend_id: request.receiver_id }
            ]);
        }
      }

      // Mark notification as read and remove it
      await deleteNotification(notificationId);
      
      alert(action === 'accept' ? 'Friend request accepted!' : 'Friend request rejected.');
    } catch (error) {
      console.error('Error handling friend request:', error);
      alert('Failed to process friend request.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Notifications
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all duration-200 group ${
                    notification.read
                      ? isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      : isDarkMode ? 'bg-blue-900 bg-opacity-20 border-blue-500' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-1`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                            {notification.message}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {formatTime(notification.created_at)}
                          </p>
                          
                          {/* Friend request action buttons */}
                          {notification.type === 'friend_request' && notification.data?.request_id && (
                            <div className="flex items-center space-x-2 mt-2">
                              <button
                                onClick={() => handleFriendRequestAction(notification.id, notification.data.request_id, 'accept')}
                                className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors duration-200"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept</span>
                              </button>
                              <button
                                onClick={() => handleFriendRequestAction(notification.id, notification.data.request_id, 'reject')}
                                className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors duration-200"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className={`p-1 rounded transition-colors duration-200 ${
                                isDarkMode ? 'text-gray-400 hover:text-green-400 hover:bg-green-900 hover:bg-opacity-20' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className={`p-1 rounded transition-colors duration-200 ${
                              isDarkMode ? 'text-gray-400 hover:text-red-400 hover:bg-red-900 hover:bg-opacity-20' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                No notifications
              </h3>
              <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;