import { useState, useEffect, useCallback } from 'react';
import { getSubCategories, getSubCategoryDetail } from '@/services/api';
import type { SubCategory } from '@/types';

export function useSubCategories(categorySlug?: string) {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    // If categorySlug is provided, we fetch filtered. If not, we can fetch all but usually we want filtered.
    try {
      setLoading(true);
      setError(null);
      const { data } = await getSubCategories(categorySlug);
      setSubCategories(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  }, [categorySlug]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { subCategories, loading, error, refetch: fetch };
}
