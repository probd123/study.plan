import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import ExamForm from './ExamForm';

const Calendar: React.FC = () => {
  const { exams, tasks, isLoading } = useData();
  const { isDarkMode } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showExamForm, setShowExamForm] = useState(false);

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDay = (day: number) => {
    const dateString = getDateString(day);
    const dayExams = exams?.filter(exam => exam.date === dateString) || [];
    const dayTasks = tasks?.filter(task => task.date === dateString) || [];
    
    return { exams: dayExams, tasks: dayTasks };
  };

  const isToday = (day: number) => {
    const dateString = getDateString(day);
    const todayString = today.toISOString().split('T')[0];
    return dateString === todayString;
  };

  if (isLoading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading your calendar...</p>
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
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Calendar</h1>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Manage your exams and tasks</p>
            </div>

            <button
              onClick={() => setShowExamForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exam</span>
            </button>
          </div>

          {/* Calendar */}
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg border overflow-hidden`}>
            {/* Calendar Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="w-6 h-6" />
                  <h2 className="text-xl font-semibold">
                    {monthNames[month]} {year}
                  </h2>
                </div>

                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className={`grid grid-cols-7 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className={`px-4 py-3 ${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-200'} text-center font-medium border-r last:border-r-0`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {/* Empty days from previous month */}
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className={`h-32 border-r border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} last:border-r-0`} />
              ))}

              {/* Days of current month */}
              {days.map((day) => {
                const events = getEventsForDay(day);
                const hasEvents = events.exams.length > 0 || events.tasks.length > 0;
                
                return (
                  <div
                    key={day}
                    className={`h-32 border-r border-b border-gray-200 last:border-r-0 p-2 relative ${
                      isToday(day) 
                        ? isDarkMode ? 'bg-blue-900 bg-opacity-30 border-gray-700' : 'bg-blue-50 border-gray-200'
                        : isDarkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday(day) 
                        ? 'text-blue-400' 
                        : isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {day}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {events.exams.slice(0, 2).map((exam) => (
                        <div
                          key={exam.id}
                          className={`text-xs px-2 py-1 rounded truncate ${
                            isDarkMode ? 'bg-red-900 bg-opacity-30 text-red-300' : 'bg-red-100 text-red-700'
                          }`}
                          title={`${exam.subject} - ${exam.time}`}
                        >
                          📝 {exam.subject}
                        </div>
                      ))}
                      
                      {events.tasks.slice(0, 2 - events.exams.length).map((task) => (
                        <div
                          key={task.id}
                          className={`text-xs px-2 py-1 rounded truncate ${isDarkMode ? (
                            task.completed ? 'bg-green-900 bg-opacity-30 text-green-300' : 'bg-yellow-900 bg-opacity-30 text-yellow-300'
                          ) : (
                            task.completed 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          )}`}
                          title={task.title}
                        >
                          {task.completed ? '✅' : '📋'} {task.title}
                        </div>
                      ))}

                      {/* Show count if more events exist */}
                      {(events.exams.length + events.tasks.length) > 2 && (
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} px-2`}>
                          +{events.exams.length + events.tasks.length - 2} more
                        </div>
                      )}
                    </div>

                    {/* Today indicator */}
                    {isToday(day) && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className={`mt-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-4`}>
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-3`}>Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded border ${
                  isDarkMode ? 'bg-red-900 bg-opacity-30 border-red-600' : 'bg-red-100 border-red-200'
                }`}></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Exams</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded border ${
                  isDarkMode ? 'bg-yellow-900 bg-opacity-30 border-yellow-600' : 'bg-yellow-100 border-yellow-200'
                }`}></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pending Tasks</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded border ${
                  isDarkMode ? 'bg-green-900 bg-opacity-30 border-green-600' : 'bg-green-100 border-green-200'
                }`}></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completed Tasks</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded border ${
                  isDarkMode ? 'bg-blue-900 bg-opacity-30 border-blue-600' : 'bg-blue-50 border-blue-200'
                }`}></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Form Modal */}
        {showExamForm && <ExamForm onClose={() => setShowExamForm(false)} />}
      </div>
    </div>
  );
};

export default Calendar;