// src/components/admin/SuperAdminView.tsx
import { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { DataTable, type Column } from "../../ui/DataTable";
import { Pagination } from "../../ui/Pagination";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect } from "../../ui/CustomSelect";
import type { CompanyListItem } from "../../../types";

// ---- shared components ----
import MobileCardSkeleton from "../../ui/MobileCardSkeleton";
import MobileActionBar from "../../ui/MobileActionBar";
import BottomSheet from "../../ui/BottomSheet";

interface SuperAdminViewProps {
  paginatedItems: (CompanyListItem & { rowNumber?: number })[];
  columns: Column<CompanyListItem>[];
  loading: boolean;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (company: CompanyListItem) => void;
  onDelete?: (company: CompanyListItem) => void;
  // Mobile filter props
  inputValue: string;
  onInputChange: (value: string) => void;
  onSortChange: (value: string) => void;
  businessTypeFilter: string;
  onBusinessTypeChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  subCategoryFilter: string;
  onSubCategoryChange: (value: string) => void;
  businessTypeOptions: string[];
  categoryOptions: string[];
  subCategoryOptions: string[];
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export default function SuperAdminView({
  paginatedItems,
  columns,
  loading,
  sortField,
  sortOrder,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  inputValue,
  onInputChange,
  onSortChange,
  businessTypeFilter,
  onBusinessTypeChange,
  categoryFilter,
  onCategoryChange,
  subCategoryFilter,
  onSubCategoryChange,
  businessTypeOptions,
  categoryOptions,
  subCategoryOptions,

  onClearAll,
}: SuperAdminViewProps) {
  // ---- Mobile filter sheet ----
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempBusinessType, setTempBusinessType] = useState(businessTypeFilter);
  const [tempCategory, setTempCategory] = useState(categoryFilter);
  const [tempSubCategory, setTempSubCategory] = useState(subCategoryFilter);
  const [tempSort, setTempSort] = useState(`${sortField}|${sortOrder}`);

  // Active filter badge count
  const activeFilterCount = [
    businessTypeFilter !== "all",
    categoryFilter !== "all",
    subCategoryFilter !== "all",
    inputValue.trim() !== "",
  ].filter(Boolean).length;

  const sortLabel = (() => {
    const val = `${sortField}|${sortOrder}`;
    if (val === "name|asc") return "Name A-Z";
    if (val === "name|desc") return "Name Z-A";
    if (val === "is_active|desc") return "Active First";
    if (val === "is_featured|desc") return "Featured First";
    return "Sort";
  })();

