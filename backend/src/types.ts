export interface JWTPayload {
  id: string;
  email: string;
  role: 'admin' | 'affiliate';
  tenantId: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'affiliate';
  tenant_id: string;
  password: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  trial_start: string;
  trial_end: string;
  created_by: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  status: 'trial' | 'active' | 'canceled';
  start_date: string;
  end_date: string | null;
  is_trial: boolean;
  created_at: string;
} 