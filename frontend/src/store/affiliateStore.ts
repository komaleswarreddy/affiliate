import { create } from 'zustand';
import { affiliateApi } from '../services/api';
import type { Affiliate, Invite } from '../types';

interface AffiliateState {
  affiliates: Affiliate[];
  loading: boolean;
  error: string | null;
  fetchAffiliates: () => Promise<void>;
  inviteAffiliate: (data: {
    email: string;
    tenantId: string;
    productId: string;
  }) => Promise<Invite>;
  acceptInvite: (inviteId: string) => Promise<Affiliate>;
  updateAffiliate: (affiliateId: string, data: Partial<Affiliate>) => Promise<Affiliate>;
  deleteAffiliate: (affiliateId: string) => Promise<void>;
}

export const useAffiliateStore = create<AffiliateState>((set) => ({
  affiliates: [],
  loading: false,
  error: null,

  fetchAffiliates: async () => {
    set({ loading: true, error: null });
    try {
      const affiliates = await affiliateApi.getAffiliates();
      set({ affiliates, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch affiliates',
        loading: false,
      });
    }
  },

  inviteAffiliate: async (data) => {
    set({ loading: true, error: null });
    try {
      const invite = await affiliateApi.inviteAffiliate(data);
      set({ loading: false });
      return invite;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to invite affiliate',
        loading: false,
      });
      throw error;
    }
  },

  acceptInvite: async (inviteId: string) => {
    set({ loading: true, error: null });
    try {
      const affiliate = await affiliateApi.acceptInvite(inviteId);
      set({ loading: false });
      return affiliate;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to accept invite',
        loading: false,
      });
      throw error;
    }
  },

  updateAffiliate: async (affiliateId: string, data: Partial<Affiliate>) => {
    set({ loading: true, error: null });
    try {
      const affiliate = await affiliateApi.updateAffiliate(affiliateId, data);
      set((state) => ({
        affiliates: state.affiliates.map((a) =>
          a.id === affiliateId ? { ...a, ...affiliate } : a
        ),
        loading: false,
      }));
      return affiliate;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update affiliate',
        loading: false,
      });
      throw error;
    }
  },

  deleteAffiliate: async (affiliateId: string) => {
    set({ loading: true, error: null });
    try {
      await affiliateApi.deleteAffiliate(affiliateId);
      set((state) => ({
        affiliates: state.affiliates.filter((a) => a.id !== affiliateId),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete affiliate',
        loading: false,
      });
      throw error;
    }
  },
})); 