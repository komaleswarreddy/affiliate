-- Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'trial',
  trial_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  trial_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_plan CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise'))
);

-- Extended User Profiles Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN ('admin', 'affiliate'))
);

-- Invites Table
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'affiliate',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN ('affiliate'))
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_trial BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_plan CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise')),
  CONSTRAINT valid_status CHECK (status IN ('trial', 'active', 'canceled'))
);

-- Row Level Security Policies

-- Enable RLS on all tables but don't force it to ensure service role can bypass
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop all policies to ensure a clean state
DROP POLICY IF EXISTS users_select_policy ON public.users;
DROP POLICY IF EXISTS users_auth_policy ON public.users;
DROP POLICY IF EXISTS users_tenant_select_policy ON public.users;
DROP POLICY IF EXISTS users_insert_policy ON public.users;
DROP POLICY IF EXISTS users_update_policy ON public.users;
DROP POLICY IF EXISTS users_delete_policy ON public.users;
DROP POLICY IF EXISTS tenants_all_policy ON public.tenants;
DROP POLICY IF EXISTS tenants_select_policy ON public.tenants;
DROP POLICY IF EXISTS invites_select_policy ON public.invites;
DROP POLICY IF EXISTS invites_insert_policy ON public.invites;
DROP POLICY IF EXISTS invites_update_policy ON public.invites;
DROP POLICY IF EXISTS invites_delete_policy ON public.invites;
DROP POLICY IF EXISTS subscriptions_select_policy ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_insert_policy ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_update_policy ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_delete_policy ON public.subscriptions;

-- Authentication-friendly policies

-- Tenants Table Policies - simplified authentication friendly version
CREATE POLICY tenants_select_policy ON public.tenants
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE tenant_id = public.tenants.id
    )
    OR
    auth.uid() = public.tenants.created_by
  );

CREATE POLICY tenants_insert_policy ON public.tenants
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
  );

CREATE POLICY tenants_update_policy ON public.tenants
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin' AND tenant_id = public.tenants.id
    )
  );

CREATE POLICY tenants_delete_policy ON public.tenants
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin' AND tenant_id = public.tenants.id
    )
  );

-- Users Table Policies - critical for authentication
-- Authentication-specific policy
CREATE POLICY users_auth_policy ON public.users
  FOR SELECT USING (
    id = auth.uid()
  );

-- Admin access policy
CREATE POLICY users_admin_policy ON public.users
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin' AND tenant_id = public.users.tenant_id
    )
  );

-- Self-management policy
CREATE POLICY users_self_policy ON public.users
  FOR UPDATE USING (
    id = auth.uid()
  );

-- Invites Table Policies
CREATE POLICY invites_select_policy ON public.invites
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin' AND tenant_id = public.invites.tenant_id
    )
  );

CREATE POLICY invites_insert_policy ON public.invites
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin' AND tenant_id = public.invites.tenant_id
    )
  );

CREATE POLICY invites_update_policy ON public.invites
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin' AND tenant_id = public.invites.tenant_id
    )
  );

CREATE POLICY invites_delete_policy ON public.invites
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin' AND tenant_id = public.invites.tenant_id
    )
  );

-- Subscriptions Table Policies
CREATE POLICY subscriptions_select_policy ON public.subscriptions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE tenant_id = public.subscriptions.tenant_id
    )
  );

CREATE POLICY subscriptions_insert_policy ON public.subscriptions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin' AND tenant_id = public.subscriptions.tenant_id
    )
  );

CREATE POLICY subscriptions_update_policy ON public.subscriptions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin' AND tenant_id = public.subscriptions.tenant_id
    )
  );

CREATE POLICY subscriptions_delete_policy ON public.subscriptions
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin' AND tenant_id = public.subscriptions.tenant_id
    )
  );

-- Functions and Triggers

-- Function to create a subscription record when a tenant is created
CREATE OR REPLACE FUNCTION public.handle_new_tenant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (tenant_id, plan, status, is_trial)
  VALUES (NEW.id, NEW.plan, 'trial', TRUE);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create a subscription when a tenant is created
CREATE TRIGGER on_tenant_created
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_tenant(); 