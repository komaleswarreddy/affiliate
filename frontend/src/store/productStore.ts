import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  price: number;
  product_commission?: number;
  image_url?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  
  // Methods
  fetchProducts: () => Promise<void>;
  getProduct: (id: string) => Promise<Product | null>;
  createProduct: (product: Omit<Product, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    const { token } = useAuthStore.getState();
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log(response);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const products = await response.json();
      set({ products, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch products', isLoading: false });
    }
  },

  getProduct: async (id: string) => {
    const { token } = useAuthStore.getState();
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const product = await response.json();
      set({ isLoading: false });
      return product;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch product', isLoading: false });
      return null;
    }
  },

  createProduct: async (product) => {
    const { token } = useAuthStore.getState();
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const newProduct = await response.json();
      set(state => ({ 
        products: [newProduct, ...state.products],
        isLoading: false 
      }));
      return newProduct;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create product', isLoading: false });
      throw error;
    }
  },

  updateProduct: async (id, product) => {
    const { token } = useAuthStore.getState();
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      const updatedProduct = await response.json();
      set(state => ({
        products: state.products.map(p => p.id === id ? updatedProduct : p),
        isLoading: false
      }));
      return updatedProduct;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update product', isLoading: false });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    const { token } = useAuthStore.getState();
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      set(state => ({
        products: state.products.filter(p => p.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete product', isLoading: false });
      throw error;
    }
  },
})); 