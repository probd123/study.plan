import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, Shield, Crown, AlertCircle, Trash2, X, Mail, Phone, MessageSquare, Lock, Eye, EyeOff, Plus, Heart, BarChart3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

interface User {
  id: string;
  name: string;
  email: string;
  institution?: string;
  phone?: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'user' | 'moderator' | 'admin';
  assigned_by: string;
  created_at: string;
}

interface Complaint {
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

interface AdminUser {
  id: string;
  name: string;
  role: 'admin' | 'moderator';
  can_change_password: boolean;
}

interface Donator {
  id: string;
  name: string;
  created_at: string;
}

const Admin: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [donators, setDonators] = useState<Donator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'complaints' | 'donators'>('dashboard');
  
  // Role assignment modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'moderator' | 'admin'>('user');
  
  // Reply modal
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Moderator creation modal
  const [showModeratorModal, setShowModeratorModal] = useState(false);
  const [moderatorId, setModeratorId] = useState('');
  const [moderatorPassword, setModeratorPassword] = useState('');
  const [moderatorName, setModeratorName] = useState('');
  const [isCreatingModerator, setIsCreatingModerator] = useState(false);

  // Donator management modal
  const [showDonatorModal, setShowDonatorModal] = useState(false);
  const [donatorName, setDonatorName] = useState('');
  const [isAddingDonator, setIsAddingDonator] = useState(false);

  useEffect(() => {
    if (adminUser) {
      loadAdminData();
    }
  }, [adminUser]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadUserRoles(),
        loadComplaints(),
        loadDonators()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      return;
    }

