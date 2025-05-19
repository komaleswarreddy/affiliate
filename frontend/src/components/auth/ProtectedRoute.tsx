import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles = [],
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, role, refreshUser, user, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // If authentication is required and user is not authenticated but has a token,
      // try to refresh user data from the token.
      if (requireAuth && !isAuthenticated && token) {
        await refreshUser();
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [isAuthenticated, refreshUser, requireAuth, token]); // Depend on isAuthenticated and token

  if (isLoading) {
    // Only show loading if authentication is required and we are not authenticated yet.
    // Otherwise, render immediately (e.g., public routes).
    if (requireAuth && !isAuthenticated) {
       return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }
  }

  // Not authenticated, redirect to login if auth is required
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Already authenticated but accessing login/signup pages (if auth is not required)
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check role-based access if roles are specified and auth is required
  if (
    requireAuth &&
    isAuthenticated &&
    allowedRoles.length > 0 &&
    role &&
    !allowedRoles.includes(role)
  ) {
    // User doesn't have the required role
    return <Navigate to="/unauthorized" replace />;
  }

  // All checks passed, render the protected component or public component
  return <>{children}</>;
} 