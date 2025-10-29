-- Migration script to fix infinite recursion in user_roles RLS policies
-- Run this if you already created the table with the old policies

-- Drop all existing policies
DROP POLICY IF EXISTS "Super admins have full access" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all users" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can modify non-super-admins" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Create the security definer function if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = check_user_id AND is_active = true;
  
  RETURN user_role;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

-- Create new policies that use the security definer function
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Super admins can insert roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

CREATE POLICY "Super admins can update roles" ON public.user_roles
  FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

CREATE POLICY "Admins can update non-super-admins" ON public.user_roles
  FOR UPDATE
  USING (
    role != 'super_admin' AND
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Super admins can delete roles" ON public.user_roles
  FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  );
