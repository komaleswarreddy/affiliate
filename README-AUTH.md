# Authentication System Documentation

## Overview

The Affiliate Management Platform implements a comprehensive authentication system that handles user login, registration, session management, and authorization. The system is designed to work across multiple tenants in a multi-tenant SaaS architecture.

## Core Components

### Auth Service (`src/services/auth-service.ts`)

The `authService` provides the core authentication functionality:

- **Login/Registration**: Handles user authentication and registration
- **Token Management**: Stores and retrieves JWT tokens
- **Session Validation**: Verifies token validity and session status
- **User Data**: Retrieves current user information

### Auth Store (`src/store/auth-store.ts`)

The auth store uses Zustand to manage the authentication state:

- **State Management**: Tracks authentication status, user data, and loading/error states
- **Persistence**: Persists authentication state between page refreshes
- **Auth Actions**: Provides methods for login, logout, registration, etc.

### Components

- **Login/Register Pages**: User-facing authentication screens
- **Auth Debugger**: Development tool for inspecting authentication state
- **Protected Routes**: Components that enforce authentication requirements

## Debugging Tools

### Auth Debugger Component

A visual debugger available in development mode that shows:
- Current authentication state
- User details
- Buttons for testing auth functionality

### Console Debugging Utilities

Access authentication debugging tools in the browser console:

```javascript
// Inspect the current auth state
window.__AUTH_DEBUG__.inspectAuthState();

// Check token validity
window.__AUTH_DEBUG__.checkToken();

// Force logout
window.__AUTH_DEBUG__.forceLogout();

// Reload user data
window.__AUTH_DEBUG__.reloadUserData();
```

### Auth Console Tests

Run authentication tests from the browser console:

```javascript
// Run all auth tests
window.authTest.runAllTests();

// Run individual tests
window.authTest.login();
window.authTest.register();
window.authTest.getCurrentUser();
window.authTest.logout();
window.authTest.verifyToken();
window.authTest.checkAuthState();
```

## Authentication Flow

1. **Login/Registration**:
   - User submits credentials
   - System validates input
   - Backend verifies credentials
   - JWT token is generated and stored
   - User data is loaded

2. **Session Management**:
   - Token is stored in localStorage
   - Token is included in API requests
   - Expiring tokens are handled

3. **Protected Routes**:
   - Routes check authentication state
   - Unauthenticated users are redirected to login
   - User permissions are checked for authorized actions

## Development Mode Helpers

In development mode, the system provides:

- **Mock Authentication**: Works without a running backend
- **Demo Users**: Pre-configured test accounts
- **Visual Debugger**: Shows auth state in the UI
- **Console Tools**: Functions for testing auth flows

## Test Credentials

Use these credentials for testing (development mode only):

- **Email**: demo@example.com
- **Password**: Demo123!
- **Tenant**: demo

## Common Issues and Troubleshooting

- **"Invalid credentials"**: Ensure you're using the correct username/password/tenant
- **Auth state persisting incorrectly**: Clear localStorage to reset
- **Token validation failures**: Check that the server is running and accessible
- **"Auth store not found"**: Make sure the app is fully loaded before using debug tools

## Authentication API

Backend authentication endpoints:

- `POST /auth/login`: Authenticate a user
- `POST /auth/register`: Register a new user
- `POST /auth/forgot-password`: Request password reset
- `POST /auth/reset-password`: Reset password with token
- `POST /auth/verify-token`: Verify token validity
- `GET /auth/me`: Get current user data 