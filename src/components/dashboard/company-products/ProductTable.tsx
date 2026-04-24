import { useState } from 'react';
import { Package, Edit, Trash2 } from 'lucide-react';

interface Product {
  id: number;
  sku: string;
  title: string;
  price: number;
  stock: number;
  unit: string;
  image?: string;      // adjust based on your API field name
  image_url?: string;  // alternative field
}

interface ProductTableProps {
  products: Product[];
  totalItems: number;
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: number, title: string) => void;
}

function StockBadge({ stock }: { stock: number }) {
  let color = 'bg-green-100 text-green-800';
  if (stock === 0) color = 'bg-red-100 text-red-800';
  else if (stock < 10) color = 'bg-yellow-100 text-yellow-800';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {stock}
    </span>
  );
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <Package className="h-5 w-5 text-gray-400" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-10 h-10 object-cover rounded-lg border border-gray-200"
      onError={() => setError(true)}
    />
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ProductTable({ products, totalItems, loading, onEdit, onDelete }: ProductTableProps) {
  if (loading) {
    return (
      <>
        <div className="text-sm text-gray-500 mb-2">Loading products...</div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (ETB)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={7} />
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500 mt-2">No products found</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-sm text-gray-500 mb-2">
        Showing {products.length} of {totalItems} products
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (ETB)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const imageUrl = product.image || product.image_url;
              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ProductImage src={imageUrl} alt={product.title} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{product.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StockBadge stock={product.stock} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors"
                      aria-label="Edit product"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id, product.title)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      aria-label="Delete product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}