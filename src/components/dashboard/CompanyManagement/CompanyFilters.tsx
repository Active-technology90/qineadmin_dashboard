// src/components/admin/CompanyManagement/CompanyFilters.tsx
import { X } from "lucide-react";
import { SearchInput } from "../../ui/SearchInput";
import { TableControls } from "../../ui/TableControls";

interface CompanyFiltersProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  loading: boolean;
  sortField: string;
  sortOrder: string;
  onSortChange: (value: string) => void;
  businessTypeFilter: string;
  onBusinessTypeChange: (value: string) => void;
  businessTypeOptions: string[];
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categoryOptions: string[];
  subCategoryFilter: string;
  onSubCategoryChange: (value: string) => void;
  subCategoryOptions: string[];
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export default function CompanyFilters({
  pageSize,
  onPageSizeChange,
  inputValue,
  onInputChange,
  loading,
  sortField,
  sortOrder,
  onSortChange,
  businessTypeFilter,
  onBusinessTypeChange,
  businessTypeOptions,
  categoryFilter,
  onCategoryChange,
  categoryOptions,
  subCategoryFilter,
  onSubCategoryChange,
  subCategoryOptions,
  hasActiveFilters,
  onClearAll,
}: CompanyFiltersProps) {
  return (
    <TableControls pageSize={pageSize} onPageSizeChange={onPageSizeChange}>
      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="flex-1">
            <SearchInput
              value={inputValue}
              onChange={onInputChange}
              debounceMs={0}
              loading={loading}
              showClearButton={false}
              placeholder="Search by name, slug, category, subcategory, or type..."
            />
          </div>
          <select
            value={`${sortField}|${sortOrder}`}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 sm:w-48"
          >
            <option value={`${sortField}|${sortOrder}`}>All Filters</option>
            <option value="name|asc">Name (A-Z)</option>
            <option value="name|desc">Name (Z-A)</option>
            <option value="is_active|desc">Active First</option>
            <option value="is_featured|desc">Featured First</option>
          </select>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={businessTypeFilter}
            onChange={(e) => onBusinessTypeChange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Business Types</option>
            {businessTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={subCategoryFilter}
            onChange={(e) => onSubCategoryChange(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Subcategories</option>
            {subCategoryOptions.map((subCat) => (
              <option key={subCat} value={subCat}>
                {subCat}
              </option>
            ))}
          </select>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center justify-center gap-1.5 border border-[#f31313] text-[#f31313] rounded-lg px-4 py-2 text-sm w-1/3 hover:bg-[#f31313]/5"
            >
              <X size={14} />
              Clear
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </TableControls>
  );
}