import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, LogOut, Heart, X, Users, Eye, Moon, Sun, FileText, AlertCircle, User, Bell, MessageCircle, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase, isSupabaseReady } from '../lib/supabase';
import ComplaintForm from './ComplaintForm';
import Profile from './Profile';
import NotificationPanel from './NotificationPanel';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  

  // Load unread notifications count
  React.useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Set up real-time subscription for notifications
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => loadUnreadCount()
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;

    // Don't attempt to load if Supabase is not configured
    if (!isSupabaseReady) {
      return;
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const menuItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard'
    },
    {
      to: '/calendar',
      icon: Calendar,
      label: 'Calendar'
    },
    {
      to: '/friends',
      icon: UserPlus,
      label: 'Friends'
    },
    {
      to: '/group-study',
      icon: Users,
      label: 'Group Study'
    },
    {
      to: '/notes',
      icon: FileText,
      label: 'Notes'
    },
    {
      to: '/study-status',
      icon: Eye,
      label: 'Study Status'
    }
  ];

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-xl h-screen w-64 flex flex-col border-r`}>
      {/* Header */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            StudyPlanner
          </h1>
        </div>
        
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Welcome back, <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user?.user_metadata?.name || user?.email?.split('@')[0]}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group border ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg border-blue-500'
                      : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400 border-gray-600 hover:border-blue-400' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 border-gray-200 hover:border-blue-300'}`
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : `${isDarkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-600'}`}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Actions */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <button
          onClick={() => setShowProfile(true)}
          className={`flex items-center space-x-3 w-full px-4 py-3 mb-3 rounded-xl transition-all duration-200 group border ${
            isDarkMode 
              ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400 border-gray-600 hover:border-blue-400' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 border-gray-200 hover:border-blue-300'
          }`}
        >
          <User className={`w-5 h-5 ${isDarkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-600'}`} />
          <span className="font-medium">My Profile</span>
        </button>
        
        <button
          onClick={() => setShowNotifications(true)}
          className={`flex items-center space-x-3 w-full px-4 py-3 mb-3 rounded-xl transition-all duration-200 group border relative ${
            isDarkMode 
              ? 'text-gray-300 hover:bg-gray-700 hover:text-yellow-400 border-gray-600 hover:border-yellow-400' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-yellow-600 border-gray-200 hover:border-yellow-300'
          }`}
        >
          <div className="relative flex-shrink-0">
            <Bell className={`w-5 h-5 ${isDarkMode ? 'text-gray-400 group-hover:text-yellow-400' : 'text-gray-400 group-hover:text-yellow-600'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="font-medium flex-1 text-left">Notifications</span>
        </button>
        
        <button
          onClick={toggleDarkMode}
          className={`flex items-center space-x-3 w-full px-4 py-3 mb-3 rounded-xl transition-all duration-200 group border ${
            isDarkMode 
              ? 'text-gray-300 hover:bg-gray-700 hover:text-yellow-400 border-gray-600 hover:border-yellow-400' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-gray-200 hover:border-gray-300'
          }`}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          )}
          <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        
        <button
          onClick={() => setShowDonationModal(true)}
          className="flex items-center space-x-3 w-full px-4 py-3 mb-3 text-white bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 rounded-xl transition-all duration-200 group shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-pink-400"
        >
          <Heart className="w-5 h-5 text-white" />
          <span className="font-medium">Support Us</span>
        </button>
        
        <button
          onClick={() => setShowComplaintForm(true)}
          className={`flex items-center space-x-3 w-full px-4 py-3 mb-3 rounded-xl transition-all duration-200 group border ${
            isDarkMode 
              ? 'text-gray-300 hover:bg-red-900 hover:text-red-400 hover:bg-opacity-20 border-gray-600 hover:border-red-400' 
              : 'text-gray-600 hover:bg-red-50 hover:text-red-600 border-gray-200 hover:border-red-300'
          }`}
        >
          <AlertCircle className={`w-5 h-5 ${isDarkMode ? 'text-gray-400 group-hover:text-red-400' : 'text-gray-400 group-hover:text-red-600'}`} />
          <span className="font-medium">Submit Complaint</span>
        </button>
        
        <button
          onClick={logout}
          className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group border ${
            isDarkMode 
              ? 'text-gray-300 hover:bg-red-900 hover:text-red-400 border-gray-600 hover:border-red-400' 
              : 'text-gray-600 hover:bg-red-50 hover:text-red-600 border-gray-200 hover:border-red-300'
          }`}
        >
          <LogOut className={`w-5 h-5 ${isDarkMode ? 'text-gray-400 group-hover:text-red-400' : 'text-gray-400 group-hover:text-red-600'}`} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>

      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Support StudyPlanner ❤️</h2>
              <button
                onClick={() => setShowDonationModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-600 mb-6">Please send your donation with bKash or Nagad ❤️</p>
              
              <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-lg p-6 border border-pink-200">
                <table className="w-full">
                  <tbody className="space-y-4">
                    <tr>
                      <td className="text-left font-semibold text-gray-800 py-2">bKash:</td>
                      <td className="text-right font-mono text-blue-600 py-2">01533131873</td>
                    </tr>
                    <tr>
                      <td className="text-left font-semibold text-gray-800 py-2">Nagad:</td>
                      <td className="text-right font-mono text-green-600 py-2">01533131873</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowDonationModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Thank You!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Form Modal */}
      {showComplaintForm && (
        <ComplaintForm
          onClose={() => setShowComplaintForm(false)}
          onSuccess={() => {
            setShowComplaintForm(false);
            alert('Complaint submitted successfully! We will review it and get back to you.');
          }}
        />
      )}

      {/* Profile Modal */}
      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <NotificationPanel 
          onClose={() => {
            setShowNotifications(false);
            loadUnreadCount();
          }} 
        />
      )}
    </div>
  );
};

export default Sidebar;