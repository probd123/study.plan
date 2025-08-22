import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Exam, TimerSettings } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseReady } from '../lib/supabase';

interface DataContextType {
  tasks: Task[];
  exams: Exam[];
  timerSettings: TimerSettings;
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addExam: (exam: Omit<Exam, 'id'>) => void;
  deleteExam: (id: string) => void;
  updateTimerSettings: (settings: TimerSettings) => void;
  getYesterdayIncompleteTasks: () => Task[];
  getTodayTasks: () => Task[];
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    workTime: 25,
    breakTime: 5
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Clear data when user logs out
      setTasks([]);
      setExams([]);
      setTimerSettings({ workTime: 25, breakTime: 5 });
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Load exams
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      // Load timer settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tasksData) setTasks(tasksData);
      if (examsData) setExams(examsData);
      if (settingsData) {
        setTimerSettings({
          workTime: settingsData.work_time,
          breakTime: settingsData.break_time
        });
      } else {
        // Create default settings if none exist
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            work_time: 25,
            break_time: 5
          });

        if (insertError) {
          console.error('Error creating default user settings:', insertError);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: task.title,
          completed: task.completed,
          date: task.date,
          priority: task.priority,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const newTask: Task = {
        id: data.id,
        title: data.title,
        completed: data.completed,
        date: data.date,
        priority: data.priority
      };

      setTasks(prev => [...prev, newTask]);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTask = async (id: string) => {
    if (!user) return;

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const addExam = async (exam: Omit<Exam, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('exams')
        .insert([{
          subject: exam.subject,
          date: exam.date,
          time: exam.time,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const newExam: Exam = {
        id: data.id,
        subject: data.subject,
        date: data.date,
        time: data.time
      };

      setExams(prev => [...prev, newExam]);
    } catch (error) {
      console.error('Error adding exam:', error);
    }
  };

  const deleteExam = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExams(prev => prev.filter(exam => exam.id !== id));
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  const updateTimerSettings = async (settings: TimerSettings) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          work_time: settings.workTime,
          break_time: settings.breakTime
        });

      if (error) throw error;

      setTimerSettings(settings);
    } catch (error) {
      console.error('Error updating timer settings:', error);
    }
  };

  const getYesterdayIncompleteTasks = (): Task[] => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    return tasks.filter(task => 
      task.date === yesterdayStr && !task.completed
    );
  };

  const getTodayTasks = (): Task[] => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => task.date === today);
  };

  return (
    <DataContext.Provider value={{
      tasks,
      exams,
      timerSettings,
      addTask,
      toggleTask,
      deleteTask,
      addExam,
      deleteExam,
      updateTimerSettings,
      getYesterdayIncompleteTasks,
      getTodayTasks,
      isLoading
    }}>
      {children}
    </DataContext.Provider>
  );
};