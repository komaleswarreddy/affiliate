import { useEffect } from 'react';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { ProductForm } from './ProductForm';

export function ProductList() {
  const { products, isLoading, error, fetchProducts, deleteProduct } = useProductStore();
  const { role } = useAuthStore();
  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Product</h2>
          <ProductForm />
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Products</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            List of all products available for promotion
          </p>
        </div>

        <div className="border-t border-gray-200">
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
            <div className="text-sm font-medium text-gray-500">Name</div>
            <div className="text-sm font-medium text-gray-500">Price</div>
            <div className="text-sm font-medium text-gray-500">Commission</div>
            <div className="text-sm font-medium text-gray-500">Status</div>
            <div className="text-sm font-medium text-gray-500">Created</div>
            {isAdmin && <div className="text-sm font-medium text-gray-500">Actions</div>}
          </div>

          <div className="divide-y divide-gray-200">
            {products.map((product) => (
              <div key={product.id} className="px-4 py-5 sm:grid sm:grid-cols-6 sm:gap-4 sm:px-6">
                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">${product.price.toFixed(2)}</div>
                <div className="text-sm text-gray-500">
                  {product.product_commission ? `${product.product_commission}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(product.created_at).toLocaleDateString()}
                </div>
                {isAdmin && (
                  <div className="text-sm text-gray-500 space-x-2">
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 