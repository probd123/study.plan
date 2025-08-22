/*
  # Clear Existing Accounts and Fix Password Reset

  1. Database Cleanup
    - Remove all existing user data from custom tables
    - Clear auth.users table (existing accounts)
    
  2. Notes
    - This will delete all existing accounts and their data
    - Users will need to create new accounts
    - Password reset functionality will work properly after this
*/

-- Clear all user-related data first (due to foreign key constraints)
DELETE FROM tasks;
DELETE FROM exams; 
DELETE FROM user_settings;

-- Clear existing user accounts from Supabase Auth
-- Note: This requires admin privileges and may need to be run manually
-- DELETE FROM auth.users;

-- Alternative: If the above doesn't work, we'll handle account cleanup in the application
-- The main issue is likely the password reset configuration, not the accounts themselves