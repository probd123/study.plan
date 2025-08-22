import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Users, User, Bold, Italic, Underline, Palette, Save, Type } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFriends } from '../context/FriendsContext';
import { supabase } from '../lib/supabase';
import { Note } from '../types';

interface EnhancedNoteFormProps {
  note?: Note | null;
  onClose: () => void;
  onSave: () => void;
}

const EnhancedNoteForm: React.FC<EnhancedNoteFormProps> = ({ note, onClose, onSave }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { friends } = useFriends();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGroupNote, setIsGroupNote] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const highlightColors = [
    '#ffeb3b', // Yellow
    '#4caf50', // Green
    '#2196f3', // Blue
    '#ff9800', // Orange
    '#e91e63', // Pink
    '#9c27b0', // Purple
    '#f44336', // Red
    '#00bcd4', // Cyan
  ];

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setIsGroupNote(note.is_group_note);
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    setIsLoading(true);
    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        is_group_note: isGroupNote,
        user_id: user.id,
        ...(isGroupNote && { collaborators: selectedFriends })
      };

      if (note) {
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', note.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .insert(noteData);

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const handleHighlight = (color: string) => {
    formatText('hiliteColor', color);
    setShowColorPicker(false);
  };

  const handleContentChange = () => {
    if (contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {note ? 'Edit Note' : 'Create New Note'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Note Title
            </label>
            <div className="relative">
              <FileText className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                placeholder="Enter note title"
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Note Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setIsGroupNote(false)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
                  !isGroupNote
                    ? isDarkMode 
                      ? 'bg-blue-900 bg-opacity-20 border-blue-500 text-blue-400'
                      : 'bg-blue-50 border-blue-500 text-blue-700'
                    : isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Individual Note</span>
              </button>
            </div>
          </div>


          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Content
            </label>
            
            {/* Formatting Toolbar */}
            <div className={`flex items-center space-x-2 p-3 border rounded-t-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
              <button
                type="button"
                onClick={() => formatText('bold')}
                className={`p-2 rounded hover:bg-opacity-20 transition-colors duration-200 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => formatText('italic')}
                className={`p-2 rounded hover:bg-opacity-20 transition-colors duration-200 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => formatText('underline')}
                className={`p-2 rounded hover:bg-opacity-20 transition-colors duration-200 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                title="Underline"
              >
                <Underline className="w-4 h-4" />
              </button>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`p-2 rounded hover:bg-opacity-20 transition-colors duration-200 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                  title="Highlight"
                >
                  <Palette className="w-4 h-4" />
                </button>
                
                {showColorPicker && (
                  <div className={`absolute top-full left-0 mt-1 p-2 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <div className="grid grid-cols-4 gap-1">
                      {highlightColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleHighlight(color)}
                          className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors duration-200"
                          style={{ backgroundColor: color }}
                          title={`Highlight with ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
              
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4" />
                <span className="text-sm font-medium">Times New Roman</span>
              </div>
            </div>
            
            <div className="relative">
              <div
                ref={contentRef}
                contentEditable
                onInput={handleContentChange}
                className={`w-full min-h-[300px] px-4 py-3 border border-t-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                style={{ 
                  fontFamily: 'Times New Roman, serif',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  outline: 'none'
                }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
              {!content && (
                <div className={`absolute top-3 left-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontFamily: 'Times New Roman, serif', fontSize: '16px' }}>
                  Write your note content here... You can write in any language and use the formatting tools above.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium transition-colors duration-200`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim() || !content.trim()}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : note ? 'Update Note' : 'Create Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedNoteForm;