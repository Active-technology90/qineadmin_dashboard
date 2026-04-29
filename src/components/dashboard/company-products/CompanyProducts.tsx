import { useState, useMemo } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useCompanySelection } from '../../../hooks/useCompanySelection';
import { useCompanyProducts } from '../../../hooks/useCompanyProducts';
import { CompanySelector } from './CompanySelector';
import { ProductTable } from './ProductTable';
import { ProductModal } from './ProductModal';
import { DeleteConfirmModal } from '../../ui/DeleteConfirmModal';
import { Toast } from '../../ui/Toast';
import { Pagination } from '../../ui/Pagination';
import { ErrorView } from '../../ui/ErrorView';
import { NoCompanyView } from './NoCompanyView';

export default function CompanyProducts() {
  const { user } = useAuth();

  const {
    selectedCompany,
    showSelector,
    companies,
    isLoadingCompanies,
    selectCompany,
    resetCompany,
  } = useCompanySelection(user);

  const companySlug = selectedCompany?.slug ?? null;
  const companyName = selectedCompany?.name ?? '';

  // ----------------------------------------------------------------------
  // Role-based permissions for the selected company
  // ----------------------------------------------------------------------
  const userRoleForCompany = useMemo(() => {
    if (!user || !companySlug) return null;
    // Super admin has no memberships -> treat as admin
    if (!user.memberships?.length) return 'admin';
    const membership = user.memberships.find(
      (m: any) => m.company_slug === companySlug
    );
    return membership?.role || null;
  }, [user, companySlug]);

  const isSuperAdmin = !user?.memberships?.length;
  const isAdmin = userRoleForCompany === 'admin' || isSuperAdmin;
  const isStaff = userRoleForCompany === 'staff';

  // Staff can edit everything except price/stock
  const canEditBasic = isAdmin || isStaff;      // SKU, title, unit, images
  const canEditPricing = isAdmin;               // price and stock
  const canDelete = isAdmin;                    // delete whole product

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
  } = useCompanyProducts({ companySlug, pageSize: 10 });

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Actions with permission guards
  const handleAdd = () => {
    if (!canEditBasic) {
      showToast('error', 'You do not have permission to add products');
      return;
    }
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: any) => {
    // Editing requires at least basic edit permission
    if (!canEditBasic) {
      showToast('error', 'You do not have permission to edit products');
      return;
    }
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!canDelete) {
      showToast('error', 'You do not have permission to delete products');
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteProduct(deleteTarget.id);
      showToast('success', 'Product deleted');
    } catch {
      showToast('error', 'Delete failed');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSave = async (data: any) => {
    if (!canEditBasic && editingProduct === null) {
      showToast('error', 'You do not have permission to create products');
      throw new Error('Permission denied');
    }
    if (!canEditBasic && editingProduct !== null) {
      showToast('error', 'You do not have permission to edit products');
      throw new Error('Permission denied');
    }
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        showToast('success', 'Product updated');
        return { id: editingProduct.id };
      } else {
        const created = await createProduct(data);
        showToast('success', 'Product created');
        return created;
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Save failed');
      throw err;
    }
  };

  // Render guards
  if (showSelector) {
    return (
      <CompanySelector
        companies={companies}
        isLoading={isLoadingCompanies}
        onSelect={selectCompany}
        onBack={resetCompany}
      />
    );
  }

  if (error && !companySlug) {
    return <ErrorView error={error} onRetry={refetch} />;
  }

  if (!companySlug) {
    return <NoCompanyView onSelectCompany={resetCompany} />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <Toast toast={toast} />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ''}
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
        canEditBasic={canEditBasic}
        canEditPricing={canEditPricing}
      />

      <div className="p-6 border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Company Products
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage catalog for{' '}
              <span className="text-indigo-600 font-medium">
                {companyName}
              </span>
            </p>
            {!canEditBasic && (
              <p className="text-xs text-amber-600 mt-1">
                View only – you don't have edit permissions for this company.
              </p>
            )}
            {canEditBasic && !canEditPricing && (
              <p className="text-xs text-blue-600 mt-1">
                You can edit product details but not price or stock.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {isSuperAdmin && (
              <button
                onClick={resetCompany}
                className="px-4 py-2 rounded-full border text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Switch
              </button>
            )}

            {canEditBasic && (
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-full bg-secondary text-white hover:bg-secondary flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="p-6">
        <ProductTable
          products={products}
          totalItems={totalItems}
          loading={loading}
          onEdit={canEditBasic ? handleEdit : undefined}
          onDelete={canDelete ? (id, title) => setDeleteTarget({ id, title }) : undefined}
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