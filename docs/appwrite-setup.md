# Appwrite Setup Guide

## 1. Create Appwrite Project

1. Go to [Appwrite Cloud](https://cloud.appwrite.io) or your self-hosted instance
2. Create a new project
3. Note your Project ID

## 2. Create Database

1. Navigate to Databases in your Appwrite console
2. Create a new database named "bookings-db"
3. Note the Database ID

## 3. Create Collections

### Bookings Collection

Create a collection named "bookings" with the following attributes:

| Attribute Name    | Type     | Size | Required | Array | Default |
|------------------|----------|------|----------|-------|---------|
| date             | string   | 255  | Yes      | No    | -       |
| time             | string   | 255  | Yes      | No    | -       |
| customerName     | string   | 255  | Yes      | No    | -       |
| customerEmail    | string   | 255  | Yes      | No    | -       |
| serviceName      | string   | 255  | Yes      | No    | -       |
| price            | integer  | -    | Yes      | No    | -       |
| status           | string   | 255  | Yes      | No    | confirmed |
| paymentIntentId  | string   | 255  | No       | No    | -       |

**Indexes:**
- Create an index on `date` (type: key, ascending)
- Create an index on `customerEmail` (type: key, ascending)
- Create an index on `status` (type: key, ascending)

**Permissions:**
- Read: Any
- Create: Any
- Update: Any
- Delete: Any

(Note: In production, you should restrict these permissions based on user roles)

## 4. Create API Key

1. Go to Settings > API Keys
2. Create a new API key with the following scopes:
   - `sessions.write`
   - `databases.read`
   - `databases.write`
3. Note the API Key

## 5. Setup Authentication

1. Navigate to Auth in your Appwrite console
2. Enable Email/Password authentication
3. Create an admin user account:
   - Email: your-admin@example.com
   - Password: (choose a secure password)
4. This account will be used to access the admin dashboard

## 6. Environment Variables

Add these environment variables to your Vercel project:

\`\`\`env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID=your_bookings_collection_id
NEXT_APPWRITE_KEY=your_api_key
\`\`\`

## 7. Admin Access

To access the admin dashboard:
1. Navigate to `/admin/login`
2. Sign in with the admin account you created in step 5
3. You'll be redirected to the admin dashboard

## 8. Testing

1. Test booking flow: Create a booking from the main page
2. Test admin login: Sign in at `/admin/login`
3. Test admin features: View payments, manage clients, process refunds
4. Test logout: Ensure session is properly cleared

## Notes

- All bookings are stored in Appwrite database
- Admin authentication uses secure HTTP-only cookies
- Payment data is synced with Stripe
- Refunds are processed through Stripe API
