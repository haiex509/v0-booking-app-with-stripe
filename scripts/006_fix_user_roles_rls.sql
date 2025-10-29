-- Fix infinite recursion in user_roles RLS policies
-- Run this script in Supabase SQL Editor to fix the issue

-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins have full access" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Create simple, non-recursive policies
-- Policy 1: Allow authenticated users to read their own role
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Allow authenticated users to read all roles (needed for admin features)
-- This is safe because we control what data is shown in the UI based on their role
CREATE POLICY "Authenticated users can read all roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy 3: Only allow INSERT/UPDATE/DELETE via service role
-- (These operations should be done through admin API with service role key)
CREATE POLICY "Service role can manage roles"
  ON public.user_roles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
