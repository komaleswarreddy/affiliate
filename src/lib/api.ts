import { createClient } from '@supabase/supabase-js';
import { API_URL } from '@/lib/constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API client for backend services - use the same API_URL as in constants.ts
const api = {
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },

  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  clearToken: () => {
    localStorage.removeItem('auth_token');
  },

  request: async (endpoint: string, options: RequestInit = {}) => {
    const token = api.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return response.json();
  },

  // Auth endpoints
  auth: {
    login: (email: string, password: string, tenant?: string) => {
      return api.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, tenant }),
      });
    },
    
    logout: () => {
      api.clearToken();
    },
  },

  // Affiliate endpoints
  affiliates: {
    getAll: () => {
      return api.request('/api/affiliates');
    },

    create: (data: any) => {
      return api.request('/api/affiliates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: (id: string, data: any) => {
      return api.request(`/api/affiliates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: (id: string) => {
      return api.request(`/api/affiliates/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Campaign endpoints
  campaigns: {
    getAll: () => {
      return api.request('/api/campaigns');
    },

    getById: (id: string) => {
      return api.request(`/api/campaigns/${id}`);
    },

    optIn: (id: string) => {
      return api.request(`/api/campaigns/${id}/opt-in`, {
        method: 'POST'
      });
    },

    getMetrics: (id: string) => {
      return api.request(`/api/campaigns/${id}/metrics`);
    }
  },

  // Add more API endpoints as needed
};

export { api };