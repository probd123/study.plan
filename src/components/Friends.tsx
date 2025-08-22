import React, { useState } from 'react';
import { UserPlus, Users, Mail, Check, X, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendsContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';

const Friends: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { 
    friends, 
    friendRequests, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    removeFriend,
    isLoading 
  } = useFriends();
  
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [addFriendError, setAddFriendError] = useState('');

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail.trim()) return;

    setIsAddingFriend(true);
    setAddFriendError('');

    try {
      const success = await sendFriendRequest(friendEmail.trim());
      if (success) {
        setShowAddFriendModal(false);
        setFriendEmail('');
        alert('Friend request sent successfully!');
      } else {
        setAddFriendError('Failed to send friend request. User may not exist or you may already be friends.');
      }
    } catch (error) {
      if (error instanceof Error) {
        setAddFriendError(error.message);
      } else {
        setAddFriendError('An error occurred. Please try again.');
      }
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const success = await acceptFriendRequest(requestId);
    if (success) {
      alert('Friend request accepted!');
    } else {
      alert('Failed to accept friend request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const success = await rejectFriendRequest(requestId);
    if (success) {
      alert('Friend request rejected.');
    } else {
      alert('Failed to reject friend request. Please try again.');
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) return;

    const success = await removeFriend(friendId);
    if (success) {
      alert('Friend removed successfully.');
    } else {
      alert('Failed to remove friend. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading friends...</p>
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
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Friends</h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Manage your study friends and connections</p>
            </div>

            <button
              onClick={() => setShowAddFriendModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Friend</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Friend Requests */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-10 h-10 ${isDarkMode ? 'bg-yellow-900 bg-opacity-20' : 'bg-yellow-100'} rounded-xl flex items-center justify-center`}>
                  <Mail className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Friend Requests</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{friendRequests.length} pending</p>
                </div>
              </div>

              <div className="space-y-3">
                {friendRequests.length > 0 ? (
                  friendRequests.map((request) => (
                    <div key={request.id} className={`p-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {request.sender_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {request.sender_name}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {request.sender_email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                            title="Accept"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Mail className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No pending friend requests</p>
                  </div>
                )}
              </div>
            </div>

            {/* My Friends */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-10 h-10 ${isDarkMode ? 'bg-green-900 bg-opacity-20' : 'bg-green-100'} rounded-xl flex items-center justify-center`}>
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>My Friends</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{friends.length} friends</p>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <div key={friend.id} className={`p-4 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-200'} rounded-lg border transition-colors duration-200 group`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {friend.friend_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {friend.friend_name}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {friend.friend_email}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFriend(friend.friend_id, friend.friend_name)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Remove Friend"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No friends yet. Add some friends to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Friend Modal */}
        {showAddFriendModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Add Friend
                </h2>
                <button
                  onClick={() => {
                    setShowAddFriendModal(false);
                    setFriendEmail('');
                    setAddFriendError('');
                  }}
                  className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {addFriendError && (
                <div className={`${isDarkMode ? 'bg-red-900 bg-opacity-20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} px-4 py-3 rounded-lg border mb-4`}>
                  {addFriendError}
                </div>
              )}

              <form onSubmit={handleSendFriendRequest} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Friend's Email Address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type="email"
                      value={friendEmail}
                      onChange={(e) => setFriendEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      placeholder="Enter friend's email address"
                      required
                    />
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                    Enter the email address of the person you want to add as a friend
                  </p>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFriendModal(false);
                      setFriendEmail('');
                      setAddFriendError('');
                    }}
                    className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium transition-colors duration-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingFriend || !friendEmail.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isAddingFriend ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;