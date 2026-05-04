// src/components/admin/CompanyManagement.tsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Plus, ImageIcon } from "lucide-react";
import api from "../../services/api";
import {
  createCompany,
  updateCompany,
  deleteCompany,
  getCategories,
  getSubCategories,
  getCompanyDetail,
} from "../../services/api";
import type { CompanyListItem, Category, SubCategory, Company } from "../../types";
import { SearchInput } from "../ui/SearchInput";
import { DataTable, type Column } from "../ui/DataTable";
import { MultiStepFormModal, type FormStep } from "../ui/MultiStepFormModal";
import { DragDropImageUpload } from "../ui/DragDropImageUpload";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { ErrorView } from "../ui/ErrorView";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { usePagination } from "../../hooks/usePagination";
import { Pagination } from "../ui/Pagination";
import { useSorting } from "../../hooks/useSorting";
import { useAuth } from "../../hooks/useAuth";
import { TableControls } from "../ui/TableControls";

// Memoised sub‑components to prevent re‑renders
const MemoizedDataTable = React.memo(DataTable);
const MemoizedPagination = React.memo(Pagination);

type PaginatedResponse<T> = {
  results: T[];
  next: string | null;
};

// Helper to get the highest‑privilege membership (admin > staff > delivery > viewer)
const getPrimaryMembership = (memberships: any[] | undefined) => {
  if (!memberships?.length) return null;
  const priority: Record<string, number> = { admin: 4, staff: 3, delivery: 2, viewer: 1 };
  let best = memberships[0];
  let bestScore = priority[best.role] || 0;
  for (const m of memberships) {
    const score = priority[m.role] || 0;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
};

export default function CompanyManagement() {
  const [pageSize, setPageSize] = useState(10);
  const { user } = useAuth();

  // Permission flags
  const isSuperAdmin = !user?.memberships?.length;
  const memberships = user?.memberships ?? [];
  const primaryMembership = !isSuperAdmin ? getPrimaryMembership(memberships) : null;
  const userCompanySlug = primaryMembership?.company_slug ?? null;
  const userCompanyRole = primaryMembership?.role ?? null;

  const canAddCompany = isSuperAdmin;
  const canDeleteCompany = isSuperAdmin;
  const canEditCompany = (companySlug: string) => {
    if (isSuperAdmin) return true;
    return userCompanyRole === "admin" && userCompanySlug === companySlug;
  };

  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----- DEBOUNCED SEARCH -----
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchTerm(value);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ----- MODAL STATE -----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_am: "",
    slug: "",
    category: 0,
    sub_category: 0,
    business_type: "",
    description: "",
    is_active: true,
    is_featured: false,
    logo: null as File | null,
    cover_image: null as File | null,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyListItem | null>(null);
  const { toast, showToast } = useToast();

  // --- Data filtering (only for super admin) – runs only when searchTerm changes
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim() || !isSuperAdmin) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(
      (comp) =>
        comp.name.toLowerCase().includes(term) ||
        (comp.name_am && comp.name_am.toLowerCase().includes(term)) ||
        comp.slug.toLowerCase().includes(term) ||
        (comp.business_type && comp.business_type.toLowerCase().includes(term)) ||
        comp.category_name.toLowerCase().includes(term) ||
        comp.sub_category_name.toLowerCase().includes(term)
    );
  }, [companies, searchTerm, isSuperAdmin]);

  // Sorting & pagination (super admin sees all, others see single company)
  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    isSuperAdmin ? filteredCompanies : companies,
    "name",
    "asc"
  );

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    resetPage,
    itemsPerPage,
  } = usePagination(sortedItems, pageSize);

  const paginatedItemsWithRowNumber = useMemo(
    () =>
      paginatedItems.map((item, index) => ({
        ...item,
        rowNumber: (currentPage - 1) * itemsPerPage + index + 1,
      })),
    [paginatedItems, currentPage, itemsPerPage]
  );

  useEffect(() => {
    resetPage();
  }, [searchTerm, pageSize, resetPage]);

  // --- API fetching ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSuperAdmin && userCompanySlug) {
        const companyRes = await getCompanyDetail(userCompanySlug);
        const company = companyRes.data as Company;
        const companyListItem: CompanyListItem = {
          id: company.id,
          name: company.name,
          name_am: company.name_am || "",
          slug: company.slug,
          logo: company.logo,
          cover_image: company.cover_image,
          category: company.category,
          category_name: company.category_name,
          sub_category: company.sub_category,
          sub_category_name: company.sub_category_name,
          business_type: company.business_type,
          is_active: company.is_active,
          is_featured: company.is_featured,
          description: company.description || "",
        };
        setCompanies([companyListItem]);
      } else if (isSuperAdmin) {
        let allCompanies: CompanyListItem[] = [];
        let nextUrl: string | null = "/companies/?page=1&ordering=name";
        while (nextUrl) {
          const res = await api.get(nextUrl);
          const data = res.data as PaginatedResponse<CompanyListItem>;
          allCompanies = [...allCompanies, ...data.results];
          nextUrl = data.next;
        }
        setCompanies(allCompanies);
      } else {
        setCompanies([]);
      }

      const [categoriesRes, subcategoriesRes] = await Promise.all([
        getCategories(),
        getSubCategories(),
      ]);
      setCategories(categoriesRes.data);
      setSubcategories(subcategoriesRes.data);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Form helpers ---
  const filteredSubcategories = useMemo(
    () => subcategories.filter((sub) => sub.category === formData.category),
    [subcategories, formData.category]
  );

  const validateBasicInfo = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Company name is required";
    if (formData.category === 0) errors.category = "Please select a category";
    if (formData.sub_category === 0) errors.sub_category = "Please select a subcategory";
    if (!formData.business_type) errors.business_type = "Please select a business type";
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug))
      errors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBasicInfo()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        name_am: formData.name_am || undefined,
        slug: formData.slug || undefined,
        category: formData.category,
        sub_category: formData.sub_category,
        business_type: formData.business_type,
        description: formData.description || undefined,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };

      const hasFiles = !!(formData.logo || formData.cover_image);

      if (hasFiles) {
        const formPayload = new FormData();
        formPayload.append("name", formData.name);
        if (formData.name_am) formPayload.append("name_am", formData.name_am);
        if (formData.slug) formPayload.append("slug", formData.slug);
        formPayload.append("category", String(formData.category));
        formPayload.append("sub_category", String(formData.sub_category));
        formPayload.append("business_type", formData.business_type);
        if (formData.description) formPayload.append("description", formData.description);
        formPayload.append("is_active", String(formData.is_active));
        formPayload.append("is_featured", String(formData.is_featured));
        if (formData.logo) formPayload.append("logo", formData.logo);
        if (formData.cover_image) formPayload.append("cover_image", formData.cover_image);

        if (editingSlug) {
          await updateCompany(editingSlug, formPayload);
        } else {
          await createCompany(formPayload);
        }
      } else {
        if (editingSlug) {
          await updateCompany(editingSlug, payload);
        } else {
          await createCompany(payload);
        }
      }

      showToast(
        "success",
        editingSlug ? "Company updated successfully" : "Company created successfully"
      );
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.response?.data?.detail || "Operation failed";
      showToast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCompany(deleteTarget.slug);
      showToast("success", "Company deleted successfully");
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Delete failed");
    }
  };

  const resetForm = () => {
    setEditingSlug(null);
    setFormData({
      name: "",
      name_am: "",
      slug: "",
      category: 0,
      sub_category: 0,
      business_type: "",
      description: "",
      is_active: true,
      is_featured: false,
      logo: null,
      cover_image: null,
    });
    setLogoPreview(null);
    setCoverPreview(null);
    setFormErrors({});
  };

  const openEdit = useCallback((company: CompanyListItem) => {
    if (!canEditCompany(company.slug)) {
      showToast("error", "You don't have permission to edit this company");
      return;
    }
    setEditingSlug(company.slug);
    setFormData({
      name: company.name,
      name_am: company.name_am || "",
      slug: company.slug,
      category: company.category,
      sub_category: company.sub_category,
      business_type: company.business_type,
      description: company.description || "",
      is_active: company.is_active,
      is_featured: company.is_featured,
      logo: null,
      cover_image: null,
    });
    if (company.logo) setLogoPreview(company.logo);
    if (company.cover_image) setCoverPreview(company.cover_image);
    setModalOpen(true);
  }, [canEditCompany]);

  const handleDeleteClick = useCallback((company: CompanyListItem) => {
    setDeleteTarget(company);
  }, []);

  // --- Memoised columns (stable) ---
  const columns: Column<CompanyListItem>[] = useMemo(
    () => [
      {
        key: "rowNumber",
        header: "No.",
        sortable: false,
        render: (item: CompanyListItem & { rowNumber?: number }) => item.rowNumber,
      },
      {
        key: "logo",
        header: "Logo",
        sortable: false,
        render: (comp) =>
          comp.logo ? (
            <img src={comp.logo} alt={comp.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ImageIcon size={16} className="text-gray-400" />
            </div>
          ),
      },
      { key: "name", header: "Name", sortable: true, className: "font-medium text-gray-900 max-w-[100px] break-words" },
      { key: "slug", header: "Slug", sortable: true, className: "font-mono text-gray-500 max-w-[100px] break-words" },
      { key: "category_name", header: "Category", sortable: true },
      { key: "sub_category_name", header: "Subcategory", sortable: true },
      {
        key: "business_type",
        header: "Type",
        sortable: true,
        render: (comp) => comp.business_type?.toUpperCase() || "-",
      },
      {
        key: "is_active",
        header: "Active",
        sortable: true,
        render: (comp) => (
          <span className={`px-2 py-1 text-xs rounded-full ${comp.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {comp.is_active ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "is_featured",
        header: "Featured",
        sortable: true,
        render: (comp) => (
          <span className={`px-2 py-1 text-xs rounded-full ${comp.is_featured ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>
            {comp.is_featured ? "Yes" : "No"}
          </span>
        ),
      },
    ],
    []
  );

  // --- Multi‑step form steps (unchanged, but defined inside render) ---
  const steps: FormStep[] = useMemo(
    () => [
      {
        id: "basic",
        title: "Basic Information",
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ... same as before ... */}
            <div>
              <input
                type="text"
                placeholder="Company Name (English) *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full border rounded-lg p-2 ${formErrors.name ? "border-red-500" : "border-gray-300"}`}
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <input
                type="text"
                placeholder="Name (Amharic)"
                value={formData.name_am}
                onChange={(e) => setFormData({ ...formData, name_am: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Slug (unique, optional)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className={`w-full border rounded-lg p-2 font-mono ${formErrors.slug ? "border-red-500" : "border-gray-300"}`}
              />
              {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
            </div>
            <div>
              <select
                value={formData.category}
                onChange={(e) => {
                  const catId = Number(e.target.value);
                  setFormData({ ...formData, category: catId, sub_category: 0 });
                }}
                className={`w-full border rounded-lg p-2 ${formErrors.category ? "border-red-500" : "border-gray-300"}`}
              >
                <option value={0}>Select Category *</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
            </div>
            <div>
              <select
                value={formData.sub_category}
                onChange={(e) => setFormData({ ...formData, sub_category: Number(e.target.value) })}
                className={`w-full border rounded-lg p-2 ${formErrors.sub_category ? "border-red-500" : "border-gray-300"}`}
                disabled={!formData.category}
              >
                <option value={0}>Select Subcategory *</option>
                {filteredSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
              {formErrors.sub_category && <p className="text-red-500 text-xs mt-1">{formErrors.sub_category}</p>}
            </div>
            <div>
              <select
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className={`w-full border rounded-lg p-2 ${formErrors.business_type ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select Business Type *</option>
                <option value="brand">Brand</option>
                <option value="store">Store</option>
                <option value="service">Service</option>
                <option value="factory">Factory</option>
              </select>
              {formErrors.business_type && <p className="text-red-500 text-xs mt-1">{formErrors.business_type}</p>}
            </div>
            <div className="md:col-span-2">
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2"
                rows={3}
              />
            </div>
          </div>
        ),
        validate: validateBasicInfo,
      },
      {
        id: "images",
        title: "Images & Status",
        content: (
          <div className="space-y-6">
            <DragDropImageUpload
              label="Logo"
              value={formData.logo}
              onChange={(file) => setFormData((prev) => ({ ...prev, logo: file }))}
              previewUrl={logoPreview}
              required={false}
            />
            <DragDropImageUpload
              label="Cover Image"
              value={formData.cover_image}
              onChange={(file) => setFormData((prev) => ({ ...prev, cover_image: file }))}
              previewUrl={coverPreview}
            />
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>
        ),
      },
    ],
    [formData, formErrors, categories, filteredSubcategories, logoPreview, coverPreview]
  );

  if (error) return <ErrorView error={error} onRetry={fetchData} />;

  return (
    <div>
      <Toast toast={toast} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Companies</h2>
        {canAddCompany && (
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="bg-[#6750A4] text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-[#6750A4] transition shadow-sm"
          >
            <Plus size={18} /> Add Company
          </button>
        )}
      </div>

      {/* Only super admin sees search & sort controls */}
      {isSuperAdmin && (
        <TableControls pageSize={pageSize} onPageSizeChange={setPageSize}>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1">
              <SearchInput
                value={inputValue}
                onChange={handleInputChange}
                debounceMs={0}
                loading={loading}
                placeholder="Search by name, slug, category, subcategory, or type..."
              />
            </div>
            <select
              value={`${sortField}|${sortOrder}`}
              onChange={(e) => {
                const [field, desiredOrder] = e.target.value.split('|');
                if (field === sortField) {
                  if (desiredOrder !== sortOrder) handleSort(field);
                } else {
                  handleSort(field);
                  if (desiredOrder === 'desc') handleSort(field);
                }
              }}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 sm:w-48"
            >
              <option value="name|asc">Name (A-Z)</option>
              <option value="name|desc">Name (Z-A)</option>
              <option value="id|asc">Oldest (ID ↑)</option>
              <option value="id|desc">Newest (ID ↓)</option>
              <option value="business_type|asc">Business Type (A-Z)</option>
              <option value="category_name|asc">Category (A-Z)</option>
              <option value="sub_category_name|asc">Subcategory (A-Z)</option>
              <option value="is_active|desc">Active First</option>
              <option value="is_featured|desc">Featured First</option>
            </select>
          </div>
        </TableControls>
      )}

      <MemoizedDataTable
        data={paginatedItemsWithRowNumber}
        columns={columns}
        loading={loading}
        emptyMessage="No companies found"
        onEdit={openEdit}
        onDelete={canDeleteCompany ? handleDeleteClick : undefined}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={isSuperAdmin ? handleSort : undefined}
      />

      <MemoizedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />

      <MultiStepFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        steps={steps}
        onSubmit={handleSubmit}
        submitting={submitting}
        maxWidth="2xl"
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.name || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}