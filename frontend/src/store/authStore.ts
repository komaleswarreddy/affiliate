import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'affiliate';

export interface Tenant {
  id: string;
  name: string;
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  trial_start: string;
  trial_end: string;
}

export interface AuthState {
  user: User | null;
  role: UserRole | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  
  // Methods
  loginWithEmail: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signupWithEmail: (
    email: string, 
    password: string, 
    fullName: string, 
    companyName: string, 
    websiteUrl?: string, 
    phoneNumber?: string
  ) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getTenantDetails: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      tenant: null,
      isLoading: false,
      isAuthenticated: false,
      token: null,

      loginWithEmail: async (email, password) => {
        set({ isLoading: true });
        
        try {
          console.log('Attempting login for:', email);
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();
          console.log('Login response:', { 
            status: response.status, 
            data,
            headers: Object.fromEntries(response.headers.entries())
          });

          if (!response.ok) {
            console.error('Login failed:', data);
            throw new Error(data.error || 'Login failed');
          }

          if (!data.user || !data.token) {
            console.error('Invalid response data:', data);
            throw new Error('Invalid response from server');
          }

          console.log('Setting auth state:', {
            user: data.user,
            role: data.user.role,
            hasToken: !!data.token
          });

          set({ 
            user: data.user,
            role: data.user.role,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          await get().getTenantDetails();

          return { error: null, user: data.user };
        } catch (error) {
          console.error('Login error:', error);
          set({ 
            user: null,
            role: null,
            token: null,
            isAuthenticated: false,
            isLoading: false 
          });
          return { error: error as Error, user: null };
        }
      },

      signupWithEmail: async (email, password, fullName, companyName, websiteUrl, phoneNumber) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              fullName,
              companyName,
              websiteUrl,
              phoneNumber,
            }),
          });
          console.log(response);

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
          }

          set({ 
            user: data.user,
            role: data.user.role,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          await get().getTenantDetails();

          return { error: null };
        } catch (error) {
          set({ isLoading: false });
          return { error: error as Error };
        }
      },

      logout: async () => {
        set({ 
          user: null, 
          role: null, 
          tenant: null,
          isAuthenticated: false,
          token: null,
        });
      },

      refreshUser: async () => {
        const { token } = get();
        
        if (!token) return;

        try {
          const response = await fetch(`${API_URL}/users/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok) {
            set({ 
              user: data.user,
              role: data.user.role,
              isAuthenticated: true,
            });
          } else {
            set({ 
              user: null,
              role: null,
              isAuthenticated: false,
              token: null,
            });
          }
        } catch (error) {
          console.error('Error refreshing user:', error);
          set({ 
            user: null,
            role: null,
            isAuthenticated: false,
            token: null,
          });
        }
      },

      getTenantDetails: async () => {
        const { token } = get();
        
        if (!token) return;
        
        try {
          const response = await fetch(`${API_URL}/tenants/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok) {
            set({ tenant: data.tenant });
          }
        } catch (error) {
          console.error('Error fetching tenant details:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        role: state.role, 
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
); 