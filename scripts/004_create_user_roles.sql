-- Create user_roles table to manage admin access levels
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer')),
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON public.user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policies to avoid infinite recursion
-- Strategy: Use a security definer function to check roles without triggering RLS

-- Helper function to check user role (bypasses RLS with SECURITY DEFINER)
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

-- Policy 1: All authenticated users can view their own role
-- This doesn't cause recursion because it doesn't check roles
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Users with admin or super_admin role can view all roles
-- Uses the security definer function to avoid recursion
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy 3: Super admins can insert new roles
CREATE POLICY "Super admins can insert roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

-- Policy 4: Super admins can update any role
CREATE POLICY "Super admins can update roles" ON public.user_roles
  FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

-- Policy 5: Admins can update non-super-admin roles
CREATE POLICY "Admins can update non-super-admins" ON public.user_roles
  FOR UPDATE
  USING (
    role != 'super_admin' AND
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy 6: Super admins can delete roles
CREATE POLICY "Super admins can delete roles" ON public.user_roles
  FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant execute permission on the helper function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

-- Insert default super admin (update email as needed)
-- Note: This user must exist in auth.users first
-- Uncomment and update the email below to create your first super admin:
-- 
-- INSERT INTO public.user_roles (user_id, email, role, created_by)
-- SELECT id, email, 'super_admin', id
-- FROM auth.users
-- WHERE email = 'your-email@example.com'
-- ON CONFLICT (user_id) DO NOTHING;
