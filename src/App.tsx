import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import useTenantStore from '@/store/tenant-store';
import useAuthStore from '@/store/auth-store';
import AppShell from '@/components/layout/app-shell';
import Dashboard from '@/pages/dashboard';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import { ForgotPassword } from '@/pages/auth/forgot-password';
import { ResetPassword } from '@/pages/auth/reset-password';
import NotFound from '@/pages/not-found';
import { isDevelopment } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import Auth Debugger for development environments only
const AuthDebugger = isDevelopment 
  ? React.lazy(() => import('@/components/debug/auth-debugger'))
  : () => null;

// Import Development Tools for development environments only
const DevelopmentTools = isDevelopment
  ? React.lazy(() => import('@/components/DevelopmentTools'))
  : () => null;

// Placeholder component for pages that are not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page is under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading page component for suspense fallback
function LoadingPage() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Outlet />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadUserData, user, isLoading } = useAuthStore();
  const { tenant, loadTenant, isLoading: isTenantLoading } = useTenantStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Only run this effect once when the component mounts
    const init = async () => {
      try {
        // Check if user is authenticated
        await loadUserData();
        
        // Load tenant data if needed
        if (user?.tenantId && !tenant) {
          try {
            await loadTenant(user.tenantId);
          } catch (error) {
            console.error('Failed to load tenant:', error);
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    // Only initialize if we haven't already done so
    if (isInitializing) {
      init();
    }
  // Remove user and tenant from dependency array to prevent infinite loop
  }, [loadUserData, loadTenant, isInitializing]);

  // Show loading state while initializing or during authentication/tenant load
  if (isInitializing || isLoading) {
    return <LoadingPage />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

// Public routes that are only accessible when NOT authenticated
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // Show loading state during authentication check
  if (isLoading) {
    return <LoadingPage />;
  }
  
  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes - only accessible when not logged in */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <PublicOnlyRoute>
                <ForgotPassword />
              </PublicOnlyRoute>
            } 
          />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected routes - only accessible when logged in */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="affiliates" element={<PlaceholderPage title="Affiliates" />} />
          <Route path="affiliates/:id" element={<PlaceholderPage title="Affiliate Detail" />} />
          <Route path="commissions" element={<PlaceholderPage title="Commissions" />} />
          <Route path="products" element={<PlaceholderPage title="Products" />} />
          <Route path="users" element={<PlaceholderPage title="Users" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="settings/profile" element={<PlaceholderPage title="Profile Settings" />} />
          <Route path="settings/team" element={<PlaceholderPage title="Team Settings" />} />
          <Route path="settings/billing" element={<PlaceholderPage title="Billing Settings" />} />
          <Route path="settings/api" element={<PlaceholderPage title="API Settings" />} />
          <Route path="settings/integrations" element={<PlaceholderPage title="Integrations" />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast notifications */}
      <Toaster />

      {/* Auth Debugger - only shown in development */}
      {isDevelopment && (
        <React.Suspense fallback={null}>
          <AuthDebugger />
        </React.Suspense>
      )}

      {/* Development Tools - only shown in development */}
      {isDevelopment && (
        <React.Suspense fallback={null}>
          <DevelopmentTools />
        </React.Suspense>
      )}
    </BrowserRouter>
  );
}

export default App;