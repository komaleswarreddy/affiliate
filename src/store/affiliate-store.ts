import { create } from 'zustand';
import { Affiliate, TrackingLink, CommissionTier, Sale, CommissionDistribution } from '@/types';
import { affiliates } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

// Demo data
const demoAffiliate: Affiliate = {
  id: 'demo-affiliate-id',
  tenantId: 'demo-tenant-id',
  userId: 'demo-user-id',
  referralCode: 'DEMO2025',
  currentTierId: 'demo-tier-id',
  parentAffiliateId: null,
  companyName: 'Demo Marketing LLC',
  websiteUrl: 'https://demo-marketing.example.com',
  socialMedia: {
    facebook: 'https://facebook.com/demo-marketing',
    twitter: 'https://twitter.com/demo-marketing',
    linkedin: 'https://linkedin.com/company/demo-marketing'
  },
  taxId: null,
  taxFormType: null,
  paymentThreshold: 50,
  preferredCurrency: 'USD',
  promotionalMethods: ['social_media', 'blog', 'email'],
  status: 'active',
  approvedBy: 'system',
  approvedAt: new Date(),
  user: {
    id: 'demo-user-id',
    tenantId: 'demo-tenant-id',
    email: 'demo@example.com',
    firstName: 'Demo',
    lastName: 'User',
    phone: null,
    countryCode: 'US',
    timezone: 'America/New_York',
    language: 'en',
    referralCode: null,
    termsAccepted: true,
    marketingConsent: false,
    createdAt: new Date(),
    isAffiliate: true,
    role: {
      id: 'demo-role-id',
      tenantId: 'demo-tenant-id',
      name: 'Affiliate',
      description: 'Standard affiliate access',
      permissions: ['tracking_links:manage', 'sales:view'],
      isCustom: false,
      createdBy: 'system',
      createdAt: new Date()
    }
  }
};

const demoTrackingLinks: TrackingLink[] = [
  {
    id: 'demo-link-1',
    tenantId: 'demo-tenant-id',
    affiliateId: 'demo-affiliate-id',
    destinationUrl: 'https://example.com/product-a',
    campaignName: 'Summer Sale',
    utmSource: 'DEMO2025',
    utmMedium: 'email',
    utmCampaign: 'summer2025',
    utmContent: 'banner',
    utmTerm: null,
    shortCode: 'sum25',
    qrCodeUrl: '',
    status: 'active',
    expiresAt: null,
    clickCount: 156,
    conversionCount: 23,
    createdAt: new Date()
  },
  {
    id: 'demo-link-2',
    tenantId: 'demo-tenant-id',
    affiliateId: 'demo-affiliate-id',
    destinationUrl: 'https://example.com/product-b',
    campaignName: 'Black Friday',
    utmSource: 'DEMO2025',
    utmMedium: 'social',
    utmCampaign: 'bf2025',
    utmContent: 'instagram',
    utmTerm: 'deals',
    shortCode: 'bf25',
    qrCodeUrl: '',
    status: 'active',
    expiresAt: new Date(2025, 11, 30),
    clickCount: 243,
    conversionCount: 18,
    createdAt: new Date()
  }
];

