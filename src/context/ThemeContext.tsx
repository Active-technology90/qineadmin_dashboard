import React, { createContext, useContext, useState, useEffect } from "react";

export interface ThemeColor {
  id: string;
  name: string;
  primary: string; // Used for --color-secondary
  dark: string;    // Used for --color-secondary-dark (e.g. sidebar gradient)
  light: string;   // Used for --color-secondary-light (e.g. lighter variant for gradients/glows)
}

export const AVAILABLE_THEMES: ThemeColor[] = [
  { id: "purple", name: "Purple (Default)", primary: "#674FA3", dark: "#6750A4", light: "#8B6BB5" },
  // { id: "blue", name: "Royal Blue", primary: "#2563EB", dark: "#1E3A8A", light: "#60A5FA" },
  // { id: "teal", name: "Teal Ocean", primary: "#0D9488", dark: "#115E59", light: "#2DD4BF" },
  { id: "green", name: "Green", primary: "#059669", dark: "#064E3B", light: "#34D399" },
  // { id: "orange", name: "Burnt Orange", primary: "#EA580C", dark: "#7C2D12", light: "#F97316" },
  // { id: "rose", name: "Rose Crimson", primary: "#E11D48", dark: "#881337", light: "#FB7185" },
  { id: "slate", name: "Gray", primary: "#475569", dark: "#1E293B", light: "#94A3B8" },
];

interface ThemeContextType {
  currentTheme: ThemeColor;
  setThemeById: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>(() => {
    const savedThemeId = localStorage.getItem("dashboard-theme");
    return AVAILABLE_THEMES.find((t) => t.id === savedThemeId) || AVAILABLE_THEMES[0];
  });

  useEffect(() => {
    // Apply colors to root document
    document.documentElement.style.setProperty("--color-secondary", currentTheme.primary);
    document.documentElement.style.setProperty("--color-secondary-dark", currentTheme.dark);
    document.documentElement.style.setProperty("--color-secondary-light", currentTheme.light);
    localStorage.setItem("dashboard-theme", currentTheme.id);
  }, [currentTheme]);

  const setThemeById = (id: string) => {
    const theme = AVAILABLE_THEMES.find((t) => t.id === id);
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setThemeById }}>
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
