# Supabase Setup Guide

## Environment Variables

Add the following environment variables to your project:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

You can find these values in your Supabase project settings under API.

## Database Setup

### 1. Create Tables

Run the SQL scripts in order in your Supabase SQL Editor:

1. `scripts/001_create_packages_table.sql` - Creates the production_packages table with RLS policies
2. `scripts/002_seed_default_packages.sql` - Seeds the database with default packages
3. `scripts/003_create_admin_user.sql` - Reference for creating admin user

### 2. Create Default Admin User

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user"
3. Enter admin credentials:
   - Email: `admin@yourdomain.com`
   - Password: (choose a secure password)
   - Auto Confirm User: Yes
4. Click "Create user"

**Option B: Via Application**

1. Temporarily enable public sign-ups in Supabase (Authentication > Providers > Email)
2. Visit `/admin/login` in your app
3. Use the sign-up flow to create an admin account
4. Disable public sign-ups after creating the admin user

**Default Development Credentials** (for testing only):
- Email: `admin@booking.local`
- Password: `Admin123!@#`

⚠️ **IMPORTANT**: Change these credentials immediately in production!

### 3. Authentication Setup

The app uses Supabase Auth for admin authentication:

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Email provider
3. Configure email templates if desired
4. Set up email confirmation (optional for development)

### 4. Row Level Security (RLS)

The packages table has RLS enabled with the following policies:

- **Public users**: Can read active packages only
- **Authenticated users**: Can perform all CRUD operations on packages

This ensures that:
- Customers can only see active packages on the booking page
- Admin users (authenticated) can manage all packages

## Database Schema

### production_packages

| Column     | Type        | Description                          |
| ---------- | ----------- | ------------------------------------ |
| id         | TEXT        | Primary key (e.g., "indie-pkg-001")  |
| name       | TEXT        | Package name (e.g., "Indie")         |
| price      | INTEGER     | Price in dollars                     |
| features   | JSONB       | Array of feature strings             |
| popular    | BOOLEAN     | Whether package is marked as popular |
| is_active  | BOOLEAN     | Whether package is active/visible    |
| created_at | TIMESTAMPTZ | Creation timestamp                   |
| updated_at | TIMESTAMPTZ | Last update timestamp                |

## Default Packages

The seed script creates three default packages:

1. **Indie** ($399)
   - 1 hr studio rental
   - 20 cinematic edits
   - 1 look/1 backdrop
   - Online gallery

2. **Feature** ($799) - Popular
   - 3 hr production
   - 60 final stills
   - 2 looks + set changes
   - Color-graded gallery
   - MUA & stylist included

3. **Blockbuster** ($1499)
   - Full-day shoot
   - 120+ hero images
   - Unlimited sets
   - Behind-the-scenes 4K video
   - Same-day teaser

## Testing

After setup, you can test the integration:

1. Run the app locally
2. Visit `/admin/login`
3. Sign in with your admin credentials
4. Navigate to the Packages tab to manage packages
5. Visit the main page (`/`) to see active packages displayed to customers

## Troubleshooting

**Issue**: "Your project's URL and Key are required"
- **Solution**: Ensure environment variables are set correctly in your project settings

**Issue**: Cannot sign in to admin dashboard
- **Solution**: Verify the admin user was created in Supabase Authentication > Users

**Issue**: Packages not showing on main page
- **Solution**: Check that packages are marked as `is_active = true` in the database

**Issue**: RLS policy errors
- **Solution**: Ensure you ran the `001_create_packages_table.sql` script which sets up RLS policies
