import { useState, useEffect, useMemo } from "react";
import { Building2, Plus, RefreshCw, Search } from "lucide-react";
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

        {/* BUTTONS SECTION - Below title, Switch on LEFT, Add Product on RIGHT */}
        <div className="flex flex-row justify-between items-center gap-3 mt-3 sm:mt-4">
          {/* LEFT SIDE - Switch button (only for super admin) */}
          <div className="flex-shrink-0">
            {isSuperAdmin && (
              <button
                onClick={clearCompany}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm shadow-sm"
              >
                <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Switch
              </button>
            )}
          </div>

          {/* RIGHT SIDE - Add Product button (always on right) */}
          <div className="flex-shrink-0">
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

      <div className="mt-1 px-3 sm:px-5 md:px-6 py-1">
        {/* Unified container - border only on desktop, no border on mobile */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 sm:border sm:border-gray-200 sm:rounded-xl bg-white p-0 sm:p-1.5">
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
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6750A4]/50 focus:border-[#6750A4] bg-white transition-all duration-200 [&:focus]:ring-[#6750A4] [&:focus]:border-[#6750A4]"
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
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]/30 focus:border-[#6750A4] cursor-pointer appearance-none pr-6 sm:pr-7 transition-all duration-200"
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
    </div>
    </>
  );
}
