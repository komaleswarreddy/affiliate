/**
 * Authentication Console Test Script
 * 
 * This script can be copied into the browser console to test the authentication system.
 * It provides helper functions to test login, registration, token verification, and more.
 */

// Define the global test object
declare global {
  interface Window {
    authTest: {
      login: (email?: string, password?: string, tenant?: string) => Promise<any>;
      register: (
        firstName?: string, 
        lastName?: string,
        email?: string,
        password?: string,
        companyName?: string,
        tenant?: string
      ) => Promise<any>;
      logout: () => void;
      verifyToken: () => Promise<any>;
      checkAuthState: () => any;
      runAllTests: () => Promise<void>;
    };
  }
}

/**
 * Function to initialize the auth test in the browser console
 */
export function initAuthConsoleTest() {
  // Helper to stringify objects with circular references
  const safeStringify = (obj: any, indent = 2) => {
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

  // Test credentials
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'Test123!';
  const TEST_TENANT = 'test';
  const TEST_FIRST_NAME = 'Test';
  const TEST_LAST_NAME = 'User';
  const TEST_COMPANY = 'Test Company';

  // Create a global object with test functions
  window.authTest = {
    // Test login
    login: async (
      email = TEST_EMAIL, 
      password = TEST_PASSWORD, 
      tenant = TEST_TENANT
    ) => {
      try {
        // Get the auth store from Zustand
        const authStore = document.querySelector('[data-zustand-store="auth-store"]');
        if (!authStore) {
          console.error('Auth store not found');
          return;
        }
        
        const loginFn = (window as any).__ZUSTAND_AUTH_STORE__.login;
        if (!loginFn) {
          console.error('Login function not found in auth store');
          return;
        }
        
        console.log(`Attempting login with ${email}, ${password}, ${tenant}`);
        const result = await loginFn(email, password, tenant);
        console.log('Login result:', result);
        return result;
      } catch (error) {
        console.error('Login test failed:', error);
        return { error };
      }
    },
    
    // Test registration
    register: async (
      firstName = TEST_FIRST_NAME,
      lastName = TEST_LAST_NAME,
      email = `${Date.now()}-${TEST_EMAIL}`,
      password = TEST_PASSWORD,
      companyName = TEST_COMPANY,
      tenant = `${Date.now()}-${TEST_TENANT}`
    ) => {
      try {
        // Get the auth store from Zustand
        const authStore = document.querySelector('[data-zustand-store="auth-store"]');
        if (!authStore) {
          console.error('Auth store not found');
          return;
        }
        
        const registerFn = (window as any).__ZUSTAND_AUTH_STORE__.register;
        if (!registerFn) {
          console.error('Register function not found in auth store');
          return;
        }
        
        console.log(`Attempting registration with email ${email} and tenant ${tenant}`);
        const result = await registerFn({
          firstName,
          lastName,
          email,
          password,
          confirmPassword: password,
          companyName,
          tenant,
          acceptTerms: true
        });
        console.log('Registration result:', result);
        return result;
      } catch (error) {
        console.error('Registration test failed:', error);
        return { error };
      }
    },
    
    // Test logout
    logout: () => {
      try {
        // Try to import the auth service
        import('../services/auth-service').then((module) => {
          const authService = module.default;
          if (!authService) {
            console.error('Auth service not found');
            return;
          }
          
          console.log('Logging out...');
          authService.logout();
          console.log('Logged out successfully');
          
          // Check if token is gone
          const token = authService.getToken();
          console.log('Token after logout:', token);
          return !token;
        });
      } catch (error) {
        console.error('Logout test failed:', error);
        return { error };
      }
    },
    
    // Verify token
    verifyToken: async () => {
      try {
        // Try to import the auth service
        const module = await import('../services/auth-service');
        const authService = module.default;
        if (!authService) {
          console.error('Auth service not found');
          return;
        }
        
        const token = authService.getToken();
        if (!token) {
          console.log('No token found. Please login first.');
          return false;
        }
        
        console.log('Verifying token...');
        const isValid = await authService.isTokenValid(token);
        console.log('Token valid:', isValid);
        return isValid;
      } catch (error) {
        console.error('Token verification test failed:', error);
        return { error };
      }
    },
    
    // Check auth state
    checkAuthState: () => {
      try {
        // Get the auth store from Zustand
        const authStore = (window as any).__ZUSTAND_AUTH_STORE__;
        if (!authStore) {
          console.error('Auth store not found');
          return;
        }
        
        const state = authStore.getState();
        console.log('Current auth state:', safeStringify(state));
        return state;
      } catch (error) {
        console.error('Check auth state failed:', error);
        return { error };
      }
    },
    
    // Run all tests
    runAllTests: async () => {
      console.log('%c======= STARTING AUTHENTICATION TESTS =======', 'font-weight: bold; font-size: 16px; color: blue;');
      
      // First, ensure we're logged out
      window.authTest.logout();
      
      // Wait a second for logout to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test registration with a unique email and tenant
      const uniqueEmail = `test-${Date.now()}@example.com`;
      const uniqueTenant = `test-${Date.now()}`;
      
      console.log(`%cTesting registration with unique email ${uniqueEmail} and tenant ${uniqueTenant}`, 'font-weight: bold;');
      const regResult = await window.authTest.register(
        TEST_FIRST_NAME,
        TEST_LAST_NAME,
        uniqueEmail,
        TEST_PASSWORD,
        TEST_COMPANY,
        uniqueTenant
      );
      
      console.log(`%cRegistration test result: ${regResult ? 'PASSED' : 'FAILED'}`, 
        `font-weight: bold; color: ${regResult ? 'green' : 'red'};`);
      
      if (regResult) {
        // If registration passed, verify the token
        console.log('%cVerifying token after registration...', 'font-weight: bold;');
        const tokenResult = await window.authTest.verifyToken();
        console.log(`%cToken verification test result: ${tokenResult ? 'PASSED' : 'FAILED'}`, 
          `font-weight: bold; color: ${tokenResult ? 'green' : 'red'};`);
        
        // Check auth state
        console.log('%cChecking auth state after registration...', 'font-weight: bold;');
        window.authTest.checkAuthState();
        
        // Logout to prepare for login test
        console.log('%cLogging out after registration...', 'font-weight: bold;');
        window.authTest.logout();
        
        // Wait a second for logout to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Test login with the demo account
      console.log('%cTesting login with demo account...', 'font-weight: bold;');
      const loginResult = await window.authTest.login('demo@example.com', 'Demo123!', 'demo');
      
      console.log(`%cLogin test result: ${loginResult ? 'PASSED' : 'FAILED'}`, 
        `font-weight: bold; color: ${loginResult ? 'green' : 'red'};`);
      
      if (loginResult) {
        // Check auth state
        console.log('%cChecking auth state after login...', 'font-weight: bold;');
        window.authTest.checkAuthState();
        
        // Verify the token
        console.log('%cVerifying token after login...', 'font-weight: bold;');
        const tokenResult = await window.authTest.verifyToken();
        console.log(`%cToken verification test result: ${tokenResult ? 'PASSED' : 'FAILED'}`, 
          `font-weight: bold; color: ${tokenResult ? 'green' : 'red'};`);
        
        // Final logout
        console.log('%cLogging out after login...', 'font-weight: bold;');
        window.authTest.logout();
      }
      
      console.log('%c======= AUTHENTICATION TESTS COMPLETE =======', 'font-weight: bold; font-size: 16px; color: blue;');
    }
  };
  
  // Print instructions
  console.log('%c=== Authentication Test Console ===', 'font-weight: bold; font-size: 18px; color: blue;');
  console.log('The following functions are available for testing:');
  console.log('- window.authTest.login(email, password, tenant)');
  console.log('- window.authTest.register(firstName, lastName, email, password, companyName, tenant)');
  console.log('- window.authTest.logout()');
  console.log('- window.authTest.verifyToken()');
  console.log('- window.authTest.checkAuthState()');
  console.log('- window.authTest.runAllTests()');
  console.log('Example usage: window.authTest.login("demo@example.com", "Demo123!", "demo")');
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      initAuthConsoleTest();
    });
  }
} 