# Backend - Supabase Configuration

This directory contains Supabase configuration and database initialization scripts for the Affiliate Management Platform.

## Database Schema

The application uses the following tables:

1. **tenants** - Organizations/companies with subscription information
   - `id`: UUID (Primary Key)
   - `name`: Text (Company name)
   - `plan`: Text (trial/starter/pro/enterprise)
   - `trial_start`: Timestamp
   - `trial_end`: Timestamp
   - `created_by`: UUID (Admin user who created the tenant)
   - `created_at`: Timestamp

2. **users** - Extended user profiles with roles and tenant relationships
   - `id`: UUID (Primary Key, references auth.users)
   - `email`: Text
   - `role`: Text (admin/affiliate)
   - `tenant_id`: UUID (references tenants.id)
   - `invited_by`: UUID (optional, references auth.users)
   - `created_at`: Timestamp

3. **invites** - For managing affiliate invitations
   - `id`: UUID (Primary Key)
   - `email`: Text
   - `tenant_id`: UUID (references tenants.id)
   - `role`: Text (always 'affiliate')
   - `created_by`: UUID (references auth.users)
   - `accepted_at`: Timestamp (nullable)
   - `created_at`: Timestamp

4. **subscriptions** - For tracking subscription plans and status
   - `id`: UUID (Primary Key)
   - `tenant_id`: UUID (references tenants.id)
   - `plan`: Text (trial/starter/pro/enterprise)
   - `status`: Text (trial/active/canceled)
   - `start_date`: Timestamp
   - `end_date`: Timestamp (nullable)
   - `is_trial`: Boolean
   - `created_at`: Timestamp

## Security Policies

Row-level security policies are implemented to ensure:

1. Users can only see and interact with their own tenant's data
2. Admins have broader permissions within their tenant
3. Affiliates have limited permissions

## Setup Instructions

1. Create a new Supabase project

2. Execute the SQL script in the Supabase SQL editor:
   - Copy the contents of `schema.sql`
   - Paste into the SQL editor in the Supabase dashboard
   - Run the script

3. Configure authentication settings in Supabase:
   - Enable email/password authentication
   - Disable email confirmations for development (optional)
   - Set up email templates for invitations

4. Update environment variables in the frontend project:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Plan Limitations

The system enforces the following plan limitations:

| Plan       | Max Affiliates | Max Users | Max Tiers | Products  | Invoicing |
| ---------- | -------------- | --------- | --------- | --------- | --------- |
| Trial      | 10             | 2         | 2         | 5         | No        |
| Starter    | 100            | 5         | 5         | 20        | Yes       |
| Pro        | 1000           | 20        | 10        | 100       | Yes       |
| Enterprise | Unlimited      | 50        | Unlimited | Unlimited | Yes       |

These limitations are enforced both on the frontend and backend. 