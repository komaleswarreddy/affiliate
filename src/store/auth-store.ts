import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isDevelopment, logDebug } from '../lib/utils';
import authService, { LoginCredentials, RegisterUser, AuthResponse } from '../services/auth-service';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  isAdmin?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  tenant: string;
  acceptTerms: boolean;
}

interface TenantRegistrationData {
  companyName: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  subdomain: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  error: Error | null;
  login: (email: string, password: string, tenant?: string) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  createTenantAndAdmin: (data: TenantRegistrationData) => Promise<string>;
  logout: () => Promise<void>;
  loadUserData: () => Promise<void>;
  inviteAffiliate: (email: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  clearError: () => void;
}

// Demo data - keeping this for reference even though it's not currently used
// const demoTenant: Tenant = {
//   id: 'demo-tenant-id',
//   name: 'Demo Company',
//   domain: 'demo.example.com',
//   subdomain: 'demo',
//   logoUrl: '',
//   primaryColor: '#3667CE',
//   secondaryColor: '#36A490',
//   subscriptionTier: 'professional',
//   maxUsers: 10,
//   maxAffiliates: 50,
//   status: 'active',
//   createdAt: new Date(),
//   expiresAt: null,
//   settings: {}
// };

// Create the auth store
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,

      login: async (email: string, password: string, tenant: string = '') => {
        try {
          set({ isLoading: true, error: null });
          logDebug('Attempting login with email', email);
          
          // Create credentials object for auth service
          const credentials: LoginCredentials = {
            email,
            password,
            tenant
          };
          
          // Use the auth service for login
          const response = await authService.login(credentials);
          
          // Check if the user has admin role
          const isAdmin = response.user.roles?.includes('admin') || response.user.role === 'admin';
          
          set({
            isAuthenticated: true,
            user: {
              ...response.user,
              // Use the tenantId from the response rather than the subdomain
              tenantId: response.user.tenantId,
              // Ensure roles is always an array
              roles: response.user.roles || (response.user.role ? [response.user.role] : []),
              // Use permissions from response or fallback to default
              permissions: response.user.permissions || ['*'], 
              isAdmin: isAdmin
            },
            isLoading: false
          });
          
          return response;
        } catch (error) {
          logDebug('Login error', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to login'),
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (registerData: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          logDebug('Attempting registration with email', registerData.email);
          
          // Create user data object for auth service
          const userData: RegisterUser = {
            firstName: registerData.firstName,
            lastName: registerData.lastName,
            email: registerData.email,
            password: registerData.password,
            confirmPassword: registerData.confirmPassword,
            tenant: registerData.tenant,
            companyName: registerData.companyName,
            acceptTerms: registerData.acceptTerms
          };
          
          // Use the auth service for registration
          const response = await authService.register(userData);
          
          // Check if the user has admin role
          const isAdmin = response.user.role === 'admin';
          
          set({
            isAuthenticated: true,
            user: {
              ...response.user,
              tenantId: registerData.tenant,
              roles: response.user.role ? [response.user.role] : [],
              permissions: ['*'], // Simplified for demo
              isAdmin: isAdmin
            },
            isLoading: false
          });
          
          return response;
        } catch (error) {
          logDebug('Registration error', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to register'),
            isLoading: false 
          });
          throw error;
        }
      },

      createTenantAndAdmin: async (data: TenantRegistrationData) => {
        // This is just a wrapper around the register function
        try {
          set({ isLoading: true, error: null });
          
          await get().register({
            firstName: data.adminFirstName,
            lastName: data.adminLastName,
            email: data.adminEmail,
            password: data.adminPassword,
            confirmPassword: data.adminPassword,
            companyName: data.companyName,
            tenant: data.subdomain,
            acceptTerms: true
          });
          
          const user = get().user;
          return user?.tenantId || '';
        } catch (error) {
          logDebug('Tenant creation error', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to create tenant'),
            isLoading: false 
          });
          return '';
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          
          // Use the auth service to logout
          authService.logout();
          
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false
          });
        } catch (error) {
          logDebug('Logout error', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to logout'),
            isLoading: false 
          });
        }
      },

      loadUserData: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Check if token exists
          const token = authService.getToken();
          if (!token) {
            set({ isAuthenticated: false, user: null, isLoading: false });
            return;
          }
          
          // Verify the token is valid
          const isValid = await authService.isTokenValid(token);
          if (!isValid) {
            authService.clearToken();
            set({ isAuthenticated: false, user: null, isLoading: false });
            return;
          }
          
          // Get user data from token or server
          try {
            // Fetch current user data from the backend
            const userData = await authService.getCurrentUser();
            
            if (!userData) {
              throw new Error('Failed to load user data');
            }
            
            // Set user data in state
            set({
              isAuthenticated: true,
              user: {
                ...userData,
                isAdmin: userData.roles?.includes('admin') || false
              },
              isLoading: false
            });
          } catch (error) {
            // If there's an error fetching user data, invalidate authentication
            logDebug('Error fetching user data:', error);
            authService.clearToken();
            set({ 
              isAuthenticated: false, 
              user: null, 
              isLoading: false,
              error: error instanceof Error ? error : new Error('Failed to load user data')
            });
          }
        } catch (error) {
          logDebug('Load user data error:', error);
          authService.clearToken();
          set({ 
            isAuthenticated: false,
            user: null,
            error: error instanceof Error ? error : new Error('Failed to load user data'),
            isLoading: false 
          });
        }
      },

      inviteAffiliate: async (email: string) => {
        try {
          set({ isLoading: true });
          // This is a stub - would normally call API
          console.log('Invited affiliate:', email);
          set({ isLoading: false });
        } catch (error) {
          logDebug('Invite affiliate error', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to invite affiliate'),
            isLoading: false 
          });
        }
      },
      
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) {
          return false;
        }
        
        // If user is admin or has wildcard permission, they can do anything
        if (user.isAdmin || user.permissions?.includes('*')) {
          return true;
        }
        
        // Check specific permission
        return user.permissions?.includes(permission) || false;
      },
      
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Expose the auth store in the window object for debugging in development mode
if (isDevelopment && typeof window !== 'undefined') {
  (window as any).__ZUSTAND_AUTH_STORE__ = useAuthStore;
  
  // Add a data attribute to the document body to indicate that the auth store is available
  if (typeof document !== 'undefined') {
    document.body.setAttribute('data-zustand-store', 'auth-store');
  }
}

export default useAuthStore;