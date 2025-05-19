/**
 * Common type definitions for the application
 */

// Tenant interface
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domain: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  subscriptionTier: string;
  maxUsers: number;
  maxAffiliates: number;
  status: 'trial' | 'active' | 'suspended' | 'expired';
  createdAt: Date;
  expiresAt: Date | null;
  settings: Record<string, any>;
}

// Role interface
export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  permissions: string[];
  isCustom: boolean;
  createdBy: string;
  createdAt: Date;
}

// User interface
export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  countryCode: string;
  timezone: string;
  language: string;
  referralCode: string | null;
  termsAccepted: boolean;
  marketingConsent: boolean;
  createdAt: Date;
  isAffiliate: boolean;
  role: Role;
}

// Permission type
export type Permission = string;

// Existing types...

// Campaign Management
export type Campaign = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  type: 'product' | 'service' | 'event';
  requirements: {
    minFollowers?: number;
    platforms?: string[];
    categories?: string[];
  };
  rewards: {
    commissionRate: number;
    bonusThreshold?: number;
    bonusAmount?: number;
  };
  content: {
    images: string[];
    videos: string[];
    description: string;
    guidelines: string;
    promotionalCodes: string[];
  };
  metrics: {
    totalReach: number;
    engagementRate: number;
    conversions: number;
    revenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type CampaignParticipation = {
  id: string;
  campaignId: string;
  affiliateId: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  metrics: {
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  promotionalLinks: string[];
  promotionalCodes: string[];
  joinedAt: Date;
  completedAt: Date | null;
};

// Add to existing types...