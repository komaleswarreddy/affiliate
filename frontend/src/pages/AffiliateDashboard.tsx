import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface AffiliateDetails {
  id: string;
  status: string;
  total_earnings: number;
  commission_tiers: {
    name: string;
    commission_rate: number;
  };
  users: {
    email: string;
  };
}

type SupabaseAffiliateResponse = {
  id: string;
  status: string;
  total_earnings: number;
  commission_tiers: {
    name: string;
    commission_rate: number;
  };
  users: {
    email: string;
  };
};

export const AffiliateDashboard: React.FC = () => {
  const { user, tenant } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [affiliateDetails, setAffiliateDetails] = useState<AffiliateDetails | null>(null);

  useEffect(() => {
    const fetchAffiliateDetails = async () => {
      if (!user || !tenant) return;

      try {
        const { data, error } = await supabase
          .from('affiliates')
          .select(`
            id,
            status,
            total_earnings,
            commission_tiers:commission_tier_id (
              name,
              commission_rate
            ),
            users:user_id (
              email
            )
          `)
          .eq('user_id', user.id)
          .eq('tenant_id', tenant.id)
          .single();

        if (error) throw error;
        
        // Type assertion to ensure data matches our expected structure
        const typedData = data as unknown as SupabaseAffiliateResponse;
        setAffiliateDetails(typedData);
      } catch (err) {
        console.error('Error fetching affiliate details:', err);
        setError('Failed to load affiliate details');
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliateDetails();
  }, [user, tenant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to your affiliate dashboard</p>
        </div>

        {affiliateDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h2>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  affiliateDetails.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {affiliateDetails.status}
                </span>
              </div>
            </div>

            {/* Earnings Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Total Earnings</h2>
              <p className="text-3xl font-bold text-gray-900">
                ${affiliateDetails.total_earnings.toFixed(2)}
              </p>
            </div>

            {/* Commission Tier Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Tier</h2>
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">
                  {affiliateDetails.commission_tiers.name}
                </p>
                <p className="text-gray-600">
                  {affiliateDetails.commission_tiers.commission_rate}% commission rate
                </p>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {affiliateDetails.users.email}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Affiliate ID:</span> {affiliateDetails.id}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 