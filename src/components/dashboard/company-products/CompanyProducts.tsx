import { useState, useEffect, useMemo } from "react";
import { Building2, Plus, RefreshCw, Search, X } from "lucide-react";
// import type { CompanyListItem } from "../../../types";
import { useAuth } from "../../../context/authContext";
// import { useCompanySelection } from '../../../hooks/useCompanySelection';
import { useCompanyProducts } from "../../../hooks/useCompanyProducts";
import { CompanySelector } from "./CompanySelector";
import { ProductTable } from "./ProductTable";
import { ProductModal } from "./ProductModal";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { ErrorView } from "../../ui/ErrorView";
// import { NoCompanyView } from './NoCompanyView';
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";

export default function CompanyProducts() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";
  // Get logo from companies list (since CurrentCompany doesn't have logo)
  const companyLogo = useMemo(() => {
    if (!companySlug || !companies.length) return null;
    const foundCompany = companies.find((c: any) => c.slug === companySlug);
    return foundCompany?.logo || null;
  }, [companySlug, companies]);

  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  // Derive correct role for the selected company from user memberships
  const companyRole = useMemo(() => {
    if (!user || !companySlug) return "";
    if (isSuperAdmin) return "admin";
    const membership = user.memberships?.find(
      (m: any) => m.company_slug === companySlug,
    );
    return membership?.role || "";
  }, [user, companySlug, isSuperAdmin]);

  // Role‑based permissions
  const isAdmin = companyRole === "admin" || isSuperAdmin;
  const isStaff = companyRole === "staff";
  const canEditBasic = isAdmin || isStaff;
  // const canEditPricing = isAdmin;
  const canDelete = isAdmin;

  // Products hook
  const [pageSize, setPageSize] = useState(10);
  const {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    search,
    setSearch,
    setCurrentPage,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch,
  } = useCompanyProducts({ companySlug, pageSize });
  // Debug: log when pageSize changes
  useEffect(() => {
    console.log("Page size changed to:", pageSize);
    setCurrentPage(1);
    setTimeout(() => {
      refetch();
    }, 100);
  }, [pageSize]);

  // Modals & toast
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [toastZIndex, setToastZIndex] = useState(50);
    const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Increase toast z-index when modal is open
  const showToastWithHigherZIndex = (type: "success" | "error", message: string) => {
    setToastZIndex(100); // Higher z-index for modal visibility
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
      setToastZIndex(50); // Reset to normal after toast disappears
    }, 3000);
  };

  // Handlers with permission checks (unchanged except we now use `companyRole`)
  const handleAdd = () => {
    if (!canEditBasic) {
      showToast("error", "No permission");
      return;
    }
    setEditingProduct(null);
    setIsModalOpen(true);
  };
  const handleEdit = (product: any) => {
    if (!canEditBasic) {
      showToast("error", "No permission");
      return;
    }
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!canDelete) {
      showToast("error", "No permission");
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteProduct(deleteTarget.id);
      showToast("success", "Product deleted");
    } catch {
      showToast("error", "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };
  const handleSave = async (data: any, existingProductId?: number) => {
    // Permission checks...
    try {
      // If we have an existingProductId passed from modal (for update after back button)
      if (existingProductId) {
        await updateProduct(existingProductId, data);
        showToast("success", "Updated");
        await refetch(); // Refresh the product list
        return { id: existingProductId };
      }
      // Normal edit mode
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        showToast("success", "Updated");
        await refetch(); // Refresh the product list
        return { id: editingProduct.id };
      } else {
        const created = await createProduct(data);
        showToast("success", "Created");
        await refetch(); // Refresh the product list for new product
        return created;
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.detail || "Save failed");
      throw err;
    }
  };

  // ----- Render -----
  if (showSelector) {
    return (
      <CompanySelector
        companies={companies} // ✅ now populated
        isLoading={isLoadingCompanies}
        title="All Products"
        searchPlaceholder="Search products and companies by name..."
        onSelect={(slug, name) => {
          // If the user has NO memberships, they are a super admin → role = "admin"
          const membership = user?.memberships?.find(
            (m: any) => m.company_slug === slug,
          );
          const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");
          switchCompany({ slug, name, role });
        }}
        onBack={clearCompany}
      />
    );
  }

  if (error && !companySlug)
    return <ErrorView error={error} onRetry={refetch} />;
  if (!companySlug)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        No company selected. Please select one to manage products.
      </div>
    );

  // Normal content (identical to your last version)
  return (
    <>
      <Toast toast={toast} zIndex={toastZIndex} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ProductModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        companySlug={companySlug}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onProductUpdated={refetch}
        // Staff: can edit everything on create, but price/stock read‑only on edit
        isStaff={companyRole === "staff"}
        canEditBasic={canEditBasic} // true for staff & admin
        canEditPricing={true} // let the isStaff logic handle edit restriction
        onShowToast={showToastWithHigherZIndex}
      />

      <div className="px-3 sm:px-5 md:px-6">
        {/* TITLE SECTION - Full width on top */}
        <div className="w-full">
          {isSuperAdmin ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-6 h-6 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <Building2 className="w-5 h-5 sm:w-8 sm:h-8 text-gray-400" />
              )}
              <div>
                <h2 className="text-sm sm:text-2xl font-extrabold text-secondary tracking-tight break-words">{companyName}</h2>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm sm:text-2xl font-extrabold text-secondary tracking-tight break-words">All Products</p>
            </div>
          )}
        </div>

        {/* BUTTONS SECTION - Switch on LEFT (mobile) / BOTH on RIGHT (desktop) */}
        <div className="flex flex-row justify-between lg:justify-end items-center gap-3 mt-3 sm:mt-4">
          {/* LEFT SIDE - Switch button (visible on mobile, hidden on desktop) */}
          <div className="flex-shrink-0 lg:hidden">
            {isSuperAdmin && (
              <button
                onClick={clearCompany}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border-2 border-secondary bg-white text-secondary hover:bg-secondary/5 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm transition-all"
              >
                <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary" /> Switch
              </button>
            )}
          </div>

          {/* RIGHT SIDE - Switch (desktop only) + Add Product button */}
          <div className="flex items-center gap-3">
            {/* Desktop Switch button - secondary outline style */}
            <div className="hidden lg:block">
              {isSuperAdmin && (
                <button
                  onClick={clearCompany}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border-2 border-secondary bg-white text-secondary hover:bg-secondary/5 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm transition-all"
                >
                  <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary" /> Switch
                </button>
              )}
            </div>
          {/* RIGHT SIDE - Switch (desktop only) + Add Product button */}
          <div className="flex items-center gap-3">
            {/* Desktop Switch button - hidden on mobile */}
            <div className="hidden lg:block">
              {isSuperAdmin && (
                <button
                  onClick={clearCompany}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm shadow-sm"
                >
                  <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Switch
                </button>
              )}
            </div>
            
            {/* Mobile Add Product button - filter style */}
            <div className="lg:hidden">
              {canEditBasic && (
                <button
                  onClick={handleAdd}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border-2 border-secondary bg-white text-secondary hover:bg-secondary/5 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm transition-all"
                >
                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary" /> Add Product
                </button>
              )}
            </div>
            
            {/* Desktop Add Product button - original style */}
            <div className="hidden lg:block">
              {canEditBasic && (
                <button
                  onClick={handleAdd}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-secondary text-white hover:bg-secondary flex items-center gap-1 sm:gap-1.5 shadow-sm text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Add Product
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="mt-1 px-3 sm:px-5 md:px-6 py-1">
        {/* Unified container - border only on desktop, hidden on mobile */}
        <div className="hidden lg:flex flex-row items-center justify-between gap-2 sm:gap-3 sm:border sm:border-gray-200 sm:rounded-xl bg-white p-0 sm:p-1.5">
          {/* LEFT SIDE - Search (reduced width on mobile) */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <input
              value={search}
              type="search"
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary bg-white transition-all duration-200 [&:focus]:ring-secondary [&:focus]:border-secondary"
              style={{ outline: "none" }}
            />
          </div>

          {/* RIGHT SIDE - Custom Page Size Selector (reduced size) */}
          <div className="flex-shrink-0">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary cursor-pointer appearance-none pr-6 sm:pr-7 transition-all duration-200"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1rem",
              }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
              <option value={60}>60 / page</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-5 md:px-6 py-2">
        <ProductTable
          products={products}
          totalItems={totalItems}
          loading={loading}
          onEdit={canEditBasic ? handleEdit : undefined}
          onDelete={
            canDelete
              ? (id, title) => setDeleteTarget({ id, title })
              : undefined
          }
        />
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              
            />
          </div>
        )}
      </div>
            {/* Mobile Filter Button - Bottom Left (only visible on mobile) */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-5 left-5 z-40 lg:hidden flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white border-2 border-secondary shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <div className="relative">
          <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {(search || pageSize !== 10) && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </div>
        <span className="text-sm font-bold tracking-wide text-secondary">Filter</span>
        {(search || pageSize !== 10) && (
          <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-secondary/10 text-secondary rounded-full">
            Active
          </span>
        )}
      </button>

      {/* Mobile Filter Modal - Bottom Sheet */}
      {showMobileFilterModal && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setShowMobileFilterModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Bottom Sheet Content */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-secondary">Filters</h3>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-secondary focus:shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Page Size */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Items per page
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-secondary focus:shadow-sm transition-all"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={15}>15 / page</option>
                  <option value={30}>30 / page</option>
                  <option value={60}>60 / page</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {(search || pageSize !== 10) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setPageSize(10);
                      setCurrentPage(1);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowMobileFilterModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