type AffiliateState = {
  currentAffiliate: Affiliate | null;
  trackingLinks: TrackingLink[];
  commissionTiers: CommissionTier[];
  sales: Sale[];
  distributions: CommissionDistribution[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAffiliate: (userId: string, tenantId: string) => Promise<void>;
  createAffiliate: (data: Record<string, any>) => Promise<void>;
  updateAffiliate: (id: string, data: Record<string, any>) => Promise<void>;
  createTrackingLink: (data: Record<string, any>) => Promise<void>;
  updateTrackingLink: (id: string, data: Record<string, any>) => Promise<void>;
  deleteTrackingLink: (id: string) => Promise<void>;
  loadTrackingLinks: (affiliateId: string, tenantId: string) => Promise<void>;
  loadCommissionTiers: (tenantId: string) => Promise<void>;
  loadSales: (affiliateId: string, tenantId: string) => Promise<void>;
  loadDistributions: (affiliateId: string, tenantId: string) => Promise<void>;
  clearError: () => void;
};

export const useAffiliateStore = create<AffiliateState>((set, get) => ({
  currentAffiliate: null,
  trackingLinks: [],
  commissionTiers: [],
  sales: [],
  distributions: [],
  isLoading: false,
  error: null,

  loadAffiliate: async (userId, tenantId) => {
    set({ isLoading: true, error: null });
    try {
      // Demo user check
      if (userId === 'demo-user-id' && tenantId === 'demo-tenant-id') {
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ currentAffiliate: demoAffiliate, isLoading: false });
        return;
      }

      const affiliate = await affiliates.getByUserId(userId, tenantId);
      set({ currentAffiliate: affiliate, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred loading affiliate",
        isLoading: false
      });
    }
  },

  createAffiliate: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const affiliate = await affiliates.create(data);
      set({ currentAffiliate: affiliate, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred creating affiliate",
        isLoading: false
      });
    }
  },

  updateAffiliate: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = get().currentAffiliate?.tenantId;
      if (!tenantId) throw new Error("No tenant ID available");
      
      const affiliate = await affiliates.update(id, tenantId, data);
      set({ currentAffiliate: affiliate, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred updating affiliate",
        isLoading: false
      });
    }
  },

  createTrackingLink: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Demo user check
      if (data.tenant_id === 'demo-tenant-id') {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newLink = {
          id: `demo-link-${Date.now()}`,
          tenantId: data.tenant_id,
          affiliateId: data.affiliate_id,
          destinationUrl: data.destination_url,
          campaignName: data.campaign_name,
          utmSource: data.utm_source,
          utmMedium: data.utm_medium,
          utmCampaign: data.utm_campaign,
          utmContent: data.utm_content,
          utmTerm: data.utm_term,
          shortCode: Math.random().toString(36).substring(2, 8),
          qrCodeUrl: '',
          status: 'active',
          expiresAt: data.expires_at,
          clickCount: 0,
          conversionCount: 0,
          createdAt: new Date()
        };
        set({
          trackingLinks: [...get().trackingLinks, newLink],
          isLoading: false
        });
        return;
      }

      const { data: link, error } = await supabase
        .from('tracking_links')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      
      set({
        trackingLinks: [...get().trackingLinks, link],
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred creating tracking link",
        isLoading: false
      });
    }
  },

  updateTrackingLink: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      // Demo user check
      if (id.startsWith('demo-link')) {
        await new Promise(resolve => setTimeout(resolve, 500));
        set({
          trackingLinks: get().trackingLinks.map(l => l.id === id ? { ...l, ...data } : l),
          isLoading: false
        });
        return;
      }

      const { data: link, error } = await supabase
        .from('tracking_links')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      set({
        trackingLinks: get().trackingLinks.map(l => l.id === id ? link : l),
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred updating tracking link",
        isLoading: false
      });
    }
  },

  deleteTrackingLink: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Demo user check
      if (id.startsWith('demo-link')) {
        await new Promise(resolve => setTimeout(resolve, 500));
        set({
          trackingLinks: get().trackingLinks.filter(l => l.id !== id),
          isLoading: false
        });
        return;
      }

      const { error } = await supabase
        .from('tracking_links')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set({
        trackingLinks: get().trackingLinks.filter(l => l.id !== id),
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred deleting tracking link",
        isLoading: false
      });
    }
  },

  loadTrackingLinks: async (affiliateId, tenantId) => {
    set({ isLoading: true, error: null });
    try {
      // Demo user check
      if (affiliateId === 'demo-affiliate-id' && tenantId === 'demo-tenant-id') {
        await new Promise(resolve => setTimeout(resolve, 500));
        set({
          trackingLinks: demoTrackingLinks,
          isLoading: false
        });
        return;
      }

      const { data, error } = await supabase
        .from('tracking_links')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      set({
        trackingLinks: data || [],
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred loading tracking links",
        isLoading: false
      });
    }
  },

  loadCommissionTiers: async (tenantId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'active');
      
      if (error) throw error;
      
      set({
        commissionTiers: data || [],
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred loading commission tiers",
        isLoading: false
      });
    }
  },

  loadSales: async (affiliateId, tenantId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({
        sales: data || [],
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred loading sales",
        isLoading: false
      });
    }
  },

  loadDistributions: async (affiliateId, tenantId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('commission_distributions')
        .select('*')
        .eq('beneficiary_id', affiliateId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({
        distributions: data || [],
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred loading distributions",
        isLoading: false
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));