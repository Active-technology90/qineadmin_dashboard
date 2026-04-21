import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Edit, Trash2, Search, Loader2, Building2, 
  ChevronLeft, ChevronRight, Package, X, AlertCircle, ArrowLeft, RefreshCw
} from 'lucide-react';
import { getCompanyProducts, createCompanyProduct, updateCompanyProduct, deleteCompanyProduct, getCompanies } from '../../services/api';
import type { CompanyProductListItem, CompanyListItem } from '../../types';
import { useAuth } from '../../context/authContext';

interface Product {
  id: number;
  sku: string;
  title: string;
  price: number;
  stock: number;
  unit: string;
}

export default function CompanyProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    title: '',
    price: '',
    stock: '',
    unit: 'pc',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Company selection state
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string | null>(null);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Determine company slug from user or localStorage
  useEffect(() => {
      const membershipSlug = user?.memberships?.[0]?.company_slug;
      
    if (membershipSlug) {
      setSelectedCompanySlug(membershipSlug);
      setShowCompanySelector(false);
    } else {
      const stored = localStorage.getItem('selected_company_slug');
      if (stored) {
        setSelectedCompanySlug(stored);
      } else {
        fetchCompanies();
      }
    }
  }, [user]);

  const fetchCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
        const response = await getCompanies({ page: 1 });
        console.log('Fetched companies:', response.data);
      const companyList = response.data.results || [];
      setCompanies(companyList);
      if (companyList.length === 1) {
        setSelectedCompanySlug(companyList[0].slug);
        localStorage.setItem('selected_company_slug', companyList[0].slug);
        setShowCompanySelector(false);
      } else if (companyList.length > 1) {
        setShowCompanySelector(true);
      } else {
        setError('No companies found. Please contact support.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError('Could not load companies. Please try again.');
      setLoading(false);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleSelectCompany = (slug: string) => {
    setSelectedCompanySlug(slug);
    localStorage.setItem('selected_company_slug', slug);
    setShowCompanySelector(false);
    setError(null);
    setCurrentPage(1);
    setSearch('');
    showToast('success', `Switched to ${companies.find(c => c.slug === slug)?.name}`);
  };

  const handleBackToCompanies = () => {
    // Clear stored selection and show company selector again
    localStorage.removeItem('selected_company_slug');
    setSelectedCompanySlug(null);
    fetchCompanies(); // refresh list in case it changed
  };

  const handleChangeCompany = () => {
    // Allow user to choose a different company
    fetchCompanies();
  };

  const companySlug = selectedCompanySlug;

  // Fetch products with pagination and search
  const fetchProducts = useCallback(async () => {
    if (!companySlug) return;
    try {
      setLoading(true);
      const response = await getCompanyProducts(companySlug, {
        page: currentPage,
        search: debouncedSearch || undefined,
      });
        console.log('API response:', response);
      const items = response.data.results || [];
      const mapped = items.map((item: CompanyProductListItem) => ({
        id: item.id,
        sku: item.sku || '',
        title: item.title,
        price: parseFloat(item.price),
        stock: item.stock,
        unit: item.unit || 'pc',
      }));
      setProducts(mapped);
      setTotalPages(Math.ceil(response.data.count / 10));
      setTotalItems(response.data.count);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Could not load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [companySlug, currentPage, debouncedSearch]);

  useEffect(() => {
    if (companySlug) {
      fetchProducts();
    } else if (!showCompanySelector && !user?.memberships?.length && !error) {
      setError('No company associated. Please select a company.');
    }
  }, [companySlug, currentPage, debouncedSearch, fetchProducts]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Price must be greater than 0';
    if (!formData.stock || parseInt(formData.stock) < 0) errors.stock = 'Stock cannot be negative';
    if (!formData.unit) errors.unit = 'Unit is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({ sku: '', title: '', price: '', stock: '', unit: 'pc' });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      title: product.title,
      price: product.price.toString(),
      stock: product.stock.toString(),
      unit: product.unit,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId: number, productTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${productTitle}"? This action cannot be undone.`)) return;
    try {
      await deleteCompanyProduct(companySlug!, productId);
      showToast('success', 'Product deleted successfully');
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      showToast('error', 'Could not delete product. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = {
        sku: formData.sku,
        title: formData.title,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        unit: formData.unit,
      };
      if (editingProduct) {
        await updateCompanyProduct(companySlug!, editingProduct.id, payload);
        showToast('success', 'Product updated successfully');
      } else {
        await createCompanyProduct(companySlug!, payload);
        showToast('success', 'Product created successfully');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      const message = err.response?.data?.detail || 'Could not save product. Please try again.';
      showToast('error', message);
    }
  };

  const filteredProducts = useMemo(() => products, [products]);

  // ======================= RENDER STATES =======================
  if (loading && !showCompanySelector) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  if (showCompanySelector) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToCompanies}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Select Your Company</h2>
        </div>
        {isLoadingCompanies ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map(company => (
              <button
                key={company.id}
                onClick={() => handleSelectCompany(company.slug)}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md"
              >
                <Building2 className="h-5 w-5 text-indigo-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{company.name}</p>
                  <p className="text-sm text-gray-500">{company.business_type || 'Company'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main product list view
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.type === 'success' ? <Package className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header with Company Info and Change Company Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Products</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your product catalog
            {companySlug && (
              <span className="ml-2 text-indigo-600">– {companySlug.replace(/-/g, ' ')}</span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleChangeCompany}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <RefreshCw className="h-4 w-4" /> Change Company
          </button>
          <button
            onClick={handleAddProduct}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by SKU or product name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-gray-500">
        {totalItems > 0 ? `Showing ${products.length} of ${totalItems} products` : 'No products found'}
      </div>

      {/* Product Table */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Package className="h-12 w-12 text-gray-300" />
          <p className="text-gray-500 text-center">No products found</p>
          <button
            onClick={handleAddProduct}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Add your first product
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (ETB)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.price.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.title)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal for Add/Edit Product */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className={`w-full border ${formErrors.sku ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500`}
                />
                {formErrors.sku && <p className="text-red-500 text-xs mt-1">{formErrors.sku}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full border ${formErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500`}
                />
                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={`w-full border ${formErrors.price ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500`}
                />
                {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className={`w-full border ${formErrors.stock ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500`}
                />
                {formErrors.stock && <p className="text-red-500 text-xs mt-1">{formErrors.stock}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={`w-full border ${formErrors.unit ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500`}
                >
                  <option value="pc">Piece (pc)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="l">Liter (l)</option>
                  <option value="m">Meter (m)</option>
                </select>
                {formErrors.unit && <p className="text-red-500 text-xs mt-1">{formErrors.unit}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}