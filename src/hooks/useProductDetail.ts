import { useState, useEffect, useCallback } from 'react';
import { getCompanyProductDetail } from '@/services/api';
import type { CompanyProduct } from '@/types';

export function useProductDetail(
  companySlug: string | undefined,
  productId: number | string | undefined,
) {
  const [product, setProduct] = useState<CompanyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!companySlug || !productId) return;
    try {
      setLoading(true);
      setError(null);
      const numericId = typeof productId === 'string' ? parseInt(productId, 10) : productId;
      const { data } = await getCompanyProductDetail(companySlug, numericId);
      setProduct(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load product');
      console.error('useProductDetail error:', err);
    } finally {
      setLoading(false);
    }
  }, [companySlug, productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, loading, error, refetch: fetchProduct };
}
