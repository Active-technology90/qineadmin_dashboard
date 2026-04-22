import { useState, useEffect } from 'react';
import { getCompanies } from '../services/api';
import type { CompanyListItem } from '../types';
import type { User } from '../types';

interface UseCompanySelectionReturn {
  selectedCompany: { slug: string; name: string } | null;
  showSelector: boolean;
  companies: CompanyListItem[];
  isLoadingCompanies: boolean;
  selectCompany: (slug: string, name: string) => void;
  resetCompany: () => void;
}

export function useCompanySelection(user: User | null): UseCompanySelectionReturn {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<{ slug: string; name: string } | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  const fetchCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const response = await getCompanies({ page: 1 });
      const companyList = response.data.results || [];
      setCompanies(companyList);
      if (companyList.length === 1) {
        const company = companyList[0];
        setSelectedCompany({ slug: company.slug, name: company.name });
        localStorage.setItem('selected_company_slug', company.slug);
        localStorage.setItem('selected_company_name', company.name);
        setShowSelector(false);
      } else if (companyList.length > 1) {
        setShowSelector(true);
      } else {
        setShowSelector(true); // no companies, but show selector with empty list
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setShowSelector(true);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const selectCompany = (slug: string, name: string) => {
    setSelectedCompany({ slug, name });
    localStorage.setItem('selected_company_slug', slug);
    localStorage.setItem('selected_company_name', name);
    setShowSelector(false);
  };

  const resetCompany = () => {
    localStorage.removeItem('selected_company_slug');
    localStorage.removeItem('selected_company_name');
    setSelectedCompany(null);
    fetchCompanies();
  };

  useEffect(() => {
    const membershipSlug = user?.memberships?.[0]?.company_slug;
    const membershipName = user?.memberships?.[0]?.company_name;
    if (membershipSlug && membershipName) {
      setSelectedCompany({ slug: membershipSlug, name: membershipName });
      setShowSelector(false);
    } else {
      const storedSlug = localStorage.getItem('selected_company_slug');
      const storedName = localStorage.getItem('selected_company_name');
      if (storedSlug && storedName) {
        setSelectedCompany({ slug: storedSlug, name: storedName });
        setShowSelector(false);
      } else {
        fetchCompanies();
      }
    }
  }, [user]);

  return {
    selectedCompany,
    showSelector,
    companies,
    isLoadingCompanies,
    selectCompany,
    resetCompany,
  };
}