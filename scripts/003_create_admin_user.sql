-- Create a default admin user for the booking system
-- This script should be run in the Supabase SQL Editor

-- Note: Replace the email and password with your desired admin credentials
-- The password will be hashed by Supabase Auth automatically

-- Insert admin user into auth.users
-- You can also do this via the Supabase Dashboard:
-- Authentication > Users > Add User

-- For programmatic creation, use the Supabase Dashboard or Auth API
-- This is a reference SQL for documentation purposes

/*
To create an admin user:

1. Via Supabase Dashboard (Recommended):
   - Go to Authentication > Users
   - Click "Add user"
   - Email: admin@yourdomain.com
   - Password: (choose a secure password)
   - Email Confirm: Yes (or send confirmation email)

2. Via Supabase Auth API:
   Use the signUp function in your app or via API call

3. Default Admin Credentials (for development only):
   Email: admin@booking.local
   Password: Admin123!@#
   
   IMPORTANT: Change these credentials immediately in production!
*/

-- Create a function to check if user is admin (optional, for future use)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

COMMENT ON FUNCTION is_admin() IS 'Returns true if the current user is authenticated (admin)';
