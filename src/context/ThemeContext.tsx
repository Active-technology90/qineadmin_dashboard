import React, { createContext, useContext, useEffect, useState } from "react";
import { getCompanyDetail } from "../services/api";
import { useCurrentCompany } from "./CurrentCompanyContext";
import type { Company } from "../types";

export interface ThemeColor {
  id: string;
  name: string;
  primary: string;
  dark: string;
  light: string;
}

export type CompanyTheme = Pick<ThemeColor, "primary" | "dark" | "light">;

export const DEFAULT_THEME: ThemeColor = {
  id: "purple",
  name: "Purple Default",
  primary: "#674FA3",
  dark: "#6750A4",
  light: "#8B6BB5",
};

export const AVAILABLE_THEMES: ThemeColor[] = [
  DEFAULT_THEME,
  { id: "green", name: "Green", primary: "#059669", dark: "#064E3B", light: "#34D399" },
  { id: "slate", name: "Gray", primary: "#475569", dark: "#1E293B", light: "#94A3B8" },
];

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const isHexColor = (value?: string | null) =>
  typeof value === "string" && HEX_COLOR_PATTERN.test(value);

const normalizeTheme = (theme?: Partial<CompanyTheme> | null): ThemeColor => {
  const source = theme ?? {};
  const primary = source.primary;
  const dark = source.dark;
  const light = source.light;

  return {
    ...DEFAULT_THEME,
    id: "company",
    name: "Company Theme",
    primary: isHexColor(primary) && primary ? primary : DEFAULT_THEME.primary,
    dark: isHexColor(dark) && dark ? dark : DEFAULT_THEME.dark,
    light: isHexColor(light) && light ? light : DEFAULT_THEME.light,
  };
};

const themeFromCompany = (company?: Company | null): ThemeColor =>
  normalizeTheme({
    primary: company?.theme_primary,
    dark: company?.theme_dark,
    light: company?.theme_light,
  });

const getCacheKey = (companySlug: string) => `dashboard-theme:${companySlug}`;

const readCachedTheme = (companySlug: string): ThemeColor | null => {
  try {
    const cached = localStorage.getItem(getCacheKey(companySlug));
    if (!cached) return null;
    return normalizeTheme(JSON.parse(cached));
  } catch {
    return null;
  }
};

const cacheTheme = (companySlug: string, theme: CompanyTheme) => {
  localStorage.setItem(getCacheKey(companySlug), JSON.stringify(theme));
};

const applyThemeToDocument = (theme: CompanyTheme) => {
  document.documentElement.style.setProperty("--color-secondary", theme.primary);
  document.documentElement.style.setProperty("--color-secondary-dark", theme.dark);
  document.documentElement.style.setProperty("--color-secondary-light", theme.light);
};

interface ThemeContextType {
  currentTheme: ThemeColor;
  applyCompanyTheme: (theme: CompanyTheme, remember?: boolean) => void;
  setThemeById: (id: string) => void;
  refreshCompanyTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { company } = useCurrentCompany();
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>(DEFAULT_THEME);

  const applyAndRememberTheme = (theme: ThemeColor) => {
    setCurrentTheme(theme);
    applyThemeToDocument(theme);
    if (company?.slug) {
      cacheTheme(company.slug, theme);
    }
  };

  const refreshCompanyTheme = async () => {
    if (!company?.slug) {
      applyAndRememberTheme(DEFAULT_THEME);
      return;
    }

    const response = await getCompanyDetail(company.slug);
    applyAndRememberTheme(themeFromCompany(response.data));
  };

  useEffect(() => {
    let cancelled = false;

    if (!company?.slug) {
      setCurrentTheme(DEFAULT_THEME);
      applyThemeToDocument(DEFAULT_THEME);
      return;
    }

    const cachedTheme = readCachedTheme(company.slug);
    if (cachedTheme) {
      setCurrentTheme(cachedTheme);
      applyThemeToDocument(cachedTheme);
    } else {
      setCurrentTheme(DEFAULT_THEME);
      applyThemeToDocument(DEFAULT_THEME);
    }

    getCompanyDetail(company.slug)
      .then((response) => {
        if (cancelled) return;
        const backendTheme = themeFromCompany(response.data);
        setCurrentTheme(backendTheme);
        applyThemeToDocument(backendTheme);
        cacheTheme(company.slug, backendTheme);
      })
      .catch(() => {
        if (!cachedTheme && !cancelled) {
          setCurrentTheme(DEFAULT_THEME);
          applyThemeToDocument(DEFAULT_THEME);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [company?.slug]);

  const applyCompanyTheme = (theme: CompanyTheme, remember = true) => {
    const normalizedTheme = normalizeTheme(theme);
    setCurrentTheme(normalizedTheme);
    applyThemeToDocument(normalizedTheme);
    if (remember && company?.slug) {
      cacheTheme(company.slug, normalizedTheme);
    }
  };

  const setThemeById = (id: string) => {
    const theme = AVAILABLE_THEMES.find((item) => item.id === id);
    if (theme) applyAndRememberTheme(theme);
  };

  return (
    <ThemeContext.Provider
      value={{ currentTheme, applyCompanyTheme, setThemeById, refreshCompanyTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
