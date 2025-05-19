import { useAuthStore } from '../store/authStore';

type PlanFeature = 'maxAffiliates' | 'maxUsers' | 'maxTiers' | 'maxProducts' | 'invoicing';

type PlanLimits = {
  [key: string]: {
    maxAffiliates: number;
    maxUsers: number;
    maxTiers: number;
    maxProducts: number;
    invoicing: boolean;
  };
};

// Define the plan limits
const PLAN_LIMITS: PlanLimits = {
  trial: {
    maxAffiliates: 10,
    maxUsers: 2,
    maxTiers: 2,
    maxProducts: 5,
    invoicing: false,
  },
  starter: {
    maxAffiliates: 100,
    maxUsers: 5,
    maxTiers: 5,
    maxProducts: 20,
    invoicing: true,
  },
  pro: {
    maxAffiliates: 1000,
    maxUsers: 20,
    maxTiers: 10,
    maxProducts: 100,
    invoicing: true,
  },
  enterprise: {
    maxAffiliates: Number.POSITIVE_INFINITY,
    maxUsers: 50,
    maxTiers: Number.POSITIVE_INFINITY,
    maxProducts: Number.POSITIVE_INFINITY,
    invoicing: true,
  },
};

/**
 * Custom hook to check if a feature is available in the current plan
 * and return the current plan limits.
 */
export function usePlanRestriction() {
  const { tenant, role } = useAuthStore();

  const currentPlan = tenant?.plan || 'trial';
  const isAdmin = role === 'admin';
  
  // Check if a feature is available based on the current plan
  const isFeatureAvailable = (feature: PlanFeature): boolean => {
    if (!tenant) return false;

    // Admin-only features
    if (feature === 'invoicing' && !isAdmin) {
      return false;
    }

    return !!PLAN_LIMITS[currentPlan][feature];
  };

  // Get the current plan's limit for a feature
  const getPlanLimit = (feature: PlanFeature): number | boolean => {
    return PLAN_LIMITS[currentPlan][feature];
  };

  // Check if a numeric feature has reached its limit
  const hasReachedLimit = (feature: Exclude<PlanFeature, 'invoicing'>, currentCount: number): boolean => {
    if (!tenant) return true;
    
    const limit = PLAN_LIMITS[currentPlan][feature];
    return currentCount >= limit;
  };

  // Calculate days remaining in trial
  const getDaysRemainingInTrial = (): number | null => {
    if (!tenant || currentPlan !== 'trial') return null;
    
    const trialEnd = new Date(tenant.trial_end);
    const today = new Date();
    
    const diffTime = trialEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  return {
    currentPlan,
    isFeatureAvailable,
    getPlanLimit,
    hasReachedLimit,
    getDaysRemainingInTrial,
    isAdmin,
  };
} 