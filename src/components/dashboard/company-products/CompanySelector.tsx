// src/components/dashboard/CompanySelector.tsx
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type { CompanyListItem } from '../../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CompanySelectorProps {
  companies: CompanyListItem[];
  isLoading: boolean;
  onSelect: (slug: string, name: string) => void;
  onBack: () => void;
  allowSwitch?: boolean; 
   subtitle?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function AccessDenied() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-lg mx-auto overflow-hidden"
    >
      <Header title="Company Selector" />
      <div className="p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Access Denied</h3>
        <p className="text-sm text-gray-500">
          Only super administrators can switch companies.
        </p>
      </div>
    </motion.div>
  );
}

function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-2 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div>
        <h2 className="text-xl font-bold text-secondary">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className="relative">
      <Search
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
          isFocused ? 'text-secondary' : 'text-gray-400'
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search by name or type..."
        className="w-full pl-10 pr-10 py-2.5 rounded-xl border bg-gray-50 text-sm
          transition-all duration-200 outline-none
          focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary
          hover:border-gray-300"
        aria-label="Search companies"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {!value && !isFocused && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] text-gray-400 font-sans border border-gray-200">
          <span className="text-xs">⌘</span>K
        </kbd>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-100 animate-pulse"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100" />
          <div className="w-3/4 h-4 bg-gray-100 rounded-full" />
          <div className="w-1/2 h-3 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-2xl bg-gray-50 mb-4">
        <Icon className="h-10 w-10 text-gray-300" />
      </div>
      <p className="text-gray-700 font-medium">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{message}</p>
    </div>
  );
}

function CompanyGridCard({
  company,
  onSelect,
  imageError,
  onImageError,
}: {
  company: CompanyListItem;
  onSelect: (slug: string, name: string) => void;
  imageError: boolean;
  onImageError: (id: number) => void;
}) {
  const logoUrl = (company as any).logo || (company as any).logo_url;
  const showIcon = !logoUrl || imageError;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(company.slug, company.name)}
      className="group flex flex-col items-center gap-3 p-5 rounded-xl
        border border-gray-200 bg-white text-center
        transition-all duration-200
        hover:border-[#6750A4]/40 hover:bg-[#6750A4]/5 hover:shadow-md
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6750A4]
        active:scale-[0.98]"
    >
      {/* Logo / Icon */}
      <div className="w-20 h-20 rounded-full flex items-center justify-center
        border border-gray-200 bg-gray-50 overflow-hidden
        group-hover:border-[#6750A4]/30 group-hover:shadow-sm transition-all">
        {showIcon ? (
          <Building2 className="h-7 w-7 text-[#6750A4]" />
        ) : (
          <img
            src={logoUrl}
            alt={`${company.name} logo`}
            className="w-full h-full object-cover"
            onError={() => onImageError(company.id)}
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 w-full">
        <p className="font-bold text-gray-900 truncate text-lg">
          {company.name}
        </p>
        <p className="text-xs text-gray-500 truncate capitalize mt-0.5">
          {company.business_type || 'Company'}
        </p>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function CompanySelector({
  companies,
  isLoading,
  onSelect,
  onBack,
  allowSwitch = false,
  subtitle = "Select a company to manage its products"
}: CompanySelectorProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const isSuperAdmin = !user?.memberships || user.memberships.length === 0;
  const hasAccess = isSuperAdmin || allowSwitch;
  if (!hasAccess) {
    return <AccessDenied />;
  }

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.business_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageError = useCallback((companyId: number) => {
    setImageErrors((prev) => ({ ...prev, [companyId]: true }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-5xl mx-auto flex flex-col"
      style={{ maxHeight: 'calc(100vh - 100px)' }}
    >
      {/* Header – fixed at top */}
      <Header
        title="Choose Company"
        subtitle={subtitle}
      />

      {/* Scrollable content area (search + grid) */}
      <div className="flex-1 overflow-y-auto">
        {/* Sticky search */}
        <div className="sticky top-0 z-10 px-5 pt-3 pb-2 bg-white">
          <SearchInput value={searchTerm} onChange={setSearchTerm} />
          <div className="mt-3 border-b border-gray-100" />
        </div>

        {/* Grid / skeleton / empty states */}
        <div className="px-5 pb-5">
          {isLoading && <SkeletonGrid />}

          {!isLoading && companies.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No companies available"
              message="Please contact your administrator"
            />
          )}

          {!isLoading && companies.length > 0 && filteredCompanies.length === 0 && (
            <EmptyState
              icon={Search}
              title="No matching companies"
              message="Try a different search term"
            />
          )}

          {!isLoading && filteredCompanies.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-3">
              <AnimatePresence>
                {filteredCompanies.map((company) => (
                  <CompanyGridCard
                    key={company.id}
                    company={company}
                    onSelect={onSelect}
                    imageError={!!imageErrors[company.id]}
                    onImageError={handleImageError}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Footer – fixed at bottom */}
      {!isLoading && filteredCompanies.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-center flex-shrink-0">
          <p className="text-xs text-gray-500">
            Showing {filteredCompanies.length} of {companies.length} compan
            {companies.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      )}
    </motion.div>
  );
}