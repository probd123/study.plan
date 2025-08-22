import React, { useState } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, CheckSquare, AlertTriangle, Trash2, X } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import Sidebar from './Sidebar';
import Timer from './Timer';
import ExamForm from './ExamForm';
import TaskForm from './TaskForm';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { exams, deleteExam, getYesterdayIncompleteTasks, getTodayTasks, toggleTask, deleteTask, isLoading } = useData();
  const { isDarkMode } = useTheme();
  const [showExamForm, setShowExamForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const upcomingExams = exams
    .filter(exam => new Date(exam.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const yesterdayIncompleteTasks = getYesterdayIncompleteTasks();
  const todayTasks = getTodayTasks();

  const todayTasksData = [
    {
      name: 'Completed',
      value: todayTasks.filter(task => task.completed).length,
      color: '#10b981'
    },
    {
      name: 'Pending',
      value: todayTasks.filter(task => !task.completed).length,
      color: '#f59e0b'
    }
  ];

  const priorityData = todayTasks.reduce((acc, task) => {
    const priority = task.priority;
    const existing = acc.find(item => item.priority === priority);
    
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ priority, count: 1 });
    }
    
    return acc;
  }, [] as { priority: string; count: number }[]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading your data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>
              Welcome back, {user?.name}!
            </h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Here's your study overview for today</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Upcoming Exams */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${isDarkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-100'} rounded-xl flex items-center justify-center`}>
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Upcoming Exams</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Next 3 exams</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowExamForm(true)}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {upcomingExams.length > 0 ? (
                    upcomingExams.map((exam) => (
                      <div key={exam.id} className={`p-4 ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-gray-50 border-gray-100 hover:border-blue-200'} rounded-lg border transition-colors duration-200 group`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-1`}>{exam.subject}</h4>
                            <div className={`flex items-center space-x-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                {formatDate(exam.date)}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {formatTime(exam.time)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteExam(exam.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-8`}>No upcoming exams scheduled</p>
                  )}
                </div>
              </div>

              {/* Timer */}
              <Timer />

              {/* Yesterday's Incomplete Tasks */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-10 h-10 ${isDarkMode ? 'bg-red-900 bg-opacity-20' : 'bg-red-100'} rounded-xl flex items-center justify-center`}>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Yesterday's Incomplete</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{yesterdayIncompleteTasks.length} tasks pending</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {yesterdayIncompleteTasks.length > 0 ? (
                    yesterdayIncompleteTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className={`flex items-center justify-between p-3 ${isDarkMode ? 'bg-red-900 bg-opacity-20 border-red-700' : 'bg-red-50 border-red-100'} rounded-lg border`}>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className={`w-5 h-5 border-2 ${isDarkMode ? 'border-red-400 hover:bg-red-500 hover:border-red-500' : 'border-red-300 hover:bg-red-600 hover:border-red-600'} rounded transition-colors duration-200`}
                          />
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{task.title}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>All tasks completed yesterday! 🎉</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Tasks Chart */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${isDarkMode ? 'bg-green-900 bg-opacity-20' : 'bg-green-100'} rounded-xl flex items-center justify-center`}>
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Today's Progress</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Task completion overview</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 text-center`}>Task Status</h4>
                    {todayTasksData.some(data => data.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={todayTasksData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            innerRadius={40}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {todayTasksData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={`flex items-center justify-center h-full ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No tasks for today
                      </div>
                    )}
                  </div>

                  <div className="h-64">
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 text-center`}>Priority Distribution</h4>
                    {priorityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="priority" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={`flex items-center justify-center h-full ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No tasks to analyze
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Today's Task List */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-6`}>Today's Tasks</h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {todayTasks.length > 0 ? (
                    todayTasks.map((task) => (
                      <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 group ${
                        task.completed 
                          ? isDarkMode ? 'bg-green-900 bg-opacity-20 border-green-700' : 'bg-green-50 border-green-200'
                          : isDarkMode ? 'bg-gray-700 border-gray-600 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className={`w-5 h-5 border-2 rounded transition-colors duration-200 ${
                              task.completed
                                ? 'bg-green-600 border-green-600 text-white'
                                : isDarkMode ? 'border-gray-500 hover:border-blue-400' : 'border-gray-300 hover:border-blue-600'
                            }`}
                          >
                            {task.completed && <CheckSquare className="w-3 h-3" />}
                          </button>
                          <span className={`font-medium ${
                            task.completed 
                              ? isDarkMode ? 'text-gray-400 line-through' : 'text-gray-500 line-through'
                              : isDarkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <CheckSquare className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No tasks for today. Add one to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showExamForm && <ExamForm onClose={() => setShowExamForm(false)} />}
        {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
      </div>
    </div>
  );
};

export default Dashboard;