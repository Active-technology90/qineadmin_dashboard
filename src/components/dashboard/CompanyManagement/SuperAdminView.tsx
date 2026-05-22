import { DataTable, type Column } from "../../ui/DataTable";
import { Pagination } from "../../ui/Pagination";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect } from "../../ui/CustomSelect";
import type { CompanyListItem } from "../../../types";
import { Edit, Trash2, ImageIcon, Filter, SlidersHorizontal, X } from "lucide-react";
import { useState, useEffect } from "react";

interface SuperAdminViewProps {
  paginatedItems: (CompanyListItem & { rowNumber?: number })[];
  columns: Column<CompanyListItem>[];
  loading: boolean;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void; // for DataTable column sorting (desktop)
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (company: CompanyListItem) => void;
  onDelete?: (company: CompanyListItem) => void;
  // Mobile filter props
  inputValue: string;
  onInputChange: (value: string) => void;
  onSortChange: (value: string) => void; // mobile sort callback
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
  // mobile filters
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
  hasActiveFilters,
  onClearAll,
}: SuperAdminViewProps) {
  // ------ Mobile filter sheet state ------
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempBusinessType, setTempBusinessType] = useState(businessTypeFilter);
  const [tempCategory, setTempCategory] = useState(categoryFilter);
  const [tempSubCategory, setTempSubCategory] = useState(subCategoryFilter);
  const [tempSort, setTempSort] = useState(`${sortField}|${sortOrder}`);

  // Active filter count for mobile badge
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
    if (val === "is_active|desc") return "Active first";
    if (val === "is_featured|desc") return "Featured first";
    return "Sort";
  })();

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [sheetOpen]);

  // Sync temp state with current filters when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      setTempBusinessType(businessTypeFilter);
      setTempCategory(categoryFilter);
      setTempSubCategory(subCategoryFilter);
      setTempSort(`${sortField}|${sortOrder}`);
    }
  }, [
    sheetOpen,
    businessTypeFilter,
    categoryFilter,
    subCategoryFilter,
    sortField,
    sortOrder,
  ]);

  const applyFilters = () => {
    if (tempSort !== `${sortField}|${sortOrder}`) onSortChange(tempSort);
    if (tempBusinessType !== businessTypeFilter)
      onBusinessTypeChange(tempBusinessType);
    if (tempCategory !== categoryFilter) onCategoryChange(tempCategory);
    if (tempSubCategory !== subCategoryFilter)
      onSubCategoryChange(tempSubCategory);
    setSheetOpen(false);
  };

  const clearAll = () => {
    onClearAll();
    setSheetOpen(false);
  };

  // ------ Existing helpers ------
  const renderStatusBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none shadow-sm ${
        isActive
          ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200"
          : "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"} mr-1.5`}></span>
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

  const CardSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-3/4" />
          <div className="h-3.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-3.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-full" />
        <div className="h-3.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-5/6" />
        <div className="flex gap-3 mt-3">
          <div className="h-7 w-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full" />
          <div className="h-7 w-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ============ DESKTOP / TABLET (same as before) ============ */}
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
        <div className="px-4 pt-4 pb-2">
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
          <div className="space-y-4 px-4">
            {[...Array(5)].map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
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

        {/* ===== STICKY BOTTOM FILTER BAR (mobile) ===== */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 px-4 py-3 safe-bottom flex gap-3">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100/90 rounded-2xl py-3 text-sm font-semibold text-gray-700 active:scale-95 transition-all"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#6750A4] text-white text-[10px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100/90 rounded-2xl py-3 text-sm font-semibold text-gray-700 active:scale-95 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {sortLabel}
          </button>
        </div>

        {/* ===== BOTTOM SHEET OVERLAY ===== */}
        {/* Backdrop */}
        <div
          className={`
            fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm
            transition-opacity duration-300 ease-out
            ${sheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
          `}
          onClick={() => setSheetOpen(false)}
          aria-hidden="true"
        />

        {/* Sheet */}
        <div
          className={`
            fixed bottom-0 left-0 right-0 z-[130] flex flex-col bg-white
            rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden
            transform transition-all duration-300 ease-out
            ${sheetOpen ? "translate-y-0 scale-100" : "translate-y-full scale-95"}
          `}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filters & Sort</h3>
              {/* Active filter chips */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tempBusinessType !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {tempBusinessType.toUpperCase()}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setTempBusinessType("all")}
                    />
                  </span>
                )}
                {tempCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {tempCategory}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setTempCategory("all")} />
                  </span>
                )}
                {tempSubCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {tempSubCategory}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setTempSubCategory("all")} />
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-6 py-3 space-y-5">
            {/* Sort section – compact radio style */}
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

            {/* Filters – CustomSelect dropdowns */}
            <div className="space-y-12 px-2">
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

            <div className="h-2" />
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-white p-4 flex gap-3 flex-shrink-0 safe-bottom">
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
          </div>
        </div>
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