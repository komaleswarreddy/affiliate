/**
 * Subscription Plan Configuration
 * 
 * This file defines the limits and feature access for different subscription tiers 
 * of the Affiliate Management Platform.
 */

export interface PlanLimits {
  maxAffiliates: number;
  maxUsers: number;
  maxTiers: number;
  maxProducts: number;
  allowInvoicing: boolean;
  maxFileStorage: number; // in MB
  customDomain: boolean;
  apiAccess: boolean;
  multiLevelCommissions: boolean;
  advancedAnalytics: boolean;
  whiteLabeling: boolean;
  prioritySupport: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  limits: PlanLimits;
  monthlyPrice: number;
  yearlyPrice: number;
  isPopular?: boolean;
  features: string[];
}

// Free trial plan
export const TRIAL_PLAN: PlanLimits = {
  maxAffiliates: 10,
  maxUsers: 2,
  maxTiers: 2,
  maxProducts: 5,
  allowInvoicing: false,
  maxFileStorage: 100,
  customDomain: false,
  apiAccess: false,
  multiLevelCommissions: false,
  advancedAnalytics: false,
  whiteLabeling: false,
  prioritySupport: false,
};

// Paid subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Essential tools for small affiliate programs',
    limits: {
      maxAffiliates: 25,
      maxUsers: 5,
      maxTiers: 3,
      maxProducts: 20,
      allowInvoicing: true,
      maxFileStorage: 500,
      customDomain: false,
      apiAccess: false,
      multiLevelCommissions: false,
      advancedAnalytics: false,
      whiteLabeling: false,
      prioritySupport: false,
    },
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      'Up to 25 affiliates',
      'Basic commission tracking',
      'Standard reporting',
      'Single-level commissions',
      'Email notifications',
      'Branded affiliate portal',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced features for growing businesses',
    limits: {
      maxAffiliates: 100,
      maxUsers: 10,
      maxTiers: 5,
      maxProducts: 100,
      allowInvoicing: true,
      maxFileStorage: 2000,
      customDomain: true,
      apiAccess: true,
      multiLevelCommissions: true,
      advancedAnalytics: true,
      whiteLabeling: false,
      prioritySupport: false,
    },
    monthlyPrice: 99,
    yearlyPrice: 990,
    isPopular: true,
    features: [
      'Up to 100 affiliates',
      'Multi-level commissions',
      'Advanced reporting',
      'Custom commission tiers',
      'API access',
      'Custom domain',
      'Advanced analytics',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for large organizations',
    limits: {
      maxAffiliates: 500,
      maxUsers: 25,
      maxTiers: 10,
      maxProducts: 1000,
      allowInvoicing: true,
      maxFileStorage: 10000,
      customDomain: true,
      apiAccess: true,
      multiLevelCommissions: true,
      advancedAnalytics: true,
      whiteLabeling: true,
      prioritySupport: true,
    },
    monthlyPrice: 299,
    yearlyPrice: 2990,
    features: [
      'Unlimited affiliates',
      'White-labeling',
      'Priority support',
      'Custom integration',
      'Dedicated account manager',
      'Enhanced security',
      'Advanced fraud detection',
    ],
  },
];

// Helper function to get plan limits by subscription tier
export function getPlanLimits(subscriptionTier: string): PlanLimits {
  if (subscriptionTier === 'trial') {
    return TRIAL_PLAN;
  }

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscriptionTier);
  return plan?.limits || TRIAL_PLAN;
}

// Helper function to check if tenant is on a trial
export function isTrial(status: string): boolean {
  return status === 'trial';
}

// Helper function to check if a tenant has access to a feature
export function hasFeatureAccess(
  feature: keyof PlanLimits,
  subscriptionTier: string
): boolean {
  const limits = getPlanLimits(subscriptionTier);
  return Boolean(limits[feature]);
} 