import { useState, useEffect } from 'react';
import { getCompanies } from '../services/api';
import type { CompanyListItem } from '../types';

export function useCompaniesList() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAllCompanies = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let allCompanies: CompanyListItem[] = [];
        let page = 1;
        let hasNext = true;

        while (hasNext && !cancelled) {
          const res = await getCompanies({ page });

          const results = res.data.results || [];

          allCompanies = [...allCompanies, ...results];

          // Check if next page exists
          hasNext = !!res.data.next;

          page += 1;
        }

        if (!cancelled) {
          setCompanies(allCompanies);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to fetch companies');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAllCompanies();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    companies,
    isLoading,
    error,
  };
}