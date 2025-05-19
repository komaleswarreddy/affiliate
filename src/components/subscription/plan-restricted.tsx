import React from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { PlanLimits } from '@/lib/config/plans';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LockIcon, PackageOpen } from 'lucide-react';

interface PlanRestrictedProps {
  /**
   * The feature key from PlanLimits that this component is checking
   */
  feature: keyof PlanLimits;
  
  /**
   * For numerical limits (maxAffiliates, maxTiers, etc), current count
   */
  currentCount?: number;
  
  /**
   * Custom message to display when the feature is restricted
   */
  message?: string;
  
  /**
   * Children to render when feature is available
   */
  children: React.ReactNode;
  
  /**
   * Fallback to render when feature is restricted
   */
  fallback?: React.ReactNode;
}

/**
 * Restricts access to features based on subscription plan limits
 */
export function PlanRestricted({
  feature,
  currentCount,
  message,
  children,
  fallback,
}: PlanRestrictedProps) {
  const { isOnTrial, canUseFeature, hasReachedLimit, planLimits, subscriptionTier } = useSubscription();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
  // Check if feature is available on current plan
  const hasFeatureAccess = canUseFeature(feature);
  
  // For countable features (affiliates, tiers, etc), check if limit is reached
  const limitReached = currentCount !== undefined && 
    hasFeatureAccess && 
    hasReachedLimit(feature as any, currentCount);
  
  // Feature is restricted if not available or limit reached
  const isRestricted = !hasFeatureAccess || limitReached;
  
  // Default restriction message
  const defaultMessage = limitReached
    ? `You've reached the maximum of ${planLimits[feature as keyof typeof planLimits]} ${feature.replace('max', '').toLowerCase()} for your ${isOnTrial ? 'trial' : subscriptionTier} plan.`
    : `This feature is not available on your ${isOnTrial ? 'trial' : subscriptionTier} plan.`;
  
  // Handler for the upgrade button
  const handleUpgradeClick = () => {
    setDialogOpen(false);
    // Redirect to pricing page
    window.location.href = '/settings/billing';
  };
  
  if (!isRestricted) {
    return <>{children}</>;
  }
  
  // If a fallback is provided, use it instead of the default restricted view
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default restricted view with upgrade dialog
  return (
    <>
      <div 
        onClick={() => setDialogOpen(true)}
        className="relative rounded-md border border-dashed p-6 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px]">
          <div className="text-center p-4">
            <LockIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              {message || defaultMessage} <span className="underline">Upgrade</span>
            </p>
          </div>
        </div>
        <div className="opacity-40 pointer-events-none">
          {children}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              {message || defaultMessage}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg mb-4">
              <PackageOpen className="h-12 w-12 text-primary mr-4" />
              <div>
                <h3 className="font-medium">Unlock More Features</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to a paid plan to access this feature and more.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgradeClick}>
              View Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 