import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Clock, Target, TrendingUp, Users, Heart, X, Mail, Phone, User } from 'lucide-react';
import { supabase, isSupabaseReady } from '../lib/supabase';
import DonatorForm from './DonatorForm';

interface Donator {
  id: string;
  name: string;
  created_at: string;
}

const Landing: React.FC = () => {
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [donators, setDonators] = useState<Donator[]>([]);
  const [isLoadingDonators, setIsLoadingDonators] = useState(true);

  // Add user statistics state
  const [userStats, setUserStats] = useState<any>(null);

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState('');
  const [showContactSuccess, setShowContactSuccess] = useState(false);

   const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadDonators();
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_statistics');
      if (error) throw error;
      if (data && data.length > 0) {
        setUserStats(data[0]);
      }
    } catch (error) {
      console.error('Error loading user statistics:', error);
      // Set default stats if loading fails
      setUserStats({
        total_users: 0,
        total_complaints: 0,
        pending_complaints: 0,
        resolved_complaints: 0
      });
    }
  };

  const loadDonators = async () => {
    setIsLoadingDonators(true);
    try {
      const { data, error } = await supabase
        .from('donators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDonators(data || []);
    } catch (error) {
      console.error('Error loading donators:', error);
      setDonators([]);
    } finally {
      setIsLoadingDonators(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle contact form submission
    handleContactFormSubmit();
  };

  const handleContactFormSubmit = async () => {
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.phone.trim() || !contactForm.message.trim()) {
      setContactError('Please fill in all fields');
      return;
    }

    setIsSubmittingContact(true);
    setContactError('');

    try {
      const { error } = await supabase
        .from('complaints')
        .insert({
          email: contactForm.email.trim(),
          phone: contactForm.phone.trim(),
          subject: `Contact Form: ${contactForm.name}`,
          message: `Name: ${contactForm.name}\nEmail: ${contactForm.email}\nPhone: ${contactForm.phone}\n\nMessage:\n${contactForm.message}`
        });

      if (error) throw error;

      setShowContactSuccess(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setContactError('Failed to submit message. Please try again.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleDonatorAdd = async (donatorName: string) => {
    try {
      const { error } = await supabase
        .from('donators')
        .insert({
          name: donatorName.trim()
        });

      if (error) throw error;
      
      // Reload donators
      loadDonators();
      return true;
    } catch (error) {
      console.error('Error adding donator:', error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            StudyPlanner
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link
            to="/signin"
            className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Your Ultimate{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Study Companion
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Organize your academic life with our comprehensive student planner. 
            Track assignments, manage exams, boost productivity with Pomodoro timers, 
            and achieve your academic goals.
          </p>
          
          {/* User Statistics */}
          {userStats && (
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{userStats.total_users}</div>
                    <div className="text-sm text-gray-600">Active Students</div>
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{userStats.resolved_complaints}</div>
                    <div className="text-sm text-gray-600">Issues Resolved</div>
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">24/7</div>
                    <div className="text-sm text-gray-600">Support Available</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
            <Link
              to="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
            >
              Get Started Free
            </Link>
            <button
              onClick={() => setShowContactModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Contact Us</span>
            </button>
            <button
              onClick={() => setShowDonationModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl hover:from-pink-600 hover:to-red-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
            >
              <Heart className="w-5 h-5" />
              <span>Support Us</span>
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Smart Calendar</h3>
              <p className="text-gray-600 leading-relaxed">
                Keep track of all your exams, assignments, and important dates in one beautiful, 
                intuitive calendar interface.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Pomodoro Timer</h3>
              <p className="text-gray-600 leading-relaxed">
                Boost your productivity with our built-in Pomodoro timer. Work in focused 
                sessions with automatic breaks.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Task Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Organize your daily tasks, set priorities, and track your progress with 
                our comprehensive task management system.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Progress Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Visualize your productivity patterns and track your academic progress 
                with detailed charts and statistics.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Exam Tracker</h3>
              <p className="text-gray-600 leading-relaxed">
                Never miss an exam again! Keep track of all your upcoming exams with 
                dates, times, and subjects organized.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Study Groups</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with classmates, form study groups, and collaborate on 
                assignments and exam preparation.
              </p>
            </div>
          </div>

          {/* Donators Section */}
          <div className="mt-20 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Amazing Supporters ❤️</h3>
              <p className="text-gray-600">Thank you to everyone who has supported StudyPlanner</p>
            </div>

            {isLoadingDonators ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading supporters...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {donators.map((donator) => (
                  <div key={donator.id} className="bg-gradient-to-r from-pink-50 to-red-50 p-4 rounded-lg border border-pink-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{donator.name}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(donator.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoadingDonators && donators.length === 0 && (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Be the first to support StudyPlanner!</p>
              </div>
            )}
          </div>
        </div>
      </main>

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
              <p className="text-gray-600 mb-4">Please send your donation with bKash or Nagad ❤️</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm font-medium">
                  📝 <strong>Important:</strong> Please write your name in the reference/note when sending money so we can add you to our supporters list!
                </p>
              </div>
              
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

      {/* Contact Success Modal */}
      {showContactSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Thank You!
            </h2>
            <p className="text-gray-600 mb-6">
              We have received your message and will get back to you soon via email at studyplannerbd@gmail.com
            </p>
            <button
              onClick={() => {
                setShowContactSuccess(false);
                setShowContactModal(false);
              }}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Contact Us</h2>
              </div>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactForm({ name: '', email: '', phone: '', message: '' });
                  setContactError('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {contactError}
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="How can we help you?"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactModal(false);
                    setContactForm({ name: '', email: '', phone: '', message: '' });
                    setContactError('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmittingContact ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;