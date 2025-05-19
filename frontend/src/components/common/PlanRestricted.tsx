import type { ReactNode } from 'react';
import { usePlanRestriction } from '../../hooks/usePlanRestriction';

type PlanFeature = 'maxAffiliates' | 'maxUsers' | 'maxTiers' | 'maxProducts' | 'invoicing';

interface PlanRestrictedProps {
  /** The feature to check for availability */
  feature: PlanFeature;
  /** Optional current count for numeric limits */
  currentCount?: number;
  /** Content to show when the feature is available */
  children: ReactNode;
  /** Content to show when the feature is not available (optional) */
  fallback?: ReactNode;
  /** Whether to check if a numeric limit has been reached */
  checkLimit?: boolean;
  /** Admin only restriction */
  adminOnly?: boolean;
}

/**
 * Component that conditionally renders content based on the current plan's restrictions.
 * 
 * Usage:
 * ```jsx
 * <PlanRestricted feature="invoicing" adminOnly>
 *   <InvoiceButton />
 * </PlanRestricted>
 * ```
 * 
 * With count limit:
 * ```jsx
 * <PlanRestricted feature="maxAffiliates" currentCount={affiliatesCount} checkLimit>
 *   <AddAffiliateButton />
 * </PlanRestricted>
 * ```
 */
export function PlanRestricted({
  feature,
  currentCount = 0,
  children,
  fallback,
  checkLimit = false,
  adminOnly = false,
}: PlanRestrictedProps) {
  const { isFeatureAvailable, hasReachedLimit, isAdmin } = usePlanRestriction();

  // Check if admin-only restriction applies
  if (adminOnly && !isAdmin) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check if the feature is available in the current plan
  const featureAvailable = isFeatureAvailable(feature);
  if (!featureAvailable) {
    return fallback ? <>{fallback}</> : null;
  }

  // If we need to check numeric limits
  if (checkLimit && feature !== 'invoicing') {
    const limitReached = hasReachedLimit(feature, currentCount);
    if (limitReached) {
      return fallback ? <>{fallback}</> : null;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Component that shows a plan upgrade prompt
 */
export function PlanUpgradePrompt({ feature }: { feature: PlanFeature }) {
  const { currentPlan } = usePlanRestriction();

  const featureLabels: Record<PlanFeature, string> = {
    maxAffiliates: 'affiliates',
    maxUsers: 'users',
    maxTiers: 'commission tiers',
    maxProducts: 'products',
    invoicing: 'invoicing feature',
  };

  return (
    <div className="p-4 border border-amber-200 bg-amber-50 rounded-md text-amber-800">
      <h3 className="text-sm font-medium">Plan Limit Reached</h3>
      <p className="text-xs mt-1">
        You've reached the limit for {featureLabels[feature]} on your {currentPlan} plan.
        <a href="/billing" className="ml-1 text-indigo-600 hover:text-indigo-500 font-medium">
          Upgrade now
        </a>
      </p>
    </div>
  );
}

/**
 * Component that shows an admin-only feature restriction
 */
export function AdminOnlyPrompt() {
  return (
    <div className="p-4 border border-gray-200 bg-gray-50 rounded-md text-gray-800">
      <h3 className="text-sm font-medium">Admin Only Feature</h3>
      <p className="text-xs mt-1">
        This feature is only available to administrators.
      </p>
    </div>
  );
} 