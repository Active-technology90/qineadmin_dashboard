import { useState, useEffect } from 'react';
import { getCompanies } from '../services/api';
import type { CompanyListItem } from '../types';

export function useCompaniesList() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getCompanies({ page: 1 })
      .then(res => {
        if (!cancelled) {
          setCompanies(res.data.results || []);
          setIsLoading(false);
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(e.message);
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return { companies, isLoading, error };
}