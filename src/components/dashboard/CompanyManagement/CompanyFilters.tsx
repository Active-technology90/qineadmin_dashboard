import { X } from "lucide-react";
import { SearchInput } from "../../ui/SearchInput";
import { TableControls } from "../../ui/TableControls";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";

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
    <div className="relative z-20 ">
      {/* ================= TABLET + DESKTOP ONLY ================= */}
      <div className="hidden md:block">
        <TableControls pageSize={pageSize} onPageSizeChange={onPageSizeChange}>
          <div className="w-full  sm:py-3 md:py-1 px-3 sm:px-4 md:px-5 space-y-3 sm:space-y-2">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchInput
                  value={inputValue}
                  onChange={onInputChange}
                  debounceMs={0}
                  loading={loading}
                  showClearButton={false}
                  placeholder="Search by name, slug, category..."
                />
              </div>
              <div className="w-full sm:w-64 md:w-56 lg:w-64">
                <CustomSelect
                  value={`${sortField}|${sortOrder}`}
                  onChange={onSortChange}
                  placeholder="Sort"
                  options={[
                    { value: "name|asc", label: "Name (A-Z)" },
                    { value: "name|desc", label: "Name (Z-A)" },
                    { value: "is_active|desc", label: "Active First" },
                    { value: "is_featured|desc", label: "Featured First" },
                  ]}
                />
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3 md:gap-4">
              <CustomSelect
                value={businessTypeFilter}
                onChange={onBusinessTypeChange}
                placeholder="Business Type"
                options={businessTypeOptions.map<SelectOption>((type) => ({
                  value: type,
                  label: type.toUpperCase(),
                }))}
              />
              <CustomSelect
                value={categoryFilter}
                onChange={onCategoryChange}
                placeholder="Category"
                options={categoryOptions.map<SelectOption>((cat) => ({
                  value: cat,
                  label: cat,
                }))}
              />
              <CustomSelect
                value={subCategoryFilter}
                onChange={onSubCategoryChange}
                placeholder="Subcategory"
                options={subCategoryOptions.map<SelectOption>((sub) => ({
                  value: sub,
                  label: sub,
                }))}
              />
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="flex items-center justify-center gap-2 border border-red-500/70 text-red-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-50 hover:border-red-600 hover:text-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 active:scale-[0.98] min-h-[42px] w-full sm:w-auto"
                >
                  <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  <span>Clear all filters</span>
                </button>
              ) : (
                <div className="hidden xl:block" />
              )}
            </div>
          </div>
        </TableControls>
      </div>
    </div>
  );
}