    setUsers(data || []);
  };

  const loadUserRoles = async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading user roles:', error);
      return;
    }

    setUserRoles(data || []);
  };

  const loadComplaints = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading complaints:', error);
      return;
    }

    setComplaints(data || []);
  };

  const loadDonators = async () => {
    const { data, error } = await supabase
      .from('donators')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading donators:', error);
      return;
    }

    setDonators(data || []);
  };

  const assignRole = async () => {
    if (!selectedUser || !adminUser) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: selectedUser.id,
          role: newRole,
          assigned_by: adminUser.id
        });

      if (error) throw error;

      setShowRoleModal(false);
      setSelectedUser(null);
      loadUserRoles();
      alert(`Role ${newRole} assigned successfully!`);
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Failed to assign role. Please try again.');
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      loadUserRoles();
      alert('Role removed successfully!');
    } catch (error) {
      console.error('Error removing role:', error);
      alert('Failed to remove role. Please try again.');
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
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setIsReplying(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || !currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data, error } = await supabase.rpc('change_admin_password', {
        admin_id: adminUser.id,
        old_password: currentPassword,
        new_password: newPassword
      });

      if (error) throw error;

      if (data.success) {
        alert('Password changed successfully!');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreateModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || adminUser.role !== 'admin' || !moderatorId || !moderatorPassword || !moderatorName) return;

    setIsCreatingModerator(true);
    try {
      const { data, error } = await supabase.rpc('create_moderator_account', {
        admin_id: adminUser.id,
        mod_id: moderatorId,
        mod_password: moderatorPassword,
        mod_name: moderatorName
      });

      if (error) throw error;

      if (data.success) {
        alert('Moderator account created successfully!');
        setShowModeratorModal(false);
        setModeratorId('');
        setModeratorPassword('');
        setModeratorName('');
      } else {
        alert(data.error || 'Failed to create moderator account');
      }
    } catch (error) {
      console.error('Error creating moderator:', error);
      alert('Failed to create moderator account. Please try again.');
    } finally {
      setIsCreatingModerator(false);
    }
  };

  const handleAddDonator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donatorName.trim()) return;

    setIsAddingDonator(true);
    try {
      const { error } = await supabase
        .from('donators')
        .insert({
          name: donatorName.trim()
        });

      if (error) throw error;

      setShowDonatorModal(false);
      setDonatorName('');
      loadDonators();
      alert('Donator added successfully!');
    } catch (error) {
      console.error('Error adding donator:', error);
      alert('Failed to add donator. Please try again.');
    } finally {
      setIsAddingDonator(false);
    }
  };

  const deleteDonator = async (donatorId: string) => {
    if (!confirm('Are you sure you want to remove this donator?')) return;

    try {
      const { error } = await supabase
        .from('donators')
        .delete()
        .eq('id', donatorId);

      if (error) throw error;

      loadDonators();
      alert('Donator removed successfully!');
    } catch (error) {
      console.error('Error removing donator:', error);
      alert('Failed to remove donator. Please try again.');
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

  const getUserRole = (userId: string) => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return isDarkMode ? 'bg-yellow-900 bg-opacity-30 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'moderator':
        return isDarkMode ? 'bg-blue-900 bg-opacity-30 text-blue-300 border-blue-600' : 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-500' : 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!adminUser) {
    return <AdminLogin onLogin={setAdminUser} />;
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading admin panel...</p>
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
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Admin Panel
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Welcome, {adminUser.name}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Change Password
              </button>
              <button
                onClick={() => setShowDonatorModal(true)}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Add Donator
              </button>
              {adminUser.role === 'admin' && (
                <button
                  onClick={() => setShowModeratorModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Create Moderator
                </button>
              )}
              <button
                onClick={() => setAdminUser(null)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode 
                    ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode 
                    ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Users</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'complaints'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode 
                    ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
                {complaints.filter(c => c.status === 'pending').length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                    {complaints.filter(c => c.status === 'pending').length}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('donators')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'donators'
                  ? 'border-blue-500 text-blue-600'
                  : isDarkMode 
                    ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Donators</span>
              </div>
            </button>
          </nav>
        </div>
      </div>
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Tab Content */}
          {activeTab === 'dashboard' && <AdminDashboard adminUser={adminUser} />}
          
          {activeTab === 'users' && (
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg border`}>
              <div className="p-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-6`}>
                  User Management
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>User</th>
                        <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Role</th>
                        <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Institution</th>
                        <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Joined</th>
                        <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const userRole = getUserRole(user.id);
                        return (
                          <tr key={user.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className="py-3 px-4">
                              <div>
                                <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                  {user.name}
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {user.email}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(userRole)}`}>
                                {getRoleIcon(userRole)}
                                <span className="capitalize">{userRole}</span>
                              </span>
                            </td>
                            <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {user.institution || 'Not specified'}
                            </td>
                            <td className={`py-3 px-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewRole(userRole as 'user' | 'moderator' | 'admin');
                                  setShowRoleModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Manage Role
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg border`}>
              <div className="p-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-6`}>
                  Complaints & Contact Messages
                </h2>

                {complaints.length > 0 ? (
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
                                  Admin Reply:
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
          )}

          {activeTab === 'donators' && (
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg border`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Donators Management
                  </h2>
                  <button
                    onClick={() => setShowDonatorModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Donator</span>
                  </button>
                </div>

                {donators.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {donators.map((donator) => (
                      <div key={donator.id} className={`p-4 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'} group`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                              <Heart className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {donator.name}
                              </h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {new Date(donator.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteDonator(donator.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No donators yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Assignment Modal */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Manage User Role
                </h2>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  <strong>User:</strong> {selectedUser.name} ({selectedUser.email})
                </p>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Current Role:</strong> {getUserRole(selectedUser.id)}
                </p>
              </div>

              <div className="mb-6">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'user' | 'moderator' | 'admin')}
                  className={`w-full px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium transition-colors duration-200`}
                >
                  Cancel
                </button>
                <button
                  onClick={assignRole}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Assign Role
                </button>
              </div>
            </div>
          </div>
        )}

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
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

        {/* Moderator Creation Modal */}
        {showModeratorModal && adminUser.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Create Moderator Account
                </h2>
                <button
                  onClick={() => setShowModeratorModal(false)}
                  className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateModerator} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Moderator ID
                  </label>
                  <input
                    type="text"
                    value={moderatorId}
                    onChange={(e) => setModeratorId(e.target.value)}
                    className={`w-full px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                    placeholder="Enter moderator ID"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Moderator Name
                  </label>
                  <input
                    type="text"
                    value={moderatorName}
                    onChange={(e) => setModeratorName(e.target.value)}
                    className={`w-full px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                    placeholder="Enter moderator name"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Initial Password
                  </label>
                  <input
                    type="password"
                    value={moderatorPassword}
                    onChange={(e) => setModeratorPassword(e.target.value)}
                    className={`w-full px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                    placeholder="Enter initial password"
                    required
                  />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    The moderator can change this password after first login
                  </p>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModeratorModal(false)}
                    className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium transition-colors duration-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingModerator}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingModerator ? 'Creating...' : 'Create Moderator'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Donator Modal */}
        {showDonatorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Add Donator
                </h2>
                <button
                  onClick={() => setShowDonatorModal(false)}
                  className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDonator} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Donator Name
                  </label>
                  <div className="relative">
                    <Heart className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type="text"
                      value={donatorName}
                      onChange={(e) => setDonatorName(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200`}
                      placeholder="Enter donator name"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDonatorModal(false)}
                    className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium transition-colors duration-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingDonator}
                    className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingDonator ? 'Adding...' : 'Add Donator'}
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

export default Admin;