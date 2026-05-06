import { useState, useMemo } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
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

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
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
  const handleSave = async (data: any) => {
    // Permission checks...
    try {
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <Toast toast={toast} />
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
      />

      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#6750A4]">
              Company Products
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage catalog for{" "}
              <span className="text-indigo-600 font-medium">{companyName}</span>
            </p>
          </div>
          <div className="flex gap-3">
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
                className="px-4 py-2 rounded-full bg-secondary text-white hover:bg-secondary flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5">
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

      <div className="p-6">
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
  );
}
