import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate URL format
const isValidUrl = (url: string) => {
  if (!url || url === 'https://your-project-ref.supabase.co') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Check if environment variables are properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  isValidUrl(supabaseUrl);

if (isSupabaseConfigured) {
  console.log('✅ Supabase connected successfully!');
} else {
  console.error('❌ Supabase configuration missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseReady = isSupabaseConfigured;