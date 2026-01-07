-- Add shortlist_status to teams table
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS shortlist_status text NOT NULL DEFAULT 'pending' CHECK (shortlist_status IN ('qualified', 'not_qualified', 'pending'));

-- Add dataset assignment to teams
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS dataset_name text,
ADD COLUMN IF NOT EXISTS dataset_description text;

-- Add problem statement and API contract to events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS api_contract text;

-- Create a function for admins to create users with predefined credentials
-- This will be called from an edge function
CREATE OR REPLACE FUNCTION public.admin_create_user_role(
  _user_id uuid,
  _role user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id) DO UPDATE SET role = _role;
END;
$$;