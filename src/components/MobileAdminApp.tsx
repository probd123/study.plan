import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Bell, Send, X, Phone, Mail, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  priority?: string;
}

interface Statistics {
  total_users: number;
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
}

const MobileAdminApp: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'complaints'>('dashboard');

  useEffect(() => {
    loadData();
    
    // Set up real-time updates
    const complaintsSubscription = supabase
      .channel('complaints_mobile')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'complaints' },
        () => loadData()
      )
      .subscribe();

    return () => {
      complaintsSubscription.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load statistics
      const { data: statsData } = await supabase.rpc('get_current_statistics');
      if (statsData && statsData.length > 0) {
        setStatistics(statsData[0]);
      } else {
        // Set default stats if none found
        setStatistics({
          total_users: 0,
          total_complaints: 0,
          pending_complaints: 0,
          resolved_complaints: 0
        });
      }

      // Load complaints
      const { data: complaintsData } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (complaintsData) {
        setComplaints(complaintsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedComplaint || !replyMessage.trim()) return;

    setIsReplying(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: 'resolved',
          admin_reply: replyMessage.trim(),
          replied_at: new Date().toISOString()
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      setSelectedComplaint(null);
      setReplyMessage('');
      loadData();
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setIsReplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-800">Admin Panel</h1>
        <p className="text-sm text-gray-600">Mobile Management</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'complaints'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
              {statistics && statistics.pending_complaints > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                  {statistics.pending_complaints}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Total Users</p>
                    <p className="text-lg font-bold text-gray-900">{statistics?.total_users || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Messages</p>
                    <p className="text-lg font-bold text-gray-900">{statistics?.total_complaints || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Pending</p>
                    <p className="text-lg font-bold text-gray-900">{statistics?.pending_complaints || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Resolved</p>
                    <p className="text-lg font-bold text-gray-900">{statistics?.resolved_complaints || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Recent Messages</h2>
              <div className="space-y-3">
                {complaints.slice(0, 3).map((complaint) => (
                  <div key={complaint.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{complaint.subject}</p>
                      <p className="text-xs text-gray-600 truncate">{complaint.email}</p>
                      <p className="text-xs text-gray-500">{formatDate(complaint.created_at)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900">{complaint.subject}</h3>
                      {complaint.priority && (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{complaint.email}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{complaint.phone}</span>
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{complaint.message}</p>
                    
                    {complaint.admin_reply && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                        <p className="text-xs font-medium text-blue-700 mb-1">Admin Reply:</p>
                        <p className="text-sm text-gray-700">{complaint.admin_reply}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(complaint.created_at)}</span>
                    {complaint.status === 'pending' && (
                      <button
                        onClick={() => setSelectedComplaint(complaint)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl p-4 w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Reply to Message</h2>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <h3 className="font-medium text-gray-900 mb-1">{selectedComplaint.subject}</h3>
              <p className="text-sm text-gray-600 mb-2">From: {selectedComplaint.email}</p>
              <p className="text-sm text-gray-700">{selectedComplaint.message}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Type your reply here..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="flex-1 py-2 px-4 text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={isReplying || !replyMessage.trim()}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isReplying ? 'Sending...' : 'Send Reply'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAdminApp;