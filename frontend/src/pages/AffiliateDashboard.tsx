import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface AffiliateDetails {
  id: string;
  status: string;
  total_earnings: number;
  tracking_link: string;
  commission_tiers: {
    name: string;
    commission_rate: number;
  };
  users: {
    email: string;
  };
}

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  product_commission: number;
  image_url: string;
}

type SupabaseAffiliateResponse = {
  id: string;
  status: string;
  total_earnings: number;
  tracking_link: string;
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
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);

  useEffect(() => {
    const fetchAffiliateDetails = async () => {
      if (!user || !tenant) {
        console.log('Missing user or tenant:', { user, tenant });
        return;
      }

      try {
        console.log('Fetching affiliate details for:', {
          userId: user.id,
          tenantId: tenant.id,
          userEmail: user.email
        });

        // First check if user exists in public.users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, role, tenant_id')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          throw new Error('Failed to fetch user details');
        }

        console.log('Found user:', userData);

        // Then fetch affiliate details
        const { data, error } = await supabase
          .from('affiliates')
          .select(`
            id,
            status,
            total_earnings,
            tracking_link,
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

        if (error) {
          console.error('Error fetching affiliate:', error);
          if (error.code === 'PGRST116') {
            // If no affiliate record found, try to create one
            console.log('No affiliate record found, attempting to create one...');
            
            // Get bronze tier
            const { data: bronzeTier, error: tierError } = await supabase
              .from('commission_tiers')
              .select('id')
              .eq('name', 'Bronze')
              .single();

            if (tierError) {
              console.error('Error fetching bronze tier:', tierError);
              throw new Error('Failed to fetch commission tier');
            }

            // Create affiliate record
            const { data: newAffiliate, error: createError } = await supabase
              .from('affiliates')
              .insert({
                user_id: user.id,
                tenant_id: tenant.id,
                commission_tier_id: bronzeTier.id,
                status: 'active'
              })
              .select(`
                id,
                status,
                total_earnings,
                tracking_link,
                commission_tiers:commission_tier_id (
                  name,
                  commission_rate
                ),
                users:user_id (
                  email
                )
              `)
              .single();

            if (createError) {
              console.error('Error creating affiliate:', createError);
              throw new Error('Failed to create affiliate record');
            }

            console.log('Created new affiliate record:', newAffiliate);
            // Type assertion to ensure data matches our expected structure
            const typedData = newAffiliate as unknown as SupabaseAffiliateResponse;
            setAffiliateDetails(typedData);
          } else {
            throw error;
          }
        } else {
          console.log('Found affiliate:', data);
          // Type assertion to ensure data matches our expected structure
          const typedData = data as unknown as SupabaseAffiliateResponse;
          setAffiliateDetails(typedData);
        }

        // Fetch product details from the invite
        const { data: inviteData, error: inviteError } = await supabase
          .from('invites')
          .select('product_id')
          .eq('email', user.email)
          .eq('tenant_id', tenant.id)
          .eq('status', 'accepted')
          .maybeSingle();

        if (inviteError) {
          console.error('Error fetching invite:', inviteError);
          // Don't throw error here, just log it
        } else if (inviteData?.product_id) {
          console.log('Found invite:', inviteData);
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', inviteData.product_id)
            .maybeSingle();

          if (productError) {
            console.error('Error fetching product:', productError);
            // Don't throw error here, just log it
          } else if (productData) {
            console.log('Found product:', productData);
            setProductDetails(productData);
          }
        } else {
          console.log('No accepted invite found for this user');
        }
      } catch (err) {
        console.error('Error in fetchAffiliateDetails:', err);
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

            {/* Product Details Card */}
            {productDetails && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">{productDetails.name}</p>
                  <p className="text-gray-600">{productDetails.description}</p>
                  <p className="text-gray-600">
                    <span className="font-medium">Price:</span> ${productDetails.price}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Commission:</span> {productDetails.product_commission}%
                  </p>
                  {productDetails.image_url && (
                    <img 
                      src={productDetails.image_url} 
                      alt={productDetails.name}
                      className="w-full h-48 object-cover rounded-lg mt-2"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Tracking Link Card */}
            {affiliateDetails.tracking_link && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Tracking Link</h2>
                <div className="space-y-2">
                  <p className="text-gray-600 break-all">
                    <span className="font-medium">Link:</span>{' '}
                    <a 
                      href={affiliateDetails.tracking_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {affiliateDetails.tracking_link}
                    </a>
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(affiliateDetails.tracking_link);
                    }}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 