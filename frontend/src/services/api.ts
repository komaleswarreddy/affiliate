import axios from 'axios';
import type { Affiliate, Invite, Product } from '../types';
import { useAuthStore } from '../store/authStore';
const token = useAuthStore.getState().token;

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/api$/, ''),
  headers: {
    'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`,
  },
});

// ✅ Automatically attach token to all requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else if (config.headers) {
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    } else {
      config.headers = { Authorization: `Bearer ${token}` };
    }
  }
  return config;
});

// ✅ Affiliate related API calls (no manual token passing)
export const affiliateApi = {
  getAffiliates: async () => {
    const response = await api.get<{ affiliates: Affiliate[] }>('/api/affiliates');
    return response.data.affiliates;
  },

  getAffiliate: async (affiliateId: string) => {
    const response = await api.get<{ affiliate: Affiliate }>(`/api/affiliates/${affiliateId}`);
    return response.data.affiliate;
  },

  inviteAffiliate: async (data: {
    email: string;
    tenantId: string;
    productId: string;
  }) => {
    const response = await api.post<Invite>('/api/affiliates/invite', data);
    return response.data;
  },

  acceptInvite: async (inviteId: string) => {
    const response = await api.post<Affiliate>(`/api/affiliates/accept/${inviteId}`);
    return response.data;
  },

  updateAffiliate: async (affiliateId: string, data: Partial<Affiliate>) => {
    const response = await api.put<Affiliate>(`/api/affiliates/${affiliateId}`, data);
    return response.data;
  },

  deleteAffiliate: async (affiliateId: string) => {
    await api.delete(`/api/affiliates/${affiliateId}`);
  },
};

// ✅ Product related API calls (no manual token passing)
export const productApi = {
  getProducts: async () => {
    const response = await api.get<Product[]>('/api/products');
    return response.data;
  },

  getProduct: async (productId: string) => {
    const response = await api.get<Product>(`/products/${productId}`);
    return response.data;
  },

  createProduct: async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post<Product>('/products', data);
    return response.data;
  },

  updateProduct: async (productId: string, data: Partial<Product>) => {
    const response = await api.put<Product>(`/products/${productId}`, data);
    return response.data;
  },

  deleteProduct: async (productId: string) => {
    await api.delete(`/products/${productId}`);
  },
};

export default api;
