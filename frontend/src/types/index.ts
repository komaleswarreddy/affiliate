export interface User {
  id: string;
  email: string;
  role: string;
  tenant_id: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  trial_start: string;
  trial_end: string;
  created_by: string;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  price: number;
  product_commission?: number;
  image_url?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  tenant_id: string;
  commission_tier_id: string;
  total_earnings: number;
  status: string;
  created_at: string;
  updated_at: string;
  users?: User;
  commission_tiers?: {
    name: string;
    commission_rate: number;
  };
}

export interface Invite {
  id: string;
  email: string;
  tenant_id: string;
  product_id: string;
  role: string;
  created_by: string;
  status: string;
  accepted_at?: string;
  created_at: string;
} 