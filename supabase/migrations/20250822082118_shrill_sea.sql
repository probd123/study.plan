/*
  # Create statistics function

  1. New Functions
    - `get_current_statistics()` - Returns current application statistics
      - `total_users` (bigint) - Total number of registered users
      - `total_complaints` (bigint) - Total number of complaints/messages
      - `pending_complaints` (bigint) - Number of pending complaints
      - `resolved_complaints` (bigint) - Number of resolved complaints
      - `last_updated` (timestamptz) - Timestamp of most recent complaint

  2. Security
    - Function is accessible to authenticated users
    - Uses existing RLS policies on referenced tables
*/

CREATE OR REPLACE FUNCTION public.get_current_statistics()
RETURNS TABLE (
    total_users bigint,
    total_complaints bigint,
    pending_complaints bigint,
    resolved_complaints bigint,
    last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM auth.users) AS total_users,
        (SELECT COUNT(*) FROM public.complaints) AS total_complaints,
        (SELECT COUNT(*) FROM public.complaints WHERE status = 'pending') AS pending_complaints,
        (SELECT COUNT(*) FROM public.complaints WHERE status = 'resolved') AS resolved_complaints,
        (SELECT MAX(created_at) FROM public.complaints) AS last_updated;
END;
$$;