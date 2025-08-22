import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download, Users, User, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import Sidebar from './Sidebar';
import EnhancedNoteForm from './EnhancedNoteForm';
import { Note } from '../types';
import jsPDF from 'jspdf';

const Notes: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'group'>('all');

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .or(`user_id.eq.${user.id},is_group_note.eq.true`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Only allow deleting own notes

      if (error) throw error;
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const downloadNotePDF = (note: Note) => {
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(20);
    pdf.text(note.title, 20, 30);
    
    // Add metadata
    pdf.setFontSize(12);
    pdf.text(`Type: ${note.is_group_note ? 'Group Note' : 'Individual Note'}`, 20, 50);
    pdf.text(`Created: ${new Date(note.created_at).toLocaleDateString()}`, 20, 60);
    pdf.text(`Updated: ${new Date(note.updated_at).toLocaleDateString()}`, 20, 70);
    
    // Add content
    pdf.setFontSize(11);
    const splitContent = pdf.splitTextToSize(note.content, 170);
    pdf.text(splitContent, 20, 90);
    
    // Save the PDF
    pdf.save(`${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'individual' && !note.is_group_note) ||
                         (filterType === 'group' && note.is_group_note);
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading notes...</p>
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
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Notes</h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Create and manage your study notes</p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setEditingNote(null);
                  setShowNoteForm(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg p-6 border mb-8`}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'individual' | 'group')}
                  className={`px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                >
                  <option value="all">All Notes</option>
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-100 hover:border-blue-200'} rounded-2xl shadow-lg p-6 border transition-all duration-200 group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {note.is_group_note ? (
                      <Users className="w-5 h-5 text-green-600" />
                    ) : (
                      <User className="w-5 h-5 text-blue-600" />
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      note.is_group_note 
                        ? isDarkMode ? 'bg-green-900 bg-opacity-30 text-green-300 border border-green-700' : 'bg-green-100 text-green-700 border border-green-200'
                        : isDarkMode ? 'bg-blue-900 bg-opacity-30 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {note.is_group_note ? 'Group' : 'Individual'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => downloadNotePDF(note)}
                      className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-green-400 hover:bg-green-900 hover:bg-opacity-20' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'} rounded-lg transition-colors duration-200`}
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    {note.user_id === user?.id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingNote(note);
                            setShowNoteForm(true);
                          }}
                          className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900 hover:bg-opacity-20' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors duration-200`}
                          title="Edit Note"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteNote(note.id)}
                          className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-red-400 hover:bg-red-900 hover:bg-opacity-20' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors duration-200`}
                          title="Delete Note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-3 line-clamp-2`}>
                  {note.title}
                </h3>
                
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4 line-clamp-3`}>
                  {note.content}
                </p>
                
                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} flex justify-between`}>
                  <span>Created: {new Date(note.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(note.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <div className={`w-16 h-16 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <User className={`w-8 h-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                {searchTerm || filterType !== 'all' ? 'No notes found' : 'No notes yet'}
              </h3>
              <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mb-6`}>
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first note to get started'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <button
                  onClick={() => {
                    setEditingNote(null);
                    setShowNoteForm(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Create First Note
                </button>
              )}
            </div>
          )}
        </div>

        {/* Note Form Modal */}
        {showNoteForm && (
          <EnhancedNoteForm
            note={editingNote}
            onClose={() => {
              setShowNoteForm(false);
              setEditingNote(null);
            }}
            onSave={() => {
              loadNotes();
              setShowNoteForm(false);
              setEditingNote(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Notes;