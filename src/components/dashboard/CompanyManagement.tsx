// src/components/admin/CompanyManagement.tsx
import React, { useEffect, useState, useMemo } from "react";
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



type PaginatedResponse<T> = {
  results: T[];
  next: string | null;
};

export default function CompanyManagement() {
  const [pageSize, setPageSize] = useState(10);
  const { user } = useAuth();
  const isCompanyAdmin = user?.memberships && user.memberships.length > 0;
  // const userCompanySlug = isCompanyAdmin ? user.memberships[0].company_slug : null;
  const userCompanySlug = user?.memberships?.[0]?.company_slug ?? null;
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Filter companies by search term (only used for super admin)
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(
      (comp) =>
        comp.name.toLowerCase().includes(term) ||
        comp.name_am?.toLowerCase().includes(term) ||
        comp.slug.toLowerCase().includes(term) ||
        comp.business_type?.toLowerCase().includes(term) ||
        comp.category_name.toLowerCase().includes(term) ||
        comp.sub_category_name.toLowerCase().includes(term),
    );
  }, [companies, searchTerm]);

  // For company admin, we have only one company → skip sorting/pagination
  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    isCompanyAdmin ? companies : filteredCompanies,
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

  const paginatedItemsWithRowNumber = useMemo(() => {
    return paginatedItems.map((item, index) => ({
      ...item,
      rowNumber: (currentPage - 1) * itemsPerPage + index + 1,
    }));
  }, [paginatedItems, currentPage, itemsPerPage]);

 useEffect(() => {
  resetPage();
}, [searchTerm, pageSize, resetPage]);

  // Fetch data based on role
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isCompanyAdmin && userCompanySlug) {
        // Company admin: fetch only their own company
        const companyRes = await getCompanyDetail(userCompanySlug);
        const company = companyRes.data as Company;
        // Convert to CompanyListItem shape for consistent table display
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
      } else {
        // Super admin: fetch all companies (paginated)
        let allCompanies: CompanyListItem[] = [];
        let nextUrl: string | null = "/companies/?page=1&ordering=name";

        while (nextUrl) {
          const res = await api.get(nextUrl);
          const data = res.data as PaginatedResponse<CompanyListItem>;
          allCompanies = [...allCompanies, ...data.results];
          nextUrl = data.next;
        }
        setCompanies(allCompanies);
      }

      // Fetch categories and subcategories (common to both roles)
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

  // Filter subcategories based on selected category
  const filteredSubcategories = useMemo(() => {
    if (!formData.category) return [];
    return subcategories.filter((sub) => sub.category === formData.category);
  }, [subcategories, formData.category]);

  // Validation
  const validateBasicInfo = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Company name is required";
    if (formData.category === 0) errors.category = "Please select a category";
    if (formData.sub_category === 0)
      errors.sub_category = "Please select a subcategory";
    if (!formData.business_type)
      errors.business_type = "Please select a business type";
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug))
      errors.slug =
        "Slug must contain only lowercase letters, numbers, and hyphens";
    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    if (!isValid) alert("Please fix the errors before proceeding");
    return isValid;
  };

  // Create / Update handler
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

      const hasFiles = formData.logo || formData.cover_image;

      if (hasFiles) {
        const formPayload = new FormData();
        formPayload.append("name", formData.name);
        if (formData.name_am) formPayload.append("name_am", formData.name_am);
        if (formData.slug) formPayload.append("slug", formData.slug);
        formPayload.append("category", String(formData.category));
        formPayload.append("sub_category", String(formData.sub_category));
        formPayload.append("business_type", formData.business_type);
        if (formData.description)
          formPayload.append("description", formData.description);
        formPayload.append("is_active", String(formData.is_active));
        formPayload.append("is_featured", String(formData.is_featured));
        if (formData.logo instanceof File)
          formPayload.append("logo", formData.logo);
        if (formData.cover_image instanceof File)
          formPayload.append("cover_image", formData.cover_image);

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
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Operation failed";
      showToast("error", msg);
      console.error("API Error:", err.response?.data);
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

  const openEdit = (company: CompanyListItem) => {
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
  };

  // Multi-step form steps (unchanged)
  const steps: FormStep[] = [
    {
      id: "basic",
      title: "Basic Information",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="md:w-1/2">
            <DragDropImageUpload
              label="Logo"
              value={formData.logo}
              onChange={(file) => setFormData((prev) => ({ ...prev, logo: file }))}
              previewUrl={logoPreview}
              required={false}
            />
          </div>
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
  ];

  // Table columns (same for both roles)
  const columns: Column<CompanyListItem>[] = [
    {
      key: "rowNumber",
      header: "No.",
      sortable: false,
      render: (cat: CompanyListItem & { rowNumber?: number }) => cat.rowNumber,
    },
    {
      key: "logo",
      header: "Logo",
      sortable: false,
      render: (comp: CompanyListItem) =>
        comp.logo ? (
          <img src={comp.logo} alt={comp.name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <ImageIcon size={16} className="text-gray-400" />
          </div>
        ),
    },
    { key: "name", header: "Name", sortable: true, className: "font-medium text-gray-900" },
    { key: "slug", header: "Slug", sortable: true, className: "font-mono text-gray-500" },
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
  ];

  if (error) return <ErrorView error={error} onRetry={fetchData} />;

  return (
    <div>
      <Toast toast={toast} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Companies</h2>
        {/* Only super admin can add new companies */}
        {!isCompanyAdmin && (
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

      {/* Search & Sort – super admin only; company admin sees no filters because only one company */}
      {!isCompanyAdmin && (
       <TableControls pageSize={pageSize} onPageSizeChange={setPageSize}>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
  <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
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

      <DataTable
        data={paginatedItemsWithRowNumber}
        columns={columns}
        loading={loading}
        emptyMessage="No companies found"
        onEdit={openEdit}  // Both roles can edit (company admin edits own company)
        onDelete={!isCompanyAdmin ? setDeleteTarget : undefined}  // Only super admin can delete
        // currentPage={currentPage}
        // totalPages={totalPages}
        // onPageChange={goToPage}
        // totalItems={sortedItems.length}
        // itemsPerPage={itemsPerPage}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={!isCompanyAdmin ? handleSort : undefined} // Sorting only for super admin
      />
      <Pagination
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