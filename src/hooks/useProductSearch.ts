import { useState, useCallback } from 'react';
import { searchProducts } from '@/services/api';
import type { CompanyProductListItem } from '@/types';

interface SearchParams {
  search?: string;
  category?: string;
  sub_category?: string;
  business_type?: string;
  price_min?: string;
  price_max?: string;
  ordering?: string;
  page?: number;
}

export function useProductSearch() {
  const [results, setResults] = useState<CompanyProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const search = useCallback(async (params: SearchParams, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const { data } = await searchProducts(params);
      
      if (append) {
        setResults((prev) => [...prev, ...data.results]);
      } else {
        setResults(data.results);
      }
      
      setTotalCount(data.count);
      setHasNext(!!data.next);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
      console.error('useProductSearch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotalCount(0);
    setHasNext(false);
    setError(null);
  }, []);

  return { results, loading, loadingMore, error, totalCount, hasNext, search, clearResults };
}
