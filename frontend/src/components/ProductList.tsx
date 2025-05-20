import React, { useEffect, useState } from 'react';
import { productApi } from '../services/api';
import type { Product } from '../types';

interface ProductListProps {
  tenantId: string;
  onProductSelect?: (productId: string) => void;
  selectedProductId?: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  tenantId,
  onProductSelect,
  selectedProductId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await productApi.getProducts(tenantId);
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [tenantId]);

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (onProductSelect) {
    return (
      <select
        value={selectedProductId}
        onChange={(e) => onProductSelect(e.target.value)}
        className="w-full border rounded px-3 py-2"
        required
      >
        <option value="">Select a product</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name} - ${product.price.toFixed(2)}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="grid gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-gray-600">{product.description}</p>
              <p className="text-gray-600">
                Price: ${product.price.toFixed(2)}
              </p>
              {product.product_commission && (
                <p className="text-gray-600">
                  Commission: {product.product_commission}%
                </p>
              )}
            </div>
            <span
              className={`px-2 py-1 rounded text-sm ${
                product.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {product.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}; 