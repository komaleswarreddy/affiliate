import { create } from 'zustand';
import { trackingLinkService } from '@/lib/api/tracking';
import { TrackingLink } from '@/types/tracking';
import useAuthStore from './auth-store';

interface TrackingLinkFilter {
  affiliateId?: string;
  status?: 'active' | 'inactive' | 'expired';
  search?: string;
}

interface TrackingLinkState {
  links: TrackingLink[];
  currentLink: TrackingLink | null;
  isLoading: boolean;
  error: string | null;
  filter: TrackingLinkFilter;
  
  // Actions
  fetchLinks: () => Promise<void>;
  fetchLinksByAffiliate: (affiliateId: string) => Promise<void>;
  fetchLinkById: (id: string) => Promise<void>;
  createLink: (data: Partial<TrackingLink>) => Promise<TrackingLink>;
  updateLink: (id: string, data: Partial<TrackingLink>) => Promise<TrackingLink>;
  deleteLink: (id: string) => Promise<void>;
  setFilter: (filter: Partial<TrackingLinkFilter>) => void;
  clearError: () => void;
}

export const useTrackingLinkStore = create<TrackingLinkState>((set, get) => ({
  links: [],
  currentLink: null,
  isLoading: false,
  error: null,
  filter: {},
  
  fetchLinks: async () => {
    const { tenant } = useAuthStore.getState();
    if (!tenant) {
      set({ error: 'No active tenant. Please log in again.' });
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const links = await trackingLinkService.getAll(tenant.id);
      
      // Apply any filters
      const filteredLinks = applyFilters(links, get().filter);
      
      set({ links: filteredLinks, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tracking links',
        isLoading: false
      });
    }
  },
  
  fetchLinksByAffiliate: async (affiliateId: string) => {
    const { tenant } = useAuthStore.getState();
    if (!tenant) {
      set({ error: 'No active tenant. Please log in again.' });
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const links = await trackingLinkService.getByAffiliate(tenant.id, affiliateId);
      
      // Apply any other filters
      const filter = { ...get().filter, affiliateId };
      const filteredLinks = applyFilters(links, filter);
      
      set({ links: filteredLinks, isLoading: false, filter });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch affiliate tracking links',
        isLoading: false
      });
    }
  },
  
  fetchLinkById: async (id: string) => {
    const { tenant } = useAuthStore.getState();
    if (!tenant) {
      set({ error: 'No active tenant. Please log in again.' });
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const link = await trackingLinkService.getById(id, tenant.id);
      set({ currentLink: link, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tracking link',
        isLoading: false
      });
    }
  },
  
  createLink: async (data: Partial<TrackingLink>) => {
    const { tenant } = useAuthStore.getState();
    if (!tenant) {
      throw new Error('No active tenant. Please log in again.');
    }
    
    set({ isLoading: true, error: null });
    try {
      // Add tenant ID to data
      const linkData = {
        ...data,
        tenantId: tenant.id,
        createdAt: new Date().toISOString(),
        clickCount: 0,
        conversionCount: 0
      };
      
      const newLink = await trackingLinkService.create(linkData);
      
      // Update the links array with the new link
      set(state => ({ 
        links: [newLink, ...state.links],
        currentLink: newLink,
        isLoading: false
      }));
      
      return newLink;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create tracking link',
        isLoading: false
      });
      throw error;
    }
  },
  
  updateLink: async (id: string, data: Partial<TrackingLink>) => {
    const { tenant } = useAuthStore.getState();
    if (!tenant) {
      throw new Error('No active tenant. Please log in again.');
    }
    
    set({ isLoading: true, error: null });
    try {
      const updatedLink = await trackingLinkService.update(id, tenant.id, data);
      
      // Update the links array with the updated link
      set(state => ({ 
        links: state.links.map(link => link.id === id ? updatedLink : link),
        currentLink: state.currentLink?.id === id ? updatedLink : state.currentLink,
        isLoading: false
      }));
      
      return updatedLink;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update tracking link',
        isLoading: false
      });
      throw error;
    }
  },
  
  deleteLink: async (id: string) => {
    const { tenant } = useAuthStore.getState();
    if (!tenant) {
      throw new Error('No active tenant. Please log in again.');
    }
    
    set({ isLoading: true, error: null });
    try {
      await trackingLinkService.delete(id, tenant.id);
      
      // Remove the deleted link from the links array
      set(state => ({ 
        links: state.links.filter(link => link.id !== id),
        currentLink: state.currentLink?.id === id ? null : state.currentLink,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete tracking link',
        isLoading: false
      });
      throw error;
    }
  },
  
  setFilter: (filter: Partial<TrackingLinkFilter>) => {
    // Update filter and re-apply to current links
    const newFilter = { ...get().filter, ...filter };
    const filteredLinks = applyFilters(get().links, newFilter);
    set({ filter: newFilter, links: filteredLinks });
  },
  
  clearError: () => set({ error: null })
}));

// Helper function to apply filters to links
function applyFilters(links: TrackingLink[], filter: TrackingLinkFilter): TrackingLink[] {
  return links.filter(link => {
    // Filter by affiliate ID
    if (filter.affiliateId && link.affiliateId !== filter.affiliateId) {
      return false;
    }
    
    // Filter by status
    if (filter.status && link.status !== filter.status) {
      return false;
    }
    
    // Filter by search text
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        link.destinationUrl.toLowerCase().includes(searchLower) ||
        link.campaignName.toLowerCase().includes(searchLower) ||
        link.shortCode.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
} 