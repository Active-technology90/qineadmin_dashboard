import { useState, useEffect, useCallback } from 'react';
import { getCategories, getCategoryDetail } from '../services/api';
import type { Category } from '../types/index';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load categories');
      console.error('useCategories error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
}

export function useCategoryDetail(slug: string | undefined) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await getCategoryDetail(slug);
      setCategory(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load category');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { category, loading, error, refetch: fetch };
}
