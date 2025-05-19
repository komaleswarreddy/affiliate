import { Database } from "@/lib/database.types";

// Type for tracking link rows from Supabase
export type TrackingLinkRow = Database['public']['Tables']['tracking_links']['Row'];

// Type for inserting tracking links to Supabase
export type TrackingLinkInsert = Database['public']['Tables']['tracking_links']['Insert'];

// Type for updating tracking links in Supabase
export type TrackingLinkUpdate = Database['public']['Tables']['tracking_links']['Update'];

// Main TrackingLink type used throughout the application
export interface TrackingLink {
  id: string;
  tenantId: string;
  affiliateId: string;
  destinationUrl: string;
  campaignName: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  shortCode: string;
  qrCodeUrl: string | null;
  status: 'active' | 'inactive' | 'expired';
  expiresAt: string | null;
  clickCount: number;
  conversionCount: number;
  createdAt: string;
}

// Conversion from database row to application model
export const toTrackingLink = (row: TrackingLinkRow): TrackingLink => ({
  id: row.id,
  tenantId: row.tenant_id,
  affiliateId: row.affiliate_id,
  destinationUrl: row.destination_url,
  campaignName: row.campaign_name,
  utmSource: row.utm_source,
  utmMedium: row.utm_medium,
  utmCampaign: row.utm_campaign,
  utmContent: row.utm_content,
  utmTerm: row.utm_term,
  shortCode: row.short_code,
  qrCodeUrl: row.qr_code_url,
  status: row.status as 'active' | 'inactive' | 'expired',
  expiresAt: row.expires_at,
  clickCount: row.click_count,
  conversionCount: row.conversion_count,
  createdAt: row.created_at,
});

// Conversion from application model to database insert
export const fromTrackingLink = (link: Partial<TrackingLink>): TrackingLinkInsert => ({
  id: link.id,
  tenant_id: link.tenantId!,
  affiliate_id: link.affiliateId!,
  destination_url: link.destinationUrl!,
  campaign_name: link.campaignName!,
  utm_source: link.utmSource!,
  utm_medium: link.utmMedium!,
  utm_campaign: link.utmCampaign,
  utm_content: link.utmContent,
  utm_term: link.utmTerm,
  short_code: link.shortCode!,
  qr_code_url: link.qrCodeUrl,
  status: link.status,
  expires_at: link.expiresAt,
  click_count: link.clickCount,
  conversion_count: link.conversionCount,
  created_at: link.createdAt,
}); 