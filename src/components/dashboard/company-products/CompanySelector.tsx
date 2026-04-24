import { useState } from 'react';
import { ArrowLeft, Building2, Search, ChevronRight } from 'lucide-react';
import type { CompanyListItem } from '../../../types';

interface CompanySelectorProps {
  companies: CompanyListItem[];
  isLoading: boolean;
  onSelect: (slug: string, name: string) => void;
  onBack: () => void;
}

export function CompanySelector({
  companies,
  isLoading,
  onSelect,
  onBack,
}: CompanySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.business_type?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleImageError = (companyId: number) => {
    setImageErrors((prev) => ({ ...prev, [companyId]: true }));
  };

  // Loading skeleton rows
  const SkeletonRow = () => (
    <div className="flex items-center gap-4 px-4 py-4 border border-gray-100 rounded-xl animate-pulse">
      <div className="p-2 rounded-lg bg-gray-100">
        <div className="h-5 w-5 bg-gray-200 rounded" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Choose Company</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Select a company to manage products
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Search input (always visible when not loading) */}
        {!isLoading && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              aria-label="Search companies"
            />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Empty state (no companies at all) */}
        {!isLoading && companies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-700 font-medium">No companies found</p>
            <p className="text-sm text-gray-500 mt-1">
              Please contact your administrator
            </p>
          </div>
        )}

        {/* No search results */}
        {!isLoading && companies.length > 0 && filteredCompanies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Search className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-700 font-medium">No matching companies</p>
            <p className="text-sm text-gray-500 mt-1">
              Try a different search term
            </p>
          </div>
        )}

        {/* Company list */}
        {!isLoading && filteredCompanies.length > 0 && (
          <div className="space-y-2">
            {filteredCompanies.map((company) => {
              const logoUrl = (company as any).logo || (company as any).logo_url;
              const hasImageError = imageErrors[company.id];
              const showIcon = !logoUrl || hasImageError;

              return (
                <button
                  key={company.id}
                  onClick={() => onSelect(company.slug, company.name)}
                  className="
                    w-full flex items-center justify-between
                    group px-4 py-4
                    border border-gray-200
                    rounded-xl
                    text-left
                    transition-all duration-200
                    hover:border-indigo-300 hover:bg-indigo-50/30
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                    active:scale-[0.98]
                  "
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Logo or Icon */}
                    <div className="flex-shrink-0">
                      {showIcon ? (
                        <div className="p-2 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                        </div>
                      ) : (
                        <img
                          src={logoUrl}
                          alt={`${company.name} logo`}
                          className="h-9 w-9 rounded-lg object-cover border border-gray-100 group-hover:border-indigo-200 transition-colors"
                          onError={() => handleImageError(company.id)}
                        />
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {company.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {company.business_type || 'Company'}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with count (only when companies exist) */}
      {!isLoading && filteredCompanies.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <p className="text-xs text-gray-500 text-center">
            {filteredCompanies.length} company{filteredCompanies.length !== 1 ? 'ies' : ''} available
          </p>
        </div>
      )}
    </div>
  );
}