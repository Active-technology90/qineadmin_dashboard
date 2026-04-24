import { useState, useCallback, useEffect } from 'react';
import { getCompanyProducts, createCompanyProduct, updateCompanyProduct, deleteCompanyProduct } from '../services/api';
import type { CompanyProductListItem } from '../types';
import { useDebounce } from './useDebounce';

interface UseCompanyProductsOptions {
  companySlug: string | null;
  pageSize?: number;
}

export function useCompanyProducts({ companySlug, pageSize = 10 }: UseCompanyProductsOptions) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const fetchProducts = useCallback(async () => {
    if (!companySlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getCompanyProducts(companySlug, {
        page: currentPage,
        search: debouncedSearch,
        page_size: pageSize,
      });
      const items = response.data.results || [];
      setProducts(items.map((item: CompanyProductListItem) => ({
        id: item.id,
        sku: item.sku || '',
        title: item.title,
        price: parseFloat(item.price),
        stock: item.stock,
        unit: item.unit || 'pc',
         image: item.primary_image,        // add this
      })));
      setTotalItems(response.data.count);
      setTotalPages(Math.ceil(response.data.count / pageSize));
    } catch (err) {
      setError('Failed to load products. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [companySlug, currentPage, debouncedSearch, pageSize]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (companySlug) fetchProducts();
  }, [companySlug, currentPage, fetchProducts]); // fetchProducts is stable

 const createProduct = async (data: any) => {
  if (!companySlug) throw new Error('No company selected');
  const response = await createCompanyProduct(companySlug, data);
  await fetchProducts();
  return response.data; // 👈 return created product
};

const updateProduct = async (id: number, data: any) => {
  if (!companySlug) throw new Error('No company selected');
  const response = await updateCompanyProduct(companySlug, id, data);
  await fetchProducts();
  return response.data; // 👈 return updated product
};

  const deleteProduct = async (id: number) => {
    if (!companySlug) throw new Error('No company selected');
    await deleteCompanyProduct(companySlug, id);
    await fetchProducts();
  };

  return {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    search,
    setSearch,
    setCurrentPage,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}