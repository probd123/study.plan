import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserPreferences();
    } else {
      // Load from localStorage for non-authenticated users
      const savedTheme = localStorage.getItem('darkMode');
      setIsDarkMode(savedTheme === null ? true : savedTheme === 'true'); // Default to dark mode
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('dark_mode')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setIsDarkMode(data.dark_mode);
      } else if (!data) {
        // Create default preferences with dark mode
        setIsDarkMode(true);
        await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            dark_mode: true,
            notifications: true
          });
      } else if (error) {
        console.error('Error loading preferences:', error);
        setIsDarkMode(true);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setIsDarkMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            dark_mode: newMode,
            notifications: true
          });
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    } else {
      localStorage.setItem('darkMode', newMode.toString());
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};