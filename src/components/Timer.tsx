import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

const Timer: React.FC = () => {
  const { timerSettings, updateTimerSettings } = useData();
  const { isDarkMode } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerSettings.workTime * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [workTime, setWorkTime] = useState(timerSettings.workTime);
  const [breakTime, setBreakTime] = useState(timerSettings.breakTime);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Time's up - switch mode
      if (isBreak) {
        // Break is over, start work session
        setIsBreak(false);
        setTimeLeft(timerSettings.workTime * 60);
      } else {
        // Work session is over, start break
        setIsBreak(true);
        setTimeLeft(timerSettings.breakTime * 60);
      }
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, timerSettings]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? timerSettings.breakTime * 60 : timerSettings.workTime * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveSettings = () => {
    updateTimerSettings({ workTime, breakTime });
    setShowSettings(false);
    // Reset timer with new settings if not running
    if (!isRunning) {
      setTimeLeft(isBreak ? breakTime * 60 : workTime * 60);
    }
  };

  const progress = isBreak 
    ? ((timerSettings.breakTime * 60 - timeLeft) / (timerSettings.breakTime * 60)) * 100
    : ((timerSettings.workTime * 60 - timeLeft) / (timerSettings.workTime * 60)) * 100;

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isBreak 
              ? isDarkMode ? 'bg-green-900 bg-opacity-20' : 'bg-green-100'
              : isDarkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-100'
          }`}>
            <Clock className={`w-5 h-5 ${isBreak ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {isBreak ? 'Break Time' : 'Focus Time'}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pomodoro Timer</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(true)}
          className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 border-4 ${
          isBreak ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'
        }`} style={{
          background: `conic-gradient(${isBreak ? '#10b981' : '#3b82f6'} ${progress * 3.6}deg, #f3f4f6 0deg)`
        }}>
          <div className={`w-24 h-24 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-full flex items-center justify-center shadow-lg`}>
            <span className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={toggleTimer}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
              : `${isBreak ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white shadow-lg hover:shadow-xl`
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>

        <button
          onClick={resetTimer}
          className={`flex items-center space-x-2 px-4 py-3 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-xl font-semibold transition-all duration-200`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-96 max-w-[90vw]`}>
            <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Timer Settings</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Work Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={workTime}
                  onChange={(e) => setWorkTime(parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Break Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={breakTime}
                  onChange={(e) => setBreakTime(parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowSettings(false)}
                className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;