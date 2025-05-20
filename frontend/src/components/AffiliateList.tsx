import React, { useEffect, useState } from 'react';
import { useAffiliateStore } from '../store/affiliateStore';
import { ProductList } from './ProductList';
import type { Affiliate } from '../types';

interface AffiliateListProps {
  tenantId: string;
}

export const AffiliateList: React.FC<AffiliateListProps> = ({ tenantId }) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    affiliates,
    loading,
    error: storeError,
    fetchAffiliates,
    inviteAffiliate,
  } = useAffiliateStore();

  useEffect(() => {
    fetchAffiliates(tenantId);
  }, [tenantId, fetchAffiliates]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await inviteAffiliate({
        email: inviteEmail,
        tenantId,
        productId: selectedProductId,
      });
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setSelectedProductId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    }
  };

  if (loading) {
    return <div>Loading affiliates...</div>;
  }

  if (storeError) {
    return <div>Error: {storeError}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Affiliates</h2>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Invite Affiliate
        </button>
      </div>

      <div className="grid gap-4">
        {affiliates.map((affiliate: Affiliate) => (
          <div
            key={affiliate.id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{affiliate.users?.email}</h3>
                <p className="text-gray-600">
                  Commission Tier: {affiliate.commission_tiers?.name}
                </p>
                <p className="text-gray-600">
                  Total Earnings: ${affiliate.total_earnings.toFixed(2)}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  affiliate.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {affiliate.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Invite Affiliate</h3>
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Product</label>
                <ProductList
                  tenantId={tenantId}
                  onProductSelect={setSelectedProductId}
                  selectedProductId={selectedProductId}
                />
              </div>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 