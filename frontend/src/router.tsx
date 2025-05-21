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
import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import type { Invite, Affiliate } from './types';

// Extend Invite type for joined product info
interface PendingInvite extends Invite {
  products?: {
    name: string;
    price: number;
    product_commission: number;
  };
}

interface TierWithAffiliates {
  id: string;
  name: string;
  commission_rate: number;
  description?: string;
  affiliates: (Affiliate & { users?: { email: string } })[];
}

// Placeholder for unauthorized page
const UnauthorizedPage = () => <div>You don't have permission to access this page</div>;

// Placeholder pages for sidebar navigation
const PendingApprovalsPage = () => {
  const { token } = useAuthStore();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvites() {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/affiliates/pending-invites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setInvites(data.invites || []);
      setLoading(false);
    }
    fetchInvites();
  }, [token]);

  if (loading) return <div>Loading pending invites...</div>;
  if (!invites.length) return <div>No pending invites.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pending Approvals</h1>
      <div className="space-y-4">
        {invites.map(invite => (
          <div key={invite.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold">{invite.email}</div>
              <div className="text-gray-600 text-sm">Product: {invite.products?.name}</div>
              <div className="text-gray-600 text-sm">Invited: {new Date(invite.created_at).toLocaleString()}</div>
            </div>
            <div className="mt-2 md:mt-0">
              <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">Pending</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AffiliateTiersPage = () => {
  const { token } = useAuthStore();
  const [tiers, setTiers] = useState<TierWithAffiliates[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTiers() {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/affiliates/tiers-with-affiliates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTiers(data.tiers || []);
      setLoading(false);
    }
    fetchTiers();
  }, [token]);

  if (loading) return <div>Loading tiers...</div>;
  if (!tiers.length) return <div>No commission tiers found.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Affiliate Tiers</h1>
      <div className="space-y-8">
        {tiers.map(tier => (
          <div key={tier.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold text-lg">{tier.name}</div>
                <div className="text-gray-600 text-sm">Commission Rate: {tier.commission_rate}%</div>
                {tier.description && <div className="text-gray-500 text-xs">{tier.description}</div>}
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                {tier.affiliates.length} affiliate{tier.affiliates.length !== 1 ? 's' : ''}
              </span>
            </div>
            {tier.affiliates.length === 0 ? (
              <div className="text-gray-500 italic">No affiliates in this tier.</div>
            ) : (
              <ul className="divide-y divide-gray-200 mt-2">
                {tier.affiliates.map(affiliate => (
                  <li key={affiliate.id} className="py-2 flex justify-between items-center">
                    <span>{affiliate.users?.email}</span>
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">{affiliate.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

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