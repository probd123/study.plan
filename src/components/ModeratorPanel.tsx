import React, { useState, useEffect } from 'react';
import { MessageSquare, X, AlertCircle, Shield, Lock, Eye, EyeOff, Check, Key, Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import AdminLogin from './AdminLogin';
import { Complaint } from '../types';

interface AdminUser {
  id: string;
  name: string;
  role: 'admin' | 'moderator';
  can_change_password: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  institution?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

const ModeratorPanel: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Reply modal
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [moderatorNewPassword, setModeratorNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (adminUser) {
      loadComplaints();
      loadAllUsers();
    }
  }, [adminUser]);

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users_for_admin', {
        admin_id: adminUser?.id || ''
      });
      
      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedUser || !newPassword.trim() || !adminUser) return;

    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.rpc('reset_user_password', {
        target_user_id: selectedUser.id,
        new_password: newPassword.trim(),
        admin_id: adminUser.id
      });

      if (error) throw error;

      if (data?.success) {
        alert('Password reset successfully!');
        setShowPasswordReset(false);
        setSelectedUser(null);
        setNewPassword('');
      } else {
        alert(data?.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const markComplaintResolved = async (complaintId: string) => {
    if (!adminUser) return;
    
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          status: 'resolved',
          replied_at: new Date().toISOString(),
          replied_by: adminUser?.id,
          admin_reply: 'Issue marked as resolved by moderator.'
        })
        .eq('id', complaintId);

      if (error) throw error;
      
      // Reload complaints
      loadComplaints();
      alert('Complaint marked as resolved!');
    } catch (error) {
      console.error('Error marking complaint as resolved:', error);
      alert('Failed to mark complaint as resolved.');
    }
  };

  const loadComplaints = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !replyMessage.trim() || !adminUser) return;

    setIsReplying(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: 'resolved',
          admin_reply: replyMessage.trim(),
          replied_at: new Date().toISOString(),
          replied_by: adminUser.id
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      setShowReplyModal(false);
      setSelectedComplaint(null);
      setReplyMessage('');
      loadComplaints();
      alert('Reply sent successfully! The user will receive an email notification.');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setIsReplying(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || !currentPassword || !moderatorNewPassword || !confirmPassword) return;

    if (moderatorNewPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (moderatorNewPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data, error } = await supabase.rpc('change_admin_password', {
        admin_id: adminUser.id,
        old_password: currentPassword,
        new_password: moderatorNewPassword
      });

      if (error) throw error;

      if (data?.success) {
        alert('Password changed successfully!');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setModeratorNewPassword('');
        setConfirmPassword('');
      } else {
        alert(data?.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const deleteComplaint = async (complaintId: string) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return;

    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaintId);

      if (error) throw error;

      loadComplaints();
      alert('Complaint deleted successfully!');
    } catch (error) {
      console.error('Error deleting complaint:', error);
      alert('Failed to delete complaint. Please try again.');
    }
  };

  if (!adminUser) {
    return <AdminLogin onLogin={setAdminUser} />;
  }

  if (adminUser.role !== 'moderator' && adminUser.role !== 'admin') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className={`w-16 h-16 ${isDarkMode ? 'text-red-400' : 'text-red-600'} mx-auto mb-4`} />
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>
            Access Denied
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            You don't have permission to access the moderator panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Moderator Panel
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Welcome, {adminUser.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Change Password
            </button>
            <button
              onClick={() => setShowUserManagement(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              User Management
            </button>
            <button
              onClick={() => setAdminUser(null)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Content */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg border`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-6`}>
                Complaints & Contact Messages
              </h2>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading complaints...</p>
                </div>
              ) : complaints.length > 0 ? (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div key={complaint.id} className={`p-4 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {complaint.subject}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              complaint.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {complaint.status}
                            </span>
                            {complaint.status === 'pending' && (
                              <button
                                onClick={() => markComplaintResolved(complaint.id)}
                                className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors duration-200"
                                title="Mark as resolved"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                            <span className="font-medium">From:</span> {complaint.email} | {complaint.phone}
                          </div>
                          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                            {complaint.message}
                          </p>
                          {complaint.admin_reply && (
                            <div className={`mt-3 p-3 rounded border-l-4 border-blue-500 ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} mb-1`}>
                                Moderator Reply:
                              </div>
                              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                {complaint.admin_reply}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-right`}>
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </div>
                          {complaint.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setShowReplyModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors duration-200"
                            >
                              Reply
                            </button>
                          )}
                          <button
                            onClick={() => deleteComplaint(complaint.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No complaints or messages yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reply Modal */}
        {showReplyModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-2xl shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Reply to Complaint
                </h2>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`p-4 rounded-lg border mb-6 ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>
                  Original Complaint:
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  <strong>Subject:</strong> {selectedComplaint.subject}
                </p>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  <strong>From:</strong> {selectedComplaint.email} | {selectedComplaint.phone}
                </p>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Message:</strong> {selectedComplaint.message}
                </p>
              </div>

              <form onSubmit={handleReply} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Your Reply
                  </label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={6}
                    className={`w-full px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none`}
                    placeholder="Type your reply here..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowReplyModal(false)}
                    className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium transition-colors duration-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReplying || !replyMessage.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReplying ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Management Modal */}
        {showUserManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  User Management
                </h2>
                <button
                  onClick={() => setShowUserManagement(false)}
                  className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {allUsers.map((user) => (
                  <div key={user.id} className={`p-4 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {user.name || 'No name'}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {user.email}
                        </p>
                        {user.institution && (
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {user.institution}
                          </p>
                        )}
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPasswordReset(true);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors duration-200"
                      >
                        <Key className="w-4 h-4" />
                        <span>Reset Password</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordReset && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Reset Password
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordReset(false);
                    setSelectedUser(null);
                    setNewPassword('');
                  }}
                  className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Resetting password for:
                </p>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {selectedUser.name || 'No name'}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200`}
                    placeholder="Enter new password"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowPasswordReset(false);
                    setSelectedUser(null);
                    setNewPassword('');
                  }}
                  className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium transition-colors duration-200`}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordReset}
                  disabled={isResettingPassword || !newPassword.trim()}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Change Password
                </h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={moderatorNewPassword}
                      onChange={(e) => setModeratorNewPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium transition-colors duration-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
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

export default ModeratorPanel;