import { supabase } from '@/lib/supabase';
import { TrackingLink, TrackingLinkInsert, toTrackingLink, fromTrackingLink } from '@/types/tracking';

/**
 * Service for managing tracking links in Supabase
 */
export const trackingLinkService = {
  /**
   * Get all tracking links for a tenant
   */
  getAll: async (tenantId: string): Promise<TrackingLink[]> => {
    const { data, error } = await supabase
      .from('tracking_links')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tracking links:', error);
      throw error;
    }

    return data.map(toTrackingLink);
  },

  /**
   * Get all tracking links for a specific affiliate
   */
  getByAffiliate: async (tenantId: string, affiliateId: string): Promise<TrackingLink[]> => {
    const { data, error } = await supabase
      .from('tracking_links')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching affiliate tracking links:', error);
      throw error;
    }

    return data.map(toTrackingLink);
  },

  /**
   * Get a tracking link by ID
   */
  getById: async (id: string, tenantId: string): Promise<TrackingLink | null> => {
    const { data, error } = await supabase
      .from('tracking_links')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned means tracking link not found
        return null;
      }
      console.error('Error fetching tracking link:', error);
      throw error;
    }

    return toTrackingLink(data);
  },

  /**
   * Get a tracking link by its short code
   */
  getByShortCode: async (shortCode: string): Promise<TrackingLink | null> => {
    const { data, error } = await supabase
      .from('tracking_links')
      .select('*')
      .eq('short_code', shortCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned means tracking link not found
        return null;
      }
      console.error('Error fetching tracking link by short code:', error);
      throw error;
    }

    return toTrackingLink(data);
  },

  /**
   * Create a new tracking link
   */
  create: async (link: Partial<TrackingLink>): Promise<TrackingLink> => {
    const insertData = fromTrackingLink(link);
    
    const { data, error } = await supabase
      .from('tracking_links')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating tracking link:', error);
      throw error;
    }

    return toTrackingLink(data);
  },

  /**
   * Update a tracking link
   */
  update: async (id: string, tenantId: string, changes: Partial<TrackingLink>): Promise<TrackingLink> => {
    // Convert from our app model to DB model
    const updateData = Object.entries(changes).reduce((acc, [key, value]) => {
      // Convert camelCase to snake_case for DB columns
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      acc[dbKey] = value;
      return acc;
    }, {} as Record<string, any>);
    
    const { data, error } = await supabase
      .from('tracking_links')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tracking link:', error);
      throw error;
    }

    return toTrackingLink(data);
  },

  /**
   * Delete a tracking link
   */
  delete: async (id: string, tenantId: string): Promise<void> => {
    const { error } = await supabase
      .from('tracking_links')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error deleting tracking link:', error);
      throw error;
    }
  },

  /**
   * Record a click on a tracking link
   */
  recordClick: async (id: string): Promise<void> => {
    const { error } = await supabase.rpc('increment_tracking_link_clicks', {
      link_id: id
    });

    if (error) {
      console.error('Error recording click:', error);
      throw error;
    }
  },

  /**
   * Record a conversion on a tracking link
   */
  recordConversion: async (id: string): Promise<void> => {
    const { error } = await supabase.rpc('increment_tracking_link_conversions', {
      link_id: id
    });

    if (error) {
      console.error('Error recording conversion:', error);
      throw error;
    }
  }
}; 