/**
 * Authentication Test Script
 * 
 * This script tests the end-to-end functionality of the authentication system.
 * It performs login, registration, and other auth-related operations to verify that
 * the system is working correctly.
 */

import authService from '../services/auth-service';
import { isDevelopment } from '../lib/utils';
import { LoginCredentials, RegisterUser } from '../services/auth-service';

// Test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123!';
const TEST_TENANT = 'test-tenant';
const TEST_FIRST_NAME = 'Test';
const TEST_LAST_NAME = 'User';
const TEST_COMPANY = 'Test Company';

/**
 * Test login functionality
 */
export async function testLogin(): Promise<boolean> {
  try {
    console.log('Testing login with:', TEST_EMAIL);
    const credentials: LoginCredentials = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      tenant: TEST_TENANT
    };
    const response = await authService.login(credentials);
    console.log('Login successful:', response.user);
    return true;
  } catch (error) {
    console.error('Login test failed:', error);
    return false;
  }
}

/**
 * Test registration functionality
 */
export async function testRegistration(): Promise<boolean> {
  try {
    const uniqueEmail = `${Date.now()}-${TEST_EMAIL}`;
    const uniqueTenant = `${Date.now()}-${TEST_TENANT}`;
    console.log('Testing registration with:', uniqueEmail);
    
    const userData: RegisterUser = {
      firstName: TEST_FIRST_NAME,
      lastName: TEST_LAST_NAME,
      email: uniqueEmail,
      password: TEST_PASSWORD,
      tenant: uniqueTenant,
      companyName: TEST_COMPANY,
      acceptTerms: true
    };
    
    const response = await authService.register(userData);
    console.log('Registration successful:', response.user);
    return true;
  } catch (error) {
    console.error('Registration test failed:', error);
    return false;
  }
}

/**
 * Test token verification
 */
export async function testTokenVerification(): Promise<boolean> {
  try {
    const token = authService.getToken();
    if (!token) {
      console.error('No token found for verification test');
      return false;
    }
    
    console.log('Testing token verification');
    const isValid = await authService.isTokenValid(token);
    console.log('Token verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Token verification test failed:', error);
    return false;
  }
}

/**
 * Test getting current user
 */
export async function testGetCurrentUser(): Promise<boolean> {
  try {
    console.log('Testing get current user');
    const user = await authService.getCurrentUser();
    console.log('Current user:', user);
    return !!user;
  } catch (error) {
    console.error('Get current user test failed:', error);
    return false;
  }
}

/**
 * Test logout functionality
 */
export async function testLogout(): Promise<boolean> {
  try {
    console.log('Testing logout');
    authService.logout();
    const token = authService.getToken();
    console.log('Logout successful, token is now:', token);
    return !token;
  } catch (error) {
    console.error('Logout test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('======= STARTING AUTHENTICATION TESTS =======');
  
  // First, ensure we're logged out
  authService.logout();
  
  // Test registration with unique values
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const uniqueTenant = `test-${Date.now()}`;
  
  try {
    console.log(`Testing registration with unique email ${uniqueEmail} and tenant ${uniqueTenant}`);
    
    const userData: RegisterUser = {
      firstName: TEST_FIRST_NAME,
      lastName: TEST_LAST_NAME,
      email: uniqueEmail,
      password: TEST_PASSWORD,
      tenant: uniqueTenant,
      companyName: TEST_COMPANY,
      acceptTerms: true
    };
    
    const regResponse = await authService.register(userData);
    console.log('Registration successful:', regResponse.user);
    
    // If registration passed, we should now be logged in, test token verification
    const verifyResult = await testTokenVerification();
    console.log('Token verification test result:', verifyResult ? 'PASSED' : 'FAILED');
    
    // Test getting current user
    const userResult = await testGetCurrentUser();
    console.log('Get current user test result:', userResult ? 'PASSED' : 'FAILED');
    
    // Test logout
    const logoutResult = await testLogout();
    console.log('Logout test result:', logoutResult ? 'PASSED' : 'FAILED');
  } catch (error) {
    console.error('Registration failed:', error);
  }
  
  // After logout, test login with demo account
  try {
    console.log('Testing login with demo account');
    
    const credentials: LoginCredentials = {
      email: 'demo@example.com',
      password: 'Demo123!',
      tenant: 'demo'
    };
    
    const loginResponse = await authService.login(credentials);
    console.log('Login successful:', loginResponse.user);
  } catch (error) {
    console.error('Login test failed:', error);
  }
  
  console.log('======= AUTHENTICATION TESTS COMPLETE =======');
}

// Auto-run tests in development mode
if (isDevelopment) {
  // Wait for DOM to be ready if in browser
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      console.log('Auth tests module loaded. Use runAllTests() to test authentication.');
      
      // Add a button to the page to run tests
      const button = document.createElement('button');
      button.textContent = 'Run Auth Tests';
      button.style.position = 'fixed';
      button.style.bottom = '20px';
      button.style.right = '20px';
      button.style.zIndex = '9999';
      button.style.padding = '10px';
      button.style.backgroundColor = '#007bff';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '5px';
      button.style.cursor = 'pointer';
      
      button.addEventListener('click', () => {
        runAllTests();
      });
      
      // Only add the button if we don't have the auth debugger
      if (!document.querySelector('[data-auth-debugger]')) {
        document.body.appendChild(button);
      }
    });
  }
} 