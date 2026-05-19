import { useState, useMemo } from "react";
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
import { TableControls } from "../../ui/TableControls";
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
    const foundCompany = companies.find((c: CompanyListItem) => c.slug === companySlug);
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
  } = useCompanyProducts({ companySlug });

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
        return { id: existingProductId };
      }
      // Normal edit mode
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        showToast("success", "Updated");
        return { id: editingProduct.id };
      } else {
        const created = await createProduct(data);
        showToast("success", "Created");
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
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

      <div className="px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {isSuperAdmin ? (
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <Building2 className="w-8 h-8 text-gray-400" />
            )}
            <div>
              <h2 className="text-2xl font-extrabold text-secondary tracking-tight">{companyName}</h2>
              {/* <p className="text-2xl font-extrabold text-secondary tracking-tight">All Products</p> */}
            </div>
          </div>
        ) : (
           <div>
              {/* <h2 className="text-2xl font-extrabold text-secondary tracking-tight">{companyName}</h2> */}
              <p className="text-2xl font-extrabold text-secondary tracking-tight">All Products</p>
            </div>
        )}
          <div className="flex gap-3 ">
            {isSuperAdmin && (
              <button
                onClick={clearCompany}
                className="px-4 py-2 rounded-full border text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Switch
              </button>
            )}
            {canEditBasic && (
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-full mt-2  bg-secondary text-white hover:bg-secondary flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Product
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-1 px-6 py-1">
        <TableControls
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              type="search"
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-[#6750A4]"
            />
          </div>
        </TableControls>
      </div>

      <div className="px-6 py-2">
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
