import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SignupForm } from './components/auth/SignupForm';
import { LoginForm } from './components/auth/LoginForm';
import { Dashboard } from './pages/Dashboard';
import AppLayout from './components/layout/AppLayout';
import './index.css';

// Placeholder for unauthorized page
const UnauthorizedPage = () => <div>You don't have permission to access this page</div>;

// Placeholder pages for sidebar navigation
const AllAffiliatesPage = () => <div>All Affiliates Page</div>;
const PendingApprovalsPage = () => <div>Pending Approvals Page</div>;
const AffiliateTiersPage = () => <div>Affiliate Tiers Page</div>;
const CommissionTiersPage = () => <div>Commission Tiers Page</div>;
const ProductCommissionsPage = () => <div>Product Commissions Page</div>;
const CommissionRulesPage = () => <div>Commission Rules Page</div>;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <ProtectedRoute requireAuth={false}>
              <LoginForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <ProtectedRoute requireAuth={false}>
              <SignupForm />
            </ProtectedRoute>
          } 
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes wrapped in AppLayout */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/affiliates/all" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <AllAffiliatesPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/affiliates/pending" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <PendingApprovalsPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/affiliates/tiers" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <AffiliateTiersPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/commissions/tiers" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <CommissionTiersPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/commissions/products" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProductCommissionsPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/commissions/rules" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <CommissionRulesPage />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Fallback for undefined routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
