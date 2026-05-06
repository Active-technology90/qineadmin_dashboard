import { useState, useEffect, useCallback } from 'react';
import { getCompanies } from '../services/api';
import type { CompanyListItem } from '../types';
import type { User } from '../types';

// interface UseCompanySelectionReturn {
//   selectedCompany: { slug: string; name: string } | null;
//   showSelector: boolean;
//   companies: CompanyListItem[];
//   isLoadingCompanies: boolean;
//   selectCompany: (slug: string, name: string) => void;
//   resetCompany: () => void;
// }
export function useCompanySelection(user: User | null) {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [selectedCompany, setSelectedCompany] =
    useState<{ slug: string; name: string } | null>(null);

  const [showSelector, setShowSelector] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setIsLoadingCompanies(true);

    try {
      const res = await getCompanies({ page: 1 });
      const list = res.data.results || [];

      setCompanies(list);

      if (list.length === 1) {
        setSelectedCompany({
          slug: list[0].slug,
          name: list[0].name,
        });

        setShowSelector(false);
        return;
      }

      setShowSelector(true);
    } catch (e) {
      console.error(e);
      setCompanies([]);
      setShowSelector(true);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, []);

  const selectCompany = (slug: string, name: string) => {
    setSelectedCompany({ slug, name });
    setShowSelector(false);
  };

  const resetCompany = () => {
    setSelectedCompany(null);
    fetchCompanies();
  };

  useEffect(() => {
    if (!user) return;
    fetchCompanies();
  }, [user, fetchCompanies]);

  return {
    selectedCompany,
    showSelector,
    companies,
    isLoadingCompanies,
    selectCompany,
    resetCompany,
  };
}