import { createContext, useContext } from "react";

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

export const CurrentCompanyContext = createContext<CurrentCompanyContextType>({
  company: null,
  switchCompany: () => {},
  clearCompany: () => {},
});

export const useCurrentCompany = () => useContext(CurrentCompanyContext);