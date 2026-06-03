import { useEffect, useMemo, useState } from "react";
import { 
  Check, 
  // Layout, 
  Building2, RotateCcw, Save, SwatchBook } from "lucide-react";
import {
  AVAILABLE_THEMES,
  DEFAULT_THEME,
  type CompanyTheme,
  useTheme,
} from "../../../context/ThemeContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { updateCompany } from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { CompanySelector } from "../company-products/CompanySelector";
import type { CompanyListItem } from "../../../types";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

type Notice = {
  message: string;
  type: "success" | "error";
};

const getApiErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    if (typeof data === "string") return data;
    if (typeof data === "object" && data !== null) {
      if ("detail" in data && typeof data.detail === "string") return data.detail;
      return Object.entries(data)
        .map(([key, value]) => {
          const text = Array.isArray(value) ? value.join(", ") : String(value);
          return `${key}: ${text}`;
        })
        .join(" ");
    }
  }

  return error instanceof Error ? error.message : "Unknown error";
};

const colorFields: Array<{
  key: keyof CompanyTheme;
  label: string;
  description: string;
}> = [
  { key: "primary", label: "Primary", description: "Buttons, active states, links" },
  { key: "dark", label: "Dark", description: "Sidebar gradients and deep accents" },
  { key: "light", label: "Light", description: "Glows, gradients, soft highlights" },
];

const toCompanyTheme = (theme: CompanyTheme): CompanyTheme => ({
  primary: theme.primary,
  dark: theme.dark,
  light: theme.light,
});

