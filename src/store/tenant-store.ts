import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tenant } from '@/types';
import { isDevelopment, logDebug } from '@/lib/utils';

// Cache for tenant data in development mode
const tenantCache = new Map<string, { data: Tenant, timestamp: number }>();

interface TenantState {
  tenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  loadTenant: (tenantId: string) => Promise<void>;
  loadTenantBySubdomain: (subdomain: string) => Promise<void>;
  updateTenantPlan: (subscriptionTier: string) => Promise<void>;
  setTenant: (tenant: Tenant) => void;
  clearError: () => void;
}

const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      tenant: null,
      isLoading: false,
      error: null,

      loadTenant: async (tenantId: string) => {
        try {
          const currentTenant = get().tenant;
          
          // Skip loading if we already have this tenant loaded
          if (currentTenant?.id === tenantId) {
            logDebug('Tenant already loaded, skipping:', tenantId);
            return;
          }
          
          set({ isLoading: true, error: null });
          
          // In development mode, check cache first
          if (isDevelopment) {
            const cached = tenantCache.get(tenantId);
            if (cached && Date.now() - cached.timestamp < 30000) { // 30 seconds cache
              logDebug('Using cached tenant data for ID:', tenantId);
              set({ tenant: cached.data, isLoading: false });
              return;
            }
          }
          
          // In a real app, we'd fetch from an API here
          if (isDevelopment) {
            // Mock data for development
            logDebug('Loading mock tenant data for ID:', tenantId);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mockTenant: Tenant = {
              id: tenantId,
              name: 'Development Company',
              subdomain: 'dev',
              domain: 'dev.example.com',
              logoUrl: null,
              primaryColor: '#3667CE',
              secondaryColor: '#36A490',
              subscriptionTier: 'trial',
              maxUsers: 5,
              maxAffiliates: 10,
              status: 'active',
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
              settings: {}
            };
            
            // Cache the result in development mode
            if (isDevelopment) {
              tenantCache.set(tenantId, { data: mockTenant, timestamp: Date.now() });
            }
            
            set({ tenant: mockTenant, isLoading: false });
            return;
          }
          
          // For demo and production, this would be an API call
          set({ error: new Error('API not implemented'), isLoading: false });
        } catch (error) {
          logDebug('Error loading tenant:', error);
          set({ error: error as Error, isLoading: false });
        }
      },

      loadTenantBySubdomain: async (subdomain: string) => {
        try {
          const currentTenant = get().tenant;
          
          // Skip loading if we already have this tenant loaded
          if (currentTenant?.subdomain === subdomain) {
            logDebug('Tenant already loaded, skipping subdomain:', subdomain);
            return;
          }
          
          set({ isLoading: true, error: null });
          
          // In development mode, check cache first
          if (isDevelopment) {
            const cacheKey = `subdomain:${subdomain}`;
            const cached = tenantCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 30000) { // 30 seconds cache
              logDebug('Using cached tenant data for subdomain:', subdomain);
              set({ tenant: cached.data, isLoading: false });
              return;
            }
          }
          
          // In a real app, we'd fetch from an API here
          if (isDevelopment || subdomain === 'demo') {
            // Mock data for development or demo
            logDebug('Loading mock tenant data for subdomain:', subdomain);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mockTenant: Tenant = {
              id: subdomain === 'demo' ? 'demo-tenant-id' : 'dev-tenant-id',
              name: subdomain === 'demo' ? 'Demo Company' : 'Development Company',
              subdomain: subdomain,
              domain: `${subdomain}.example.com`,
              logoUrl: null,
              primaryColor: '#3667CE',
              secondaryColor: '#36A490',
              subscriptionTier: subdomain === 'demo' ? 'professional' : 'trial',
              maxUsers: subdomain === 'demo' ? 10 : 5,
              maxAffiliates: subdomain === 'demo' ? 50 : 10,
              status: 'active',
              createdAt: new Date(),
              expiresAt: subdomain === 'demo' ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              settings: {}
            };
            
            // Cache the result in development mode
            if (isDevelopment) {
              const cacheKey = `subdomain:${subdomain}`;
              tenantCache.set(cacheKey, { data: mockTenant, timestamp: Date.now() });
            }
            
            set({ tenant: mockTenant, isLoading: false });
            return;
          }
          
          // For production, this would be an API call
          set({ error: new Error('API not implemented'), isLoading: false });
        } catch (error) {
          logDebug('Error loading tenant by subdomain:', error);
          set({ error: error as Error, isLoading: false });
        }
      },

      updateTenantPlan: async (subscriptionTier: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const currentTenant = get().tenant;
          
          if (!currentTenant) {
            throw new Error('No tenant loaded');
          }
          
          // In a real application, this would make an API call to update the tenant's plan
          // For now, we'll just update the local state
          logDebug('Updating tenant plan to:', subscriptionTier);
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const updatedTenant: Tenant = {
            ...currentTenant,
            subscriptionTier,
            status: 'active', // When updating plan, we change from trial to active
          };
          
          set({ tenant: updatedTenant, isLoading: false });
          
          // Here you would make the actual API call to update the tenant in your database
          
        } catch (error) {
          logDebug('Error updating tenant plan:', error);
          set({ error: error as Error, isLoading: false });
        }
      },

      setTenant: (tenant: Tenant) => {
        set({ tenant });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'tenant-storage',
      partialize: (state) => ({ tenant: state.tenant }),
    }
  )
);

export default useTenantStore; 