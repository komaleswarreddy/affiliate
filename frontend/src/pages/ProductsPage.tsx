import { ProductList } from '../components/products/ProductList';

export function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your products and their commission rates for affiliates
        </p>
      </div>

      <ProductList />
    </div>
  );
} 