export default function Settings() {
  const { user } = useAuth();
  const { company } = useCurrentCompany();
  const { companies, isLoading: companiesLoading } = useCompaniesList();
  const {
    currentTheme,
    applyCompanyTheme,
    rememberCompanyTheme,
    refreshCompanyTheme,
  } = useTheme();
  const isSuperAdmin = !user?.memberships?.length;
  const [targetCompany, setTargetCompany] = useState<CompanyListItem | null>(null);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [loadingTargetTheme, setLoadingTargetTheme] = useState(false);
  const [draftTheme, setDraftTheme] = useState<CompanyTheme>({
    primary: currentTheme.primary,
    dark: currentTheme.dark,
    light: currentTheme.light,
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const targetCompanySlug = isSuperAdmin ? targetCompany?.slug : company?.slug;
  const targetCompanyName = isSuperAdmin ? targetCompany?.name : company?.name;
  const canEditTheme =
    isSuperAdmin || company?.role === "owner" || company?.role === "admin";
  const hasInvalidColor = useMemo(
    () => colorFields.some((field) => !HEX_COLOR_PATTERN.test(draftTheme[field.key])),
    [draftTheme],
  );
  const saveDisabledReason = useMemo(() => {
    if (!canEditTheme) return "Only company owners, admins, and superadmins can save themes.";
    if (!targetCompanySlug) return "Choose a company before saving.";
    if (loadingTargetTheme) return "Wait until the selected company theme finishes loading.";
    if (hasInvalidColor) return "Fix invalid hex colors before saving.";
    if (saving) return "Saving theme...";
    return "";
  }, [canEditTheme, hasInvalidColor, loadingTargetTheme, saving, targetCompanySlug]);
  const isSaveDisabled = Boolean(saveDisabledReason);

  useEffect(() => {
    if (isSuperAdmin) return;
    setDraftTheme({
      primary: currentTheme.primary,
      dark: currentTheme.dark,
      light: currentTheme.light,
    });
  }, [currentTheme.primary, currentTheme.dark, currentTheme.light, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin || targetCompany || companies.length === 0) return;

    // Prefer the company already selected in context (Overview, Products, etc.)
    // so Settings feels like part of the same navigation flow.
    const fromContext = company?.slug
      ? companies.find((c) => c.slug === company.slug)
      : null;

    setTargetCompany(fromContext ?? companies[0]);
  }, [companies, company?.slug, isSuperAdmin, targetCompany]);

  useEffect(() => {
    if (!isSuperAdmin || !targetCompany?.slug) return;

    setNotice(null);

    // Read theme from the already-fetched companies list instead of a separate API call
    const found = companies.find((c) => c.slug === targetCompany.slug);
    if (found) {
      setDraftTheme({
        primary: found.theme_primary || DEFAULT_THEME.primary,
        dark: found.theme_dark || DEFAULT_THEME.dark,
        light: found.theme_light || DEFAULT_THEME.light,
      });
    } else {
      setDraftTheme(DEFAULT_THEME);
    }
    setLoadingTargetTheme(false);
  }, [isSuperAdmin, targetCompany?.slug, companies]);

  const updateDraftColor = (key: keyof CompanyTheme, value: string) => {
    const normalized = value.startsWith("#") ? value : `#${value}`;
    setDraftTheme((previous) => {
      const nextTheme = { ...previous, [key]: normalized };
      if (!isSuperAdmin && HEX_COLOR_PATTERN.test(normalized)) {
        applyCompanyTheme(nextTheme, false);
      }
      return nextTheme;
    });
  };

  const applyPreset = (theme: CompanyTheme) => {
    const nextTheme = toCompanyTheme(theme);
    setDraftTheme(nextTheme);
    if (!isSuperAdmin) {
      applyCompanyTheme(nextTheme, false);
    }
  };

  const resetToDefault = () => {
    applyPreset(DEFAULT_THEME);
  };

  const saveTheme = async () => {
    if (!targetCompanySlug || hasInvalidColor || !canEditTheme) return;

    setSaving(true);
    setNotice(null);
    try {
      const response = await updateCompany(targetCompanySlug, {
        theme_primary: draftTheme.primary,
        theme_dark: draftTheme.dark,
        theme_light: draftTheme.light,
      });

      if (
        !response.data.theme_primary ||
        !response.data.theme_dark ||
        !response.data.theme_light
      ) {
        throw new Error(
          "The backend response does not include company theme fields. Run/deploy the backend theme migration and serializer changes first.",
        );
      }

      const savedTheme = {
        primary: response.data.theme_primary,
        dark: response.data.theme_dark,
        light: response.data.theme_light,
      };
      if (isSuperAdmin) {
        rememberCompanyTheme(targetCompanySlug, savedTheme);
        if (company?.slug === targetCompanySlug) {
          applyCompanyTheme(savedTheme, true);
        }
      } else {
        applyCompanyTheme(savedTheme, true);
      }
      setDraftTheme(savedTheme);
      setNotice({
        message: `Theme saved for ${targetCompanyName || "the selected company"}.`,
        type: "success",
      });
    } catch (error) {
      console.error("Theme save failed:", error);
      if (!isSuperAdmin) {
        await refreshCompanyTheme();
      }
      setNotice({
        message: `Could not save theme. ${getApiErrorMessage(error)}`,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTargetCompany = (slug: string) => {
    const selected = companies.find((item) => item.slug === slug);
    if (selected) {
      setTargetCompany(selected);
      setShowCompanySelector(false);
    }
  };

  if (isSuperAdmin && showCompanySelector) {
    return (
      <div className="p-4 sm:p-6 lg:p-10">
        <CompanySelector
          companies={companies}
          isLoading={companiesLoading}
          onSelect={handleSelectTargetCompany}
          onBack={() => setShowCompanySelector(false)}
          disableProductSearch
          title="Choose Company Theme"
          subtitle="Select exactly one company to edit its dashboard theme"
          searchPlaceholder="Search companies by name..."
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {notice && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <SwatchBook className="h-5 w-5 text-secondary" />
              Company Dashboard Theme
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {targetCompanyName || "Select a company"} theme applies to every user under that company.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetToDefault}
              disabled={!canEditTheme || loadingTargetTheme}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={saveTheme}
              disabled={isSaveDisabled}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              title={saveDisabledReason || "Save theme"}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Theme"}
            </button>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                {targetCompany?.logo ? (
                  <img
                    src={targetCompany.logo}
                    alt={targetCompany.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-5 w-5 text-secondary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Editing Company
                </p>
                <p className="font-bold text-gray-900 truncate">
                  {targetCompany?.name || "No company selected"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCompanySelector(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-secondary/20 text-secondary text-sm font-semibold hover:bg-secondary/5"
            >
              <Building2 className="h-4 w-4" />
              Choose Company
            </button>
          </div>
        )}

        {!canEditTheme && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Only company owners and admins can update the shared dashboard theme.
          </div>
        )}

        {loadingTargetTheme && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Loading selected company theme...
          </div>
        )}

        {saveDisabledReason && !saving && !loadingTargetTheme && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {saveDisabledReason}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {colorFields.map((field) => {
            const value = draftTheme[field.key];
            const invalid = !HEX_COLOR_PATTERN.test(value);

            return (
              <div key={field.key} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-800">{field.label}</label>
                    <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
                  </div>
                  <input
                    type="color"
                    value={HEX_COLOR_PATTERN.test(value) ? value : DEFAULT_THEME[field.key]}
                    disabled={!canEditTheme || loadingTargetTheme}
                    onChange={(event) => updateDraftColor(field.key, event.target.value)}
                    className="h-10 w-10 rounded-lg border border-gray-200 bg-white p-1 cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>

                <input
                  value={value}
                  disabled={!canEditTheme || loadingTargetTheme}
                  onChange={(event) => updateDraftColor(field.key, event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-secondary disabled:bg-white disabled:text-gray-400 ${
                    invalid ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-800"
                  }`}
                />
                {invalid && <p className="text-xs font-medium text-red-600">Use #RRGGBB format.</p>}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AVAILABLE_THEMES.map((theme) => {
            const isSelected =
              theme.primary === draftTheme.primary &&
              theme.dark === draftTheme.dark &&
              theme.light === draftTheme.light;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => applyPreset(theme)}
                disabled={!canEditTheme || loadingTargetTheme}
                className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected
                    ? "border-secondary bg-secondary/5 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span
                  className="h-10 w-10 rounded-lg shadow-inner"
                  style={{ background: `linear-gradient(135deg, ${theme.dark}, ${theme.primary})` }}
                />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-bold ${isSelected ? "text-secondary" : "text-gray-700"}`}>
                    {theme.name}
                  </span>
                  <span className="block text-xs text-gray-400">{theme.primary}</span>
                </span>
                {isSelected && <Check className="h-4 w-4 text-secondary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-5 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Layout className="h-5 w-5 text-secondary" />
            Live Component Preview
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Preview updates immediately; saving publishes it to the whole company.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100">
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Buttons & Badges</label>
            <div className="flex flex-wrap gap-3 items-center">
              <button className="px-5 py-2.5 bg-secondary text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:opacity-95 transition-all duration-300 text-sm">
                Primary Button
              </button>
              <button className="px-5 py-2.5 border border-secondary text-secondary font-bold rounded-xl hover:bg-secondary/5 transition-all duration-300 text-sm">
                Outline Button
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary/10 text-secondary border border-secondary/20">
                Active Status
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                Inactive
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Form Inputs & Selection</label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Focused Input Field..."
                  readOnly
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-secondary bg-white focus:outline-none shadow-sm shadow-secondary/5"
                />
                <span className="absolute right-3 top-3 text-[10px] font-bold text-secondary uppercase tracking-wide">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="w-4 h-4 rounded text-secondary border-gray-300 focus:ring-secondary accent-secondary"
                />
                <span className="text-sm text-gray-600 font-medium">Selected option checkbox</span>
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}
