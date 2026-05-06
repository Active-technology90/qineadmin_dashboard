import { createContext, useContext, useEffect, useState } from "react";

export interface CurrentCompany {
  slug: string;
  name: string;
  role: string;
}

interface CurrentCompanyContextType {
  company: CurrentCompany | null;
  switchCompany: (membership: CurrentCompany) => void;
  clearCompany: () => void;
}

const CurrentCompanyContext = createContext<CurrentCompanyContextType>({
  company: null,
  switchCompany: () => {},
  clearCompany: () => {},
});

interface Props {
  children: React.ReactNode;
  userMemberships?: { company_slug: string; company_name: string; role: string }[] | null;
}

export const CurrentCompanyProvider = ({ children, userMemberships }: Props) => {
  const [company, setCompany] = useState<CurrentCompany | null>(null);

  // 1. Load from localStorage first
  useEffect(() => {
    const stored = localStorage.getItem("currentCompany");
    if (stored) {
      setCompany(JSON.parse(stored));
    }
  }, []);

  // 2. Fallback to the first membership if no stored company & user has memberships
  useEffect(() => {
    if (!company && userMemberships && userMemberships.length > 0) {
      const first = userMemberships[0];
      setCompany({
        slug: first.company_slug,
        name: first.company_name,
        role: first.role,
      });
      // Optionally persist it so that refreshing keeps this default
      // localStorage.setItem("currentCompany", JSON.stringify({ slug: first.company_slug, name: first.company_name, role: first.role }));
    }
  }, [company, userMemberships]);

  const switchCompany = (membership: CurrentCompany) => {
    localStorage.setItem("currentCompany", JSON.stringify(membership));
    setCompany(membership);
  };

  const clearCompany = () => {
    localStorage.removeItem("currentCompany");
    setCompany(null);
  };

  return (
    <CurrentCompanyContext.Provider value={{ company, switchCompany, clearCompany }}>
      {children}
    </CurrentCompanyContext.Provider>
  );
};

export const useCurrentCompany = () => useContext(CurrentCompanyContext);