// src/components/admin/CompanyManagement/CompanyFilters.tsx
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
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">

      {/* ================= MOBILE (ONLY SEARCH, NO TABLE CONTROLS) ================= */}
      <div className="block md:hidden px-3 py-3">
        <SearchInput
          value={inputValue}
          onChange={onInputChange}
          debounceMs={0}
          loading={loading}
          showClearButton={false}
          placeholder="Search..."
        />
      </div>

      {/* ================= TABLET + DESKTOP ================= */}
      <div className="hidden md:block">
        <TableControls pageSize={pageSize} onPageSizeChange={onPageSizeChange}>
          <div className="w-full py-3 space-y-3">

            {/* SEARCH + SORT (TABLET LAYOUT) */}
            <div className="flex flex-col lg:flex-row gap-3 w-full">
              <div className="flex-1">
                <SearchInput
                  value={inputValue}
                  onChange={onInputChange}
                  debounceMs={0}
                  loading={loading}
                  showClearButton={false}
                  placeholder="Search by name, slug, category..."
                />
              </div>

              <div className="w-full lg:w-56">
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

            {/* FILTER GRID (ONLY DESKTOP LARGE SCREENS) */}
            <div className="hidden lg:grid grid-cols-2 xl:grid-cols-5 gap-3">

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
                  className="flex items-center justify-center gap-1.5 border border-red-500 text-red-500 rounded-xl px-4 py-2 text-sm hover:bg-red-50 min-h-[42px]"
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
      </div>

    </div>
  );
}