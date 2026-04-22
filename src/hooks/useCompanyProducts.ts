import { useState, useEffect, useCallback } from 'react';
import { getCompanyProducts } from './../services/api';  // adjusted path
import type { CompanyProductListItem } from './../types';

interface UseCompanyProductsParams {
  search?: string;
  ordering?: string;
  page?: number;
}

export function useCompanyProducts(
  companySlug: string | undefined,
  params?: UseCompanyProductsParams,
) {
  const [products, setProducts] = useState<CompanyProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!companySlug) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await getCompanyProducts(companySlug, params);
      setProducts(data.results);
      setTotalCount(data.count);
      setHasNext(!!data.next);
    } catch (err: any) {
      setError(err?.message || 'Failed to load products');
      console.error('useCompanyProducts error:', err);
    } finally {
      setLoading(false);
    }
  }, [companySlug, params?.search, params?.ordering, params?.page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, totalCount, hasNext, refetch: fetchProducts };
}