import { useState, useEffect, useCallback } from 'react';
import { getCompanies, getCompanyDetail } from '@/services/api';
import type { CompanyListItem, Company, PaginatedResponse } from '@/types';

interface UseCompaniesParams {
  category?: string;
  sub_category?: string;
  business_type?: string;
  featured?: string;
  search?: string;
  page?: number;
}

export function useCompanies(params?: UseCompaniesParams) {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getCompanies(params);
      setCompanies(data.results);
      setTotalCount(data.count);
      setHasNext(!!data.next);
    } catch (err: any) {
      setError(err?.message || 'Failed to load companies');
      console.error('useCompanies error:', err);
    } finally {
      setLoading(false);
    }
  }, [
    params?.category,
    params?.sub_category,
    params?.business_type,
    params?.featured,
    params?.search,
    params?.page,
  ]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return { companies, loading, error, totalCount, hasNext, refetch: fetchCompanies };
}

export function useCompanyDetail(slug: string | undefined) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await getCompanyDetail(slug);
      setCompany(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { company, loading, error, refetch: fetch };
}
