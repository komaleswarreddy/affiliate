import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
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
  
  // Methods
  loginWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      tenant: null,
      isLoading: false,
      isAuthenticated: false,

      loginWithEmail: async (email, password) => {
        set({ isLoading: true });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          set({ 
            user: data.user,
            isAuthenticated: !!data.user,
            isLoading: false,
          });

          // Get user role and tenant info
          await get().refreshUser();
          await get().getTenantDetails();

          return { error: null };
        } catch (error) {
          set({ isLoading: false });
          return { error: error as Error };
        }
      },

      signupWithEmail: async (email, password, fullName, companyName, _websiteUrl, _phoneNumber) => {
        set({ isLoading: true });
        
        try {
          // Step 1: Sign up with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });

          if (authError) throw authError;
          
          if (authData.user) {
            // Step 2: Create a new tenant
            const { data: tenantData, error: tenantError } = await supabase
              .from('tenants')
              .insert({
                name: companyName,
                plan: 'trial',
                trial_start: new Date().toISOString(),
                trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
                created_by: authData.user.id,
              })
              .select()
              .single();

            if (tenantError) throw tenantError;

            // Step 3: Create extended user profile with admin role
            const { error: profileError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                email,
                role: 'admin',
                tenant_id: tenantData.id,
              });

            if (profileError) throw profileError;
            
            set({ 
              user: authData.user,
              role: 'admin',
              tenant: tenantData as Tenant,
              isAuthenticated: true,
              isLoading: false,
            });
          }

          return { error: null };
        } catch (error) {
          set({ isLoading: false });
          return { error: error as Error };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ 
          user: null, 
          role: null, 
          tenant: null,
          isAuthenticated: false,
        });
      },

      refreshUser: async () => {
        const { data } = await supabase.auth.getUser();
        
        if (data.user) {
          set({ user: data.user, isAuthenticated: true });
          
          // Get user role
          const { data: userData } = await supabase
            .from('users')
            .select('role, tenant_id')
            .eq('id', data.user.id)
            .single();
          
          if (userData) {
            set({ 
              role: userData.role as UserRole, 
            });
          }
        }
      },

      getTenantDetails: async () => {
        const { user, role } = get();
        
        if (!user || !role) return;
        
        // Get tenant ID from user profile
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        
        if (userData?.tenant_id) {
          // Get tenant details
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', userData.tenant_id)
            .single();
          
          if (tenantData) {
            set({ tenant: tenantData as Tenant });
          }
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
      }),
    }
  )
); 