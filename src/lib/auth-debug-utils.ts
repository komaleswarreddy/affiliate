/**
 * Auth Debugging Utilities
 * 
 * This file provides utility functions for debugging authentication
 * that can be used from the browser console.
 */

import authService from '@/services/auth-service';
import { isDevelopment } from '@/lib/utils';

// Helper to stringify objects with circular references
export const safeStringify = (obj: any, indent = 2) => {
  let cache: any[] = [];
  const safeObj = JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.includes(value)) {
          return '[Circular]';
        }
        cache.push(value);
      }
      return value;
    },
    indent
  );
  cache = [];
  return safeObj;
};

/**
 * Helper function to inspect the current auth state
 */
export function inspectAuthState() {
  try {
    if (typeof window === 'undefined') {
      console.log('This function can only be used in the browser');
      return null;
    }
    
    // Get the auth store from Zustand
    const authStore = (window as any).__ZUSTAND_AUTH_STORE__;
    if (!authStore) {
      console.error('Auth store not found');
      return null;
    }
    
    const state = authStore.getState();
    if (!state) {
      console.error('Auth state not found');
      return null;
    }
    
    const { isAuthenticated, user, isLoading, error } = state;
    
    return {
      isAuthenticated,
      user,
      isLoading,
      error: error ? error.message : null,
      token: authService.getToken(),
    };
  } catch (error) {
    console.error('Error inspecting auth state:', error);
    return null;
  }
}

/**
 * Helper function to check if the current token is valid
 */
export async function checkToken() {
  try {
    const token = authService.getToken();
    if (!token) {
      console.log('No token found');
      return false;
    }
    
    const isValid = await authService.isTokenValid(token);
    return isValid;
  } catch (error) {
    console.error('Error checking token:', error);
    return false;
  }
}

/**
 * Helper function to force logout
 */
export function forceLogout() {
  try {
    authService.logout();
    console.log('Logged out successfully');
    
    // Also directly manipulate Zustand store state
    const authStore = (window as any).__ZUSTAND_AUTH_STORE__;
    if (authStore) {
      authStore.setState({
        isAuthenticated: false,
        user: null,
      });
      console.log('Auth store state updated');
    }
    
    return true;
  } catch (error) {
    console.error('Error forcing logout:', error);
    return false;
  }
}

/**
 * Helper function to reload user data
 */
export async function reloadUserData() {
  try {
    // Get the auth store from Zustand
    const authStore = (window as any).__ZUSTAND_AUTH_STORE__;
    if (!authStore) {
      console.error('Auth store not found');
      return false;
    }
    
    const { loadUserData } = authStore.getState();
    if (!loadUserData) {
      console.error('loadUserData function not found');
      return false;
    }
    
    await loadUserData();
    console.log('User data reloaded successfully');
    return true;
  } catch (error) {
    console.error('Error reloading user data:', error);
    return false;
  }
}

// Expose debugging functions on window object in development mode
if (isDevelopment && typeof window !== 'undefined') {
  (window as any).__AUTH_DEBUG__ = {
    inspectAuthState,
    checkToken,
    forceLogout,
    reloadUserData,
    safeStringify,
  };
  
  console.log(
    '%cAuth Debug Utils loaded. Access via window.__AUTH_DEBUG__',
    'color: green; font-weight: bold;'
  );
} 