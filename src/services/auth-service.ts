import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_URL } from '@/lib/constants';
import { isDevelopment, logDebug, isMockApiModeEnabled } from '@/lib/utils';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    role?: string;
    roles?: string[];
    permissions?: string[];
  };
}

interface ErrorResponse {
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenant: string;
}

export interface RegisterUser {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  tenant: string;
  companyName: string;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
  tenant: string;
}

export interface PasswordUpdateRequest {
  password: string;
  token: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
    tenantId: string;
    roles?: string[];
    permissions?: string[];
  };
}

/**
 * Service for handling authentication-related API requests
 */
export class AuthService {
  private axiosInstance: AxiosInstance;
  private fullApiUrl: string;
  private tokenKey: string = 'auth_token';
  private useMockApi: boolean;

  constructor() {
    // Ensure the API_URL is properly formatted
    // Log the raw API_URL for debugging
    logDebug('Raw API_URL:', API_URL);
    
    // Simplify URL handling by using URL class
    let baseUrl = '';
    
    try {
      // Test if API_URL is a valid URL
      if (API_URL.startsWith('http://') || API_URL.startsWith('https://')) {
        // It's already a full URL
        const url = new URL(API_URL);
        
        // Make sure path ends with a slash
        if (!url.pathname.endsWith('/')) {
          url.pathname = url.pathname + '/';
        }
        
        // Add api/ if not present
        if (!url.pathname.includes('/api/')) {
          url.pathname = url.pathname + 'api/';
        }
        
        baseUrl = url.toString();
      } else {
        // It's a relative URL
        baseUrl = API_URL;
        if (!baseUrl.endsWith('/')) {
          baseUrl += '/';
        }
        
        if (!baseUrl.includes('/api/')) {
          baseUrl += 'api/';
        }
      }
    } catch (error) {
      logDebug('Error parsing API URL:', error);
      // Fallback
      baseUrl = API_URL.endsWith('/') ? API_URL + 'api/' : API_URL + '/api/';
    }
    
    this.fullApiUrl = `${baseUrl}auth`;
    
    logDebug('Constructed auth API URL:', this.fullApiUrl);
    
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false, // This is important for CORS requests to work properly
    });

    // Add interceptors for logging and error handling
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Log the full request URL for debugging
        logDebug(`Auth API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logDebug('Auth API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        logDebug('Auth API Response:', response.status);
        return response;
      },
      (error) => {
        // Detailed error logging
        if (error.response) {
          // Server responded with an error status
          logDebug('Auth API Error Response:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
        } else if (error.request) {
          // Request was made but no response received (CORS or network issue)
          logDebug('Auth API No Response Error:', {
            request: error.request,
            message: error.message,
          });
          
          // Log specific CORS information if available
          if (error.message.includes('CORS')) {
            logDebug('CORS Error Detected. Check server CORS configuration.');
          }
        } else {
          // Error setting up the request
          logDebug('Auth API Setup Error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );

    this.useMockApi = isDevelopment && (localStorage.getItem('useMockApi') === 'true' || typeof window !== 'undefined' && window.location.href.includes('useMockApi=true'));
    
    logDebug('AuthService initialized with baseUrl:', this.fullApiUrl);
    logDebug('Using mock API:', this.useMockApi);
  }

  /**
   * Login a user with their credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    logDebug('Attempting login with credentials:', { 
      email: credentials.email, 
      tenant: credentials.tenant 
    });
    
    const url = `${this.fullApiUrl}/login`;
    logDebug('Login URL:', url);
    
    try {
      const response: AxiosResponse<AuthResponse> = await this.axiosInstance.post(
        url,
        credentials
      );
      
      logDebug('Login successful');
      return response.data;
    } catch (error) {
      logDebug('Login failed:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterUser): Promise<AuthResponse> {
    logDebug('Attempting registration with data:', { 
      email: userData.email, 
      tenant: userData.tenant,
      firstName: userData.firstName,
      lastName: userData.lastName 
    });
    
    const url = `${this.fullApiUrl}/register`;
    logDebug('Registration URL:', url);
    
    try {
      // Log full request data for debugging (excluding password)
      const debugData = {
        ...userData,
        password: '********',
        confirmPassword: userData.confirmPassword ? '********' : undefined
      };
      logDebug('Sending registration data:', debugData);
      
      // DEVELOPMENT MODE: In local mode with specific URL, bypass API and do direct DB registration
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        logDebug('LOCAL DEV MODE: Using direct registration bypass for localhost');
        
        // Create mock successful response
        const userId = 'local-dev-' + Math.floor(Math.random() * 1000000);
        const tenantId = 'local-tenant-' + Math.floor(Math.random() * 1000000);
        const mockToken = 'mock-jwt-token-for-dev-registration';
        
        // Store token
        this.setToken(mockToken);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        logDebug('LOCAL DEV MODE: Registration successful');
        return {
          token: mockToken,
          user: {
            id: userId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            tenantId: tenantId,
            roles: ['admin'],
            permissions: ['*']
          }
        };
      }
      
      // Normal operation - call API
      const response: AxiosResponse<AuthResponse> = await this.axiosInstance.post(
        url,
        userData
      );
      
      logDebug('Registration successful');
      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      if (error.response) {
        // The request was made and the server responded with an error status
        logDebug('Registration server error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received (network error)
        logDebug('Registration network error - no response received:', {
          request: error.request
        });
      } else {
        // Something happened in setting up the request
        logDebug('Registration error:', error.message);
      }
      
      logDebug('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    logDebug('Requesting password reset for:', data.email);
    await this.axiosInstance.post(`${this.fullApiUrl}/request-password-reset`, data);
    logDebug('Password reset requested successfully');
  }

  /**
   * Validate password reset token
   */
  async validateResetToken(token: string): Promise<boolean> {
    logDebug('Validating reset token');
    try {
      await this.axiosInstance.get(`${this.fullApiUrl}/validate-reset-token/${token}`);
      logDebug('Reset token is valid');
      return true;
    } catch (error) {
      logDebug('Reset token is invalid');
      return false;
    }
  }

  /**
   * Update password with reset token
   */
  async updatePassword(data: PasswordUpdateRequest): Promise<void> {
    logDebug('Updating password with reset token');
    await this.axiosInstance.post(`${this.fullApiUrl}/update-password`, data);
    logDebug('Password updated successfully');
  }

  /**
   * Get the stored auth token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Set the auth token
   * In a production environment, you might consider implementing this
   * using HttpOnly cookies for better security against XSS attacks.
   */
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    
    // Security note: In a real-world application, consider these options:
    // 1. Use httpOnly cookies (requires server-side implementation)
    // 2. Use a combination of short-lived tokens in memory and refresh tokens
    // 3. Implement token rotation strategies
    
    // For this application, we're using localStorage for simplicity, but
    // be aware of the security implications in production environments.
  }

  /**
   * Clear the auth token
   */
  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * Check if a token is valid
   */
  async isTokenValid(token: string): Promise<boolean> {
    try {
      if (!token) {
        return false;
      }
      
      if (this.useMockApi) {
        // In mock mode, consider mock tokens valid
        return token.startsWith('mock-jwt-token');
      }
      
      // First, do a basic client-side check of the token
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        logDebug('Invalid token format (not a JWT)');
        return false;
      }
      
      try {
        // Check token expiration locally (avoid unnecessary API calls)
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        // If token has expiration and it's in the past
        if (payload.exp && payload.exp < now) {
          logDebug('Token is expired');
          return false;
        }
      } catch (error) {
        logDebug('Failed to parse token payload:', error);
        return false;
      }
      
      // If local validation passed, verify with server
      const response = await this.axiosInstance.post(`${this.fullApiUrl}/verify-token`, { token });
      return response.data?.valid === true;
    } catch (error) {
      logDebug('Token validation error:', error);
      return false;
    }
  }

  /**
   * Check if the user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const token = this.getToken();
    return token ? await this.isTokenValid(token) : false;
  }

  /**
   * Logout the user
   */
  logout(): void {
    this.clearToken();
    // Optionally invalidate token on server
    // if (!this.useMockApi) {
    //   this.axiosInstance.post(`${this.fullApiUrl}/logout`);
    // }
  }

  /**
   * Get the current user's data
   */
  async getCurrentUser(): Promise<LoginResponse['user'] | null> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return null;
      }
      
      // In development mode with mock token, return mock user data
      if (this.useMockApi || (isDevelopment && token && token.startsWith('mock-jwt-token'))) {
        if (token === 'mock-jwt-token-for-demo-user') {
          return {
            id: 'demo-user-id',
            email: 'demo@example.com',
            firstName: 'Demo',
            lastName: 'User',
            tenantId: 'demo-tenant',
            roles: ['admin'],
            permissions: ['*']
          };
        } else {
          return {
            id: 'admin-user-id',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
            tenantId: 'default-tenant',
            roles: ['admin'],
            permissions: ['*']
          };
        }
      }
      
      // Decode the JWT token to get the user ID and tenant ID
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        
        return {
          id: payload.userId,
          email: payload.email,
          firstName: payload.firstName || '',
          lastName: payload.lastName || '',
          tenantId: payload.tenantId,
          roles: payload.roles || [],
          permissions: payload.permissions || []
        };
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Create tenant and admin user
   */
  async createTenantAndAdmin(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName: string;
    tenant: string;
  }): Promise<string> {
    const userData: RegisterUser = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      tenant: data.tenant,
      companyName: data.companyName,
      acceptTerms: true
    };
    
    return this.register(userData).then(response => response.token);
  }

  /**
   * Invite an affiliate
   */
  async inviteAffiliate(email: string): Promise<void> {
    // In a real app, this would send an API request to invite the affiliate
    // For now, just simulate it
    console.log(`Inviting affiliate: ${email}`);
    return Promise.resolve();
  }
}

// Create and export a default instance of the AuthService
const authService = new AuthService();
export default authService; 