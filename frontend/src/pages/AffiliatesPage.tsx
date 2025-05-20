import React from 'react';
import { AffiliateList } from '../components/AffiliateList';
import { useAuthStore } from '../store/authStore';

export function AffiliatesPage() {
  const { tenant } = useAuthStore();

  if (!tenant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Affiliates</h1>
      <AffiliateList tenantId={tenant.id} />
    </div>
  );
} 