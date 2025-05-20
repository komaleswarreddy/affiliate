import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SignupForm } from './components/auth/SignupForm';
import { LoginForm } from './components/auth/LoginForm';
import { Dashboard } from './pages/Dashboard';
import { ProductsPage } from './pages/ProductsPage';
import { AffiliatesPage } from './pages/AffiliatesPage';
import AppLayout from './components/layout/AppLayout';
import { AffiliateDashboard } from './pages/AffiliateDashboard';
import { AcceptInvitePage } from './pages/AcceptInvitePage';

// Placeholder for unauthorized page
const UnauthorizedPage = () => <div>You don't have permission to access this page</div>;

// Placeholder pages for sidebar navigation
const PendingApprovalsPage = () => <div>Pending Approvals Page</div>;
const AffiliateTiersPage = () => <div>Affiliate Tiers Page</div>;
const CommissionTiersPage = () => <div>Commission Tiers Page</div>;
const ProductCommissionsPage = () => <div>Product Commissions Page</div>;
const CommissionRulesPage = () => <div>Commission Rules Page</div>;

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/login',
    element: (
      <ProtectedRoute requireAuth={false}>
        <LoginForm />
      </ProtectedRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <ProtectedRoute requireAuth={false}>
        <SignupForm />
      </ProtectedRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },

  // Protected Routes wrapped in AppLayout
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/products',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ProductsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/affiliates/all',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <AffiliatesPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/affiliates/pending',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <PendingApprovalsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/affiliates/tiers',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <AffiliateTiersPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/commissions/tiers',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <CommissionTiersPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/commissions/products',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ProductCommissionsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/commissions/rules',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <CommissionRulesPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/affiliate-dashboard',
    element: <AffiliateDashboard />,
  },

  // Redirect root to login
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  
  // Fallback for undefined routes
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },

  {
    path: '/accept-invite/:inviteId',
    element: <AcceptInvitePage />,
  },
]); 