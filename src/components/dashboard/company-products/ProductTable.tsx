import { useState } from "react";
import { Package, Edit, Trash2 } from "lucide-react";

interface Product {
  id: number;
  sku: string;
  title: string;
  price: number;
  stock: number;
  unit: string;
  image?: string; // adjust based on your API field name
  image_url?: string; // alternative field
}

interface ProductTableProps {
  products: Product[];
  totalItems: number;
  loading: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number, title: string) => void;
}

function StockBadge({ stock }: { stock: number }) {
  let color = "bg-green-100 text-green-800";
  if (stock === 0) color = "bg-red-100 text-red-800";
  else if (stock < 10) color = "bg-yellow-100 text-yellow-800";
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {stock}
    </span>
  );
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <Package className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-400" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-7 h-7 sm:w-10 sm:h-10 object-cover rounded-lg border border-gray-200"
      onError={() => setError(true)}
    />
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-2 py-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ProductTable({
  products,
  totalItems,
  loading,
  onEdit,
  onDelete,
}: ProductTableProps) {
  if (loading) {
    return (
      <>
        <div className="text-sm text-gray-500 mb-2">Loading products...</div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 -mx-3 sm:mx-0 px-3 sm:px-0">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="sticky top-0 bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm z-10">
            <tr>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Image
                </span>
              </th>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  SKU
                </span>
              </th>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Title
                </span>
              </th>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Price (ETB)
                </span>
              </th>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Stock
                </span>
              </th>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Unit
                </span>
              </th>
              {onEdit || onDelete ? (
                <th className="px-1.5 sm:px-3 py-2 text-right text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Actions
                  </span>
                </th>
              ) : null}
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
      <div className="hidden sm:block text-sm text-gray-500 mb-2">
        Showing {products.length} of {totalItems} products
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-[600px] sm:min-w-full table-fixed divide-y divide-gray-200">
          <thead className="sticky top-0 bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm z-10">
            <tr>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Image
                </span>
              </th>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  SKU
                </span>
              </th>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Title
                </span>
              </th>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Price (ETB)
                </span>
              </th>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Stock
                </span>
              </th>
              <th className="px-1.5 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Unit
                </span>
              </th>
              {onEdit || onDelete ? (
                <th className="px-1.5 sm:px-3 py-2 text-right text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Actions
                  </span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const imageUrl = product.image || product.image_url;
              return (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap">
                    <ProductImage src={imageUrl} alt={product.title} />
                  </td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap font-mono text-[11px] sm:text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                    {product.title}
                  </td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap text-[11px] sm:text-sm text-gray-600">
                    {product.price.toLocaleString()}
                  </td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap">
                    <StockBadge stock={product.stock} />
                  </td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap text-[11px] sm:text-sm text-gray-600">
                    {product.unit === 'pc' ? 'pcs' : product.unit}
                  </td>
                  <td className="px-1.5 sm:px-2 py-1.5 sm:py-2 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                      {onEdit && (
                        <button onClick={() => onEdit(product)} className="p-1 rounded-md hover:bg-secondary/10 transition-colors">
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          onClick={() => onDelete(product.id, product.title)}
                          className="p-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
                        </button>
                      )}
                    </div>
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
