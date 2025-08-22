import React, { useState, useEffect } from 'react';
import { BookOpen, Coffee, Moon, Clock, Users, Play, Pause, Square } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendsContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';

const StudyStatus: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { friends, studySessions, updateStudyStatus, isLoading } = useFriends();
  
  const [myStatus, setMyStatus] = useState<'studying' | 'break' | 'offline'>('offline');
  const [mySubject, setMySubject] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    // Find current user's study session
    const mySession = studySessions.find(session => session.user_id === user?.id);
    if (mySession) {
      setMyStatus(mySession.status);
      setMySubject(mySession.subject || '');
    }
  }, [studySessions, user]);

  const handleStatusUpdate = async (status: 'studying' | 'break' | 'offline', subject?: string) => {
    await updateStudyStatus(status, subject);
    setMyStatus(status);
    setMySubject(subject || '');
    setShowStatusModal(false);
  };

  const getStatusIcon = (status: 'studying' | 'break' | 'offline') => {
    switch (status) {
      case 'studying':
        return <BookOpen className="w-5 h-5 text-green-600" />;
      case 'break':
        return <Coffee className="w-5 h-5 text-yellow-600" />;
      case 'offline':
        return <Moon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: 'studying' | 'break' | 'offline') => {
    switch (status) {
      case 'studying':
        return isDarkMode ? 'bg-green-900 bg-opacity-30 text-green-300 border-green-600' : 'bg-green-100 text-green-800 border-green-300';
      case 'break':
        return isDarkMode ? 'bg-yellow-900 bg-opacity-30 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'offline':
        return isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-500' : 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTime = (dateString: string) => {
    const now = new Date();
    const time = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  const getStudyingFriends = () => studySessions.filter(s => s.status === 'studying' && s.user_id !== user?.id);
  const getBreakFriends = () => studySessions.filter(s => s.status === 'break' && s.user_id !== user?.id);
  const getOfflineFriends = () => {
    const activeFriendIds = studySessions.map(s => s.user_id);
    return friends.filter(f => !activeFriendIds.includes(f.friend_id));
  };

  if (isLoading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading study status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Study Status</h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>See what your friends are studying</p>
            </div>

            <button
              onClick={() => setShowStatusModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Update My Status
            </button>
          </div>

          {/* My Status Card */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border mb-8`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-medium">
                    {user?.user_metadata?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {user?.user_metadata?.name || 'You'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(myStatus)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      getStatusColor(myStatus)
                    }`}>
                      {myStatus === 'studying' ? 'Studying' : myStatus === 'break' ? 'On Break' : 'Offline'}
                    </span>
                    {mySubject && (
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        • {mySubject}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowStatusModal(true)}
                className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg font-medium transition-colors duration-200`}
              >
                Change Status
              </button>
            </div>
          </div>

          {/* Friends Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Currently Studying */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-10 h-10 ${isDarkMode ? 'bg-green-900 bg-opacity-30' : 'bg-green-100'} rounded-xl flex items-center justify-center`}>
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Currently Studying</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getStudyingFriends().length} friends</p>
                </div>
              </div>

              <div className="space-y-3">
                {getStudyingFriends().map((session) => (
                  <div key={session.id} className={`p-4 ${isDarkMode ? 'bg-green-900 bg-opacity-20 border-green-700' : 'bg-green-50 border-green-200'} rounded-lg border`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {session.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {session.user_name}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                          {session.subject ? `Studying ${session.subject}` : 'Studying'}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center space-x-1`}>
                          <Clock className="w-3 h-3" />
                          <span>Active {formatTime(session.last_active)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {getStudyingFriends().length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No friends studying</p>
                  </div>
                )}
              </div>
            </div>

            {/* On Break */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-10 h-10 ${isDarkMode ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-100'} rounded-xl flex items-center justify-center`}>
                  <Coffee className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>On Break</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getBreakFriends().length} friends</p>
                </div>
              </div>

              <div className="space-y-3">
                {getBreakFriends().map((session) => (
                  <div key={session.id} className={`p-4 ${isDarkMode ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} rounded-lg border`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {session.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {session.user_name}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                          Taking a break
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center space-x-1`}>
                          <Clock className="w-3 h-3" />
                          <span>Active {formatTime(session.last_active)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {getBreakFriends().length === 0 && (
                  <div className="text-center py-8">
                    <Coffee className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No friends on break</p>
                  </div>
                )}
              </div>
            </div>

            {/* Offline */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-10 h-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-xl flex items-center justify-center`}>
                  <Moon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Offline</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getOfflineFriends().length} friends</p>
                </div>
              </div>

              <div className="space-y-3">
                {getOfflineFriends().map((friend) => (
                  <div key={friend.id} className={`p-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {friend.friend_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {friend.friend_name}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Offline
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {getOfflineFriends().length === 0 && (
                  <div className="text-center py-8">
                    <Users className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>All friends are active!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Update Study Status</h2>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
                >
                  <Square className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleStatusUpdate('studying', mySubject)}
                  className={`w-full p-4 ${isDarkMode ? 'bg-green-900 bg-opacity-20 border-green-700 hover:bg-opacity-30' : 'bg-green-50 border-green-200 hover:bg-green-100'} border rounded-lg transition-colors duration-200 text-left`}
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-6 h-6 text-green-600" />
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Start Studying</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Focus mode activated</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleStatusUpdate('break')}
                  className={`w-full p-4 ${isDarkMode ? 'bg-yellow-900 bg-opacity-20 border-yellow-700 hover:bg-opacity-30' : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'} border rounded-lg transition-colors duration-200 text-left`}
                >
                  <div className="flex items-center space-x-3">
                    <Coffee className="w-6 h-6 text-yellow-600" />
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Take a Break</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rest and recharge</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleStatusUpdate('offline')}
                  className={`w-full p-4 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} border rounded-lg transition-colors duration-200 text-left`}
                >
                  <div className="flex items-center space-x-3">
                    <Moon className="w-6 h-6 text-gray-600" />
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Go Offline</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Not studying right now</div>
                    </div>
                  </div>
                </button>

                {myStatus === 'studying' && (
                  <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      What are you studying? (Optional)
                    </label>
                    <input
                      type="text"
                      value={mySubject}
                      onChange={(e) => setMySubject(e.target.value)}
                      className={`w-full px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      placeholder="e.g., Mathematics, Physics, etc."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyStatus;