import { useMemo } from 'react';
import useAuthStore from '@/store/auth-store';
import useTenantStore from '@/store/tenant-store';
import { getPlanLimits, hasFeatureAccess, isTrial, PlanLimits } from '@/lib/config/plans';

/**
 * Hook for subscription-based feature access control
 * 
 * This hook provides functions to check if the current tenant has access to specific features
 * based on their subscription plan, and retrieves plan limits.
 */
export function useSubscription() {
  const { user } = useAuthStore();
  const { tenant } = useTenantStore();

  // Get the current subscription tier and status
  const subscriptionTier = tenant?.subscriptionTier || 'trial';
  const status = tenant?.status || 'trial';
  
  // Check if the tenant is on a free trial
  const isOnTrial = isTrial(status);
  
  // Get limits for the current subscription plan
  const planLimits = useMemo(() => {
    return getPlanLimits(subscriptionTier);
  }, [subscriptionTier]);

  // Function to check feature access
  const canUseFeature = (feature: keyof PlanLimits): boolean => {
    return hasFeatureAccess(feature, subscriptionTier);
  };

  // Function to check if a specific limit has been reached
  const hasReachedLimit = (
    limitKey: keyof Pick<PlanLimits, 'maxAffiliates' | 'maxUsers' | 'maxTiers' | 'maxProducts' | 'maxFileStorage'>,
    currentCount: number
  ): boolean => {
    return currentCount >= planLimits[limitKey];
  };

  // Return subscription-related helpers
  return {
    isOnTrial,
    subscriptionTier,
    planLimits,
    canUseFeature,
    hasReachedLimit,
  };
} 