  // Sync temp state when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      setTempBusinessType(businessTypeFilter);
      setTempCategory(categoryFilter);
      setTempSubCategory(subCategoryFilter);
      setTempSort(`${sortField}|${sortOrder}`);
    }
  }, [sheetOpen, businessTypeFilter, categoryFilter, subCategoryFilter, sortField, sortOrder]);

  const applyFilters = () => {
    if (tempSort !== `${sortField}|${sortOrder}`) onSortChange(tempSort);
    if (tempBusinessType !== businessTypeFilter) onBusinessTypeChange(tempBusinessType);
    if (tempCategory !== categoryFilter) onCategoryChange(tempCategory);
    if (tempSubCategory !== subCategoryFilter) onSubCategoryChange(tempSubCategory);
    setSheetOpen(false);
  };

  const clearAll = () => {
    onClearAll();
    setSheetOpen(false);
  };

  // ---- card helpers ----
  const renderStatusBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none shadow-sm ${
        isActive
          ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200"
          : "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"} mr-1.5`} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  const renderFeaturedBadge = (isFeatured: boolean) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none shadow-sm ${
        isFeatured
          ? "bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-700 border border-blue-200"
          : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border border-gray-200"
      }`}
    >
      {isFeatured ? (
        <>
          <svg className="w-3 h-3 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Featured
        </>
      ) : (
        "Not Featured"
      )}
    </span>
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ============ DESKTOP / TABLET ============ */}
      <div className="hidden md:block">
        <DataTable
          data={paginatedItems}
          columns={columns}
          loading={loading}
          emptyMessage="No companies found"
          onEdit={onEdit}
          onDelete={onDelete}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="block md:hidden">
        {/* Search */}
        <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-2">
          <SearchInput
            value={inputValue}
            onChange={onInputChange}
            debounceMs={0}
            loading={loading}
            showClearButton={false}
            placeholder="Search companies..."
            className="rounded-2xl shadow-sm border-gray-100 focus:ring-2 focus:ring-[#6750A4]/30"
          />
        </div>

        {/* Cards */}
        {loading ? (
          <MobileCardSkeleton count={5} />
        ) : paginatedItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-10 text-center mx-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-gray-500 font-medium">No companies found</h3>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add a new company</p>
          </div>
        ) : (
          <div className="space-y-4 px-2 pb-4">
            {paginatedItems.map((company, idx) => (
              <div
                key={company.id ?? idx}
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {company.logo ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#6750A4]/20 to-transparent rounded-full blur-sm"></div>
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="relative w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                          <ImageIcon size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate leading-tight">
                        {company.name}
                      </h3>
                      <p className="text-xs font-mono text-gray-500 truncate mt-0.5 tracking-tight">
                        {company.slug}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-1.5">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(company)}
                          className="p-2.5 text-blue-600 hover:text-blue-800 rounded-xl hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200 active:scale-95"
                          aria-label="Edit company"
                        >
                          <Edit className="h-4.5 w-4.5" strokeWidth={1.75} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(company)}
                          className="p-2.5 text-red-600 hover:text-red-800 rounded-xl hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all duration-200 active:scale-95"
                          aria-label="Delete company"
                        >
                          <Trash2 className="h-4.5 w-4.5" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Category</span>
                      <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{company.category_name}</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Subcategory</span>
                      <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{company.sub_category_name}</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Business Type</span>
                      <p className="text-sm font-semibold text-gray-800 uppercase truncate mt-0.5">{company.business_type || "—"}</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Row Number</span>
                      <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">#{company.rowNumber ?? "—"}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                    {renderStatusBadge(company.is_active)}
                    {renderFeaturedBadge(company.is_featured)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== MOBILE STICKY BOTTOM BAR ========== */}
        <MobileActionBar
          activeFilterCount={activeFilterCount}
          sortLabel={sortLabel}
          onOpenFilters={() => setSheetOpen(true)}
          onOpenSort={() => setSheetOpen(true)}
          showFilterButton={true}
        />

        {/* ========== FILTER & SORT BOTTOM SHEET ========== */}
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Filters & Sort"
          maxHeight="70vh"
          footer={
            <>
              <button
                onClick={clearAll}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 active:scale-[0.98] transition-all"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 h-12 rounded-2xl bg-[#6750A4] text-sm font-semibold text-white shadow-lg shadow-[#6750A4]/20 active:scale-[0.98] transition-all"
              >
                Apply Filters
              </button>
            </>
          }
        >
          <div className="space-y-12 px-2">
            {/* Sort section */}
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "name|asc", label: "Name A-Z" },
                  { value: "name|desc", label: "Name Z-A" },
                  { value: "is_active|desc", label: "Active First" },
                  { value: "is_featured|desc", label: "Featured First" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTempSort(opt.value)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                      tempSort === opt.value
                        ? "bg-[#6750A4] text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Business Type */}
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
                Business Type
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#6750A4] border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : businessTypeOptions.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">No types available</p>
              ) : (
                <CustomSelect
                  value={tempBusinessType}
                  onChange={setTempBusinessType}
                  placeholder="All types"
                  options={[
                    { value: "all", label: "All" },
                    ...businessTypeOptions.map((type) => ({
                      value: type,
                      label: type.toUpperCase(),
                    })),
                  ]}
                  className="w-full"
                />
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
                Category
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#6750A4] border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : categoryOptions.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">No categories available</p>
              ) : (
                <CustomSelect
                  value={tempCategory}
                  onChange={setTempCategory}
                  placeholder="All categories"
                  options={[
                    { value: "all", label: "All" },
                    ...categoryOptions.map((cat) => ({ value: cat, label: cat })),
                  ]}
                  className="w-full"
                />
              )}
            </div>

            {/* Subcategory */}
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
                Subcategory
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#6750A4] border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : subCategoryOptions.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">No subcategories available</p>
              ) : (
                <CustomSelect
                  value={tempSubCategory}
                  onChange={setTempSubCategory}
                  placeholder="All subcategories"
                  options={[
                    { value: "all", label: "All" },
                    ...subCategoryOptions.map((sub) => ({ value: sub, label: sub })),
                  ]}
                  className="w-full"
                />
              )}
            </div>
          </div>
        </BottomSheet>
      </div>

      {/* Pagination */}
      <div className="pt-2 sm:pt-3">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      <style>{`
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 1rem);
        }
      `}</style>
    </div>
  );
}