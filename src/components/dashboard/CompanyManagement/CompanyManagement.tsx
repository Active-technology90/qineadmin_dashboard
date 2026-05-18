// src/components/admin/CompanyManagement/CompanyManagement.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Plus } from "lucide-react";
import api from "../../../services/api";
import {
  createCompany,
  updateCompany,
  deleteCompany,
  getCategories,
  getSubCategories,
  getCompanyDetail,
} from "../../../services/api";
import type {
  CompanyListItem,
  Category,
  SubCategory,
  Company,
} from "../../../types";
import { MultiStepFormModal } from "../../ui/MultiStepFormModal";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { ErrorView } from "../../ui/ErrorView";
import { Toast } from "../../ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { usePagination } from "../../../hooks/usePagination";
import { useSorting } from "../../../hooks/useSorting";
import { useAuth } from "../../../hooks/useAuth";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import type { Column } from "../../ui/DataTable";
import { ImageIcon } from "lucide-react";

import SuperAdminView from "./SuperAdminView";
import NonSuperAdminView from "./NonSuperAdminView";
import CompanyFilters from "./CompanyFilters";
import type { CompanyFormData } from "./CompanyForm";
import { DragDropImageUpload } from "../../ui/DragDropImageUpload";

type PaginatedResponse<T> = {
  results: T[];
  next: string | null;
};

// Role priority helper
const getPrimaryMembership = (memberships: any[] | undefined) => {
  if (!memberships?.length) return null;
  const priority: Record<string, number> = {
    owner: 5,
    admin: 4,
    staff: 3,
    delivery: 2,
    viewer: 1,
  };
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
  const { company: currentCompany } = useCurrentCompany();

  // Permission flags
  const isSuperAdmin = !user?.memberships?.length;
  const memberships = user?.memberships ?? [];
  const primaryMembership = !isSuperAdmin
    ? getPrimaryMembership(memberships)
    : null;
  // const userCompanySlug = primaryMembership?.company_slug ?? null;
  const userCompanyRole = primaryMembership?.role ?? null;

  // Get role for currently selected company
  const getCurrentCompanyRole = () => {
    if (isSuperAdmin) return "super_admin";
    if (!currentCompany?.slug || !memberships.length) return userCompanyRole;
    const membership = memberships.find(m => m.company_slug === currentCompany.slug);
    return membership?.role || userCompanyRole;
  };

  const currentCompanyRole = getCurrentCompanyRole();

  const canAddCompany = isSuperAdmin;
  const canDeleteCompany = isSuperAdmin;
  const canEditCompany = useCallback(
    (companySlug: string) => {
      if (isSuperAdmin) return true;
      // Get the role for the specific company being edited
      const membershipForCompany = memberships.find(m => m.company_slug === companySlug);
      const roleForCompany = membershipForCompany?.role;
      return roleForCompany === "owner" || roleForCompany === "admin";
    },
    [isSuperAdmin, memberships],
  );

  // Data states
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter state
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    name_am: "",
    slug: "",
    category: 0,
    sub_category: 0,
    business_type: "",
    description: "",
    minimum_order_total: "0.00",
    is_active: true,
    is_featured: false,
    logo: null,
    cover_image: null,
  });
  const [originalFormData, setOriginalFormData] = useState<CompanyFormData | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyListItem | null>(
    null,
  );
  const { toast, showToast } = useToast();
  const [isEditingActive, setIsEditingActive] = useState(false);

  // Filtered companies (super admin only)
  const filteredCompanies = useMemo(() => {
    if (!isSuperAdmin) return companies;
    let data = [...companies];
    if (businessTypeFilter !== "all") {
      data = data.filter((comp) => comp.business_type === businessTypeFilter);
    }
    if (categoryFilter !== "all") {
      data = data.filter((comp) => comp.category_name === categoryFilter);
    }
    if (subCategoryFilter !== "all") {
      data = data.filter(
        (comp) => comp.sub_category_name === subCategoryFilter,
      );
    }
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (comp) =>
        comp.name.toLowerCase().includes(term) ||
        (comp.name_am && comp.name_am.toLowerCase().includes(term)) ||
        comp.slug.toLowerCase().includes(term) ||
        (comp.business_type &&
          comp.business_type.toLowerCase().includes(term)) ||
        comp.category_name.toLowerCase().includes(term) ||
        comp.sub_category_name.toLowerCase().includes(term),
    );
  }, [
    companies,
    searchTerm,
    isSuperAdmin,
    businessTypeFilter,
    categoryFilter,
    subCategoryFilter,
  ]);

  // Options for filters
  const businessTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(companies.map((c) => c.business_type).filter(Boolean)),
      ).sort(),
    [companies],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(companies.map((c) => c.category_name).filter(Boolean)),
      ).sort(),
    [companies],
  );
  const subCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set(companies.map((c) => c.sub_category_name).filter(Boolean)),
      ).sort(),
    [companies],
  );
  const hasActiveFilters =
    !!inputValue.trim() ||
    businessTypeFilter !== "all" ||
    categoryFilter !== "all" ||
    subCategoryFilter !== "all";

  // Sorting & pagination
  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    isSuperAdmin ? filteredCompanies : companies,
    "name",
    "asc",
  );
  const { paginatedItems, currentPage, totalPages, goToPage, resetPage } =
    usePagination(sortedItems, pageSize);

  const paginatedItemsWithRowNumber = useMemo(
    () =>
      paginatedItems.map((item, idx) => ({
        ...item,
        rowNumber: (currentPage - 1) * pageSize + idx + 1,
      })),
    [paginatedItems, currentPage, pageSize],
  );

  useEffect(() => {
    resetPage();
  }, [
    searchTerm,
    pageSize,
    businessTypeFilter,
    categoryFilter,
    subCategoryFilter,
    resetPage,
  ]);

  // Table columns (memoised)
  const columns: Column<CompanyListItem>[] = useMemo(
    () => [
      {
        key: "rowNumber",
        header: "No.",
        sortable: false,
        render: (item: CompanyListItem & { rowNumber?: number }) =>
          item.rowNumber,
      },
      {
        key: "logo",
        header: "Logo",
        sortable: false,
        render: (comp) =>
          comp.logo ? (
            <img
              src={comp.logo}
              alt={comp.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ImageIcon size={16} className="text-gray-400" />
            </div>
          ),
      },
      {
        key: "name",
        header: "Name",
        sortable: true,
        className: "font-medium text-gray-900 max-w-[100px] break-words",
      },
      {
        key: "slug",
        header: "Slug",
        sortable: true,
        className: "font-mono text-gray-500 max-w-[100px] break-words",
      },
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
        header: "Is Active",
        sortable: true,
        render: (comp) => (
          <span
            className={`px-2 py-1 text-xs rounded-full ${comp.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {comp.is_active ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "is_featured",
        header: "Featured",
        sortable: true,
        render: (comp) => (
          <span
            className={`px-2 py-1 text-xs rounded-full ${comp.is_featured ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}
          >
            {comp.is_featured ? "Yes" : "No"}
          </span>
        ),
      },
    ],
    [],
  );

  // Sort change handler for the filter component
  const onSortChange = useCallback(
    (value: string) => {
      const [field, desiredOrder] = value.split("|");
      if (field === sortField) {
        if (desiredOrder !== sortOrder) handleSort(field);
      } else {
        handleSort(field);
        if (desiredOrder === "desc") handleSort(field);
      }
    },
    [handleSort, sortField, sortOrder],
  );

  // --- API fetching ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!isSuperAdmin && currentCompany?.slug) {
        const companyRes = await getCompanyDetail(currentCompany.slug);
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
          minimum_order_total: company.minimum_order_total || "0.00",
          is_active: company.is_active,
          is_featured: company.is_featured,
          description: company.description || "",
        };
        setCompanies([companyListItem]);
        // Load form data for inline edit
        setEditingSlug(companyListItem.slug);
        setFormData({
          name: companyListItem.name,
          name_am: companyListItem.name_am || "",
          slug: companyListItem.slug,
          category: companyListItem.category,
          sub_category: companyListItem.sub_category,
          business_type: companyListItem.business_type,
          description: companyListItem.description || "",
          minimum_order_total: companyListItem.minimum_order_total || "0.00",
          is_active: companyListItem.is_active,
          is_featured: companyListItem.is_featured,
          logo: null,
          cover_image: null,
        });
        if (companyListItem.logo) setLogoPreview(companyListItem.logo);
        if (companyListItem.cover_image)
          setCoverPreview(companyListItem.cover_image);
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
        // Auto-select first for modal form
        if (allCompanies.length > 0) {
          const first = allCompanies[0];
          setEditingSlug(first.slug);
          setFormData({
            name: first.name,
            name_am: first.name_am || "",
            slug: first.slug,
            category: first.category,
            sub_category: first.sub_category,
            business_type: first.business_type,
            description: first.description || "",
            minimum_order_total: first.minimum_order_total || "0.00",
            is_active: first.is_active,
            is_featured: first.is_featured,
            logo: null,
            cover_image: null,
          });
          if (first.logo) setLogoPreview(first.logo);
          if (first.cover_image) setCoverPreview(first.cover_image);
        }
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
  }, [currentCompany?.slug]);

  // --- Form handlers ---
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
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validateBasicInfo()) return;
    
    // Check if any changes were made (for update operations)
    if (editingSlug && originalFormData) {
      const hasChanges = () => {
        // Check text fields
        if (formData.name !== originalFormData.name) return true;
        if (formData.name_am !== originalFormData.name_am) return true;
        if (formData.category !== originalFormData.category) return true;
        if (formData.sub_category !== originalFormData.sub_category) return true;
        if (formData.business_type !== originalFormData.business_type) return true;
        if (formData.description !== originalFormData.description) return true;
        if (formData.minimum_order_total !== originalFormData.minimum_order_total) return true;
        if (formData.is_active !== originalFormData.is_active) return true;
        if (formData.is_featured !== originalFormData.is_featured) return true;
        // Check file uploads
        if (formData.logo !== null) return true;
        if (formData.cover_image !== null) return true;
        return false;
      };
      
      if (!hasChanges()) {
        showToast("info", "No changes detected. Update canceled.");
        // Close edit mode without submitting
        if (!isSuperAdmin) {
          setIsEditingActive(false);
          resetForm();
        } else {
          setModalOpen(false);
        }
        setSubmitting(false);
        return;
      }
    }
    
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
        minimum_order_total:
          formData.minimum_order_total || "0.00",
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      };

      const hasFiles = !!(
        formData.logo || formData.cover_image
      );

      if (hasFiles) {
        const formPayload = new FormData();

        formPayload.append("name", formData.name);

        if (formData.name_am)
          formPayload.append("name_am", formData.name_am);

        if (formData.slug)
          formPayload.append("slug", formData.slug);

        formPayload.append(
          "category",
          String(formData.category)
        );

        formPayload.append(
          "sub_category",
          String(formData.sub_category)
        );

        formPayload.append(
          "business_type",
          formData.business_type
        );

        if (formData.description) {
          formPayload.append(
            "description",
            formData.description
          );
        }

        formPayload.append(
          "minimum_order_total",
          formData.minimum_order_total || "0.00"
        );

        formPayload.append(
          "is_active",
          String(formData.is_active)
        );

        formPayload.append(
          "is_featured",
          String(formData.is_featured)
        );

        if (formData.logo) {
          formPayload.append("logo", formData.logo);
        }

        if (formData.cover_image) {
          formPayload.append(
            "cover_image",
            formData.cover_image
          );
        }

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
        editingSlug
          ? "Company updated successfully"
          : "Company created successfully"
      );

      // close modal smoothly
      setModalOpen(false);
      setIsEditingActive(false);

      setTimeout(async () => {
        resetForm();
        await fetchData();
      }, 250);

    } catch (err: any) {
      if (err?.response?.status === 401) {
        showToast(
          "error",
          "Session expired. Please refresh the page."
        );
      } else {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          "Operation failed";

        showToast("error", msg);
      }
    } finally {
      setSubmitting(false);
    }
  }
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
      minimum_order_total: "0.00",
      is_active: true,
      is_featured: false,
      logo: null,
      cover_image: null,
    });
        setOriginalFormData(null);
    setLogoPreview(null);
    setCoverPreview(null);
    setFormErrors({});
  };

  const openEdit = useCallback(
    (company: CompanyListItem) => {
      if (!canEditCompany(company.slug)) {
        showToast("error", "You don't have permission to edit this company");
        return;
      }
      setEditingSlug(company.slug);
      const newFormData = {
        name: company.name,
        name_am: company.name_am || "",
        slug: company.slug,
        category: company.category,
        sub_category: company.sub_category,
        business_type: company.business_type,
        description: company.description || "",
        minimum_order_total: company.minimum_order_total || "0.00",
        is_active: company.is_active,
        is_featured: company.is_featured,
        logo: null,
        cover_image: null,
      };
      setFormData(newFormData);
      // Save original data for change detection
      setOriginalFormData({ ...newFormData });
      if (company.logo) setLogoPreview(company.logo);
      if (company.cover_image) setCoverPreview(company.cover_image);
      if (isSuperAdmin) {
        setModalOpen(true);
      } else {
        setIsEditingActive(true);
      }
    },
    [canEditCompany, isSuperAdmin, showToast],
  );

  const closeInlineEdit = useCallback(() => {
    setEditingSlug(null);
    setIsEditingActive(false);
    resetForm();
  }, []);

  const handleDeleteClick = useCallback((company: CompanyListItem) => {
    setDeleteTarget(company);
  }, []);

  const clearAllFilters = useCallback(() => {
    setInputValue("");
    setSearchTerm("");
    setBusinessTypeFilter("all");
    setCategoryFilter("all");
    setSubCategoryFilter("all");
  }, []);

  // Multi-step form steps (unchanged, uses current state)
  const steps = useMemo(
    () => [
      {
        id: "basic",
        title: <span className="text-[#6750A4]">Basic Information</span>,
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Company Name (English) *"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className={`w-full border rounded-lg p-2 ${formErrors.name ? "border-red-500" : "border-gray-300"}`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Name (Amharic)"
                value={formData.name_am}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name_am: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Slug (unique) *"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                className={`w-full border rounded-lg p-2 font-mono ${formErrors.slug ? "border-red-500" : "border-gray-300"}`}
              />
              {formErrors.slug && (
                <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
              )}
            </div>
            <div>
              <select
                value={formData.category}
                onChange={(e) => {
                  const catId = Number(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    category: catId,
                    sub_category: 0,
                  }));
                }}
                className={`w-full border rounded-lg p-2 ${formErrors.category ? "border-red-500" : "border-gray-300"}`}
              >
                <option value={0}>Select Category *</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {formErrors.category && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.category}
                </p>
              )}
            </div>
             <div>
              <select
                value={formData.sub_category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sub_category: Number(e.target.value),
                  }))
                }
                className={`w-full border rounded-lg p-2 ${!formData.category ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"} ${formErrors.sub_category ? "border-red-500" : "border-gray-300"}`}
                disabled={!formData.category}
                style={{ cursor: !formData.category ? "not-allowed" : "default" }}
              >
                <option value={0}>Select Subcategory *</option>
                {subcategories
                  .filter((sub) => sub.category === formData.category)
                  .map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
              </select>
              {formErrors.sub_category && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.sub_category}
                </p>
              )}
            </div>
            <div>
              <select
                value={formData.business_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    business_type: e.target.value,
                  }))
                }
                className={`w-full border rounded-lg p-2 ${formErrors.business_type ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select Business Type *</option>
                <option value="brand">Company</option>
                <option value="store">Store</option>
                <option value="service">Service</option>
               
              </select>
              {formErrors.business_type && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.business_type}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
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
         title: <span className="text-[#6750A4]">Images & Status</span>,
        content: (
          <div className="space-y-6 ">
            <div className="w-72">
<DragDropImageUpload
              label="Logo"
              size = "sm"
              value={formData.logo}
              onChange={(file) =>
                setFormData((prev) => ({ ...prev, logo: file }))
              }
              previewUrl={logoPreview}
              required={false}
            />
            </div>
            
            <DragDropImageUpload
              label="Cover Image"
              value={formData.cover_image}
              onChange={(file) =>
                setFormData((prev) => ({ ...prev, cover_image: file }))
              }
              previewUrl={coverPreview}
            />
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_featured: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <span className="text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>
        ),
      },
    ],
    [
      formData,
      formErrors,
      categories,
      subcategories,
      logoPreview,
      coverPreview,
    ],
  );

  if (error) return <ErrorView error={error} onRetry={fetchData} />;

  return (
    <div>
      <Toast toast={toast} />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#6750A4]">
            {isSuperAdmin ? "Companies" : "Company Detail"}
          </h2>
          {!isSuperAdmin && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#6750A4]"></span>
              Manage your company details and settings
            </p>
          )}
        </div>
        {canAddCompany && (
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="bg-[#6750A4] text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-[#5b4694] transition shadow-sm"
          >
            <Plus size={18} />
            Add Company
          </button>
        )}
      </div>

      {/* Filters (super admin only) */}
      {isSuperAdmin && (
        <CompanyFilters
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          loading={loading}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          businessTypeFilter={businessTypeFilter}
          onBusinessTypeChange={setBusinessTypeFilter}
          businessTypeOptions={businessTypeOptions}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categoryOptions={categoryOptions}
          subCategoryFilter={subCategoryFilter}
          onSubCategoryChange={setSubCategoryFilter}
          subCategoryOptions={subCategoryOptions}
          hasActiveFilters={hasActiveFilters}
          onClearAll={clearAllFilters}
        />
      )}

      {/* Main content views */}
      {isSuperAdmin ? (
        <SuperAdminView
          paginatedItems={paginatedItemsWithRowNumber}
          columns={columns}
          loading={loading}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onEdit={openEdit}
          onDelete={canDeleteCompany ? handleDeleteClick : undefined}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      ) : (
        <NonSuperAdminView
          companies={companies}
          userCompanyRole={currentCompanyRole}
          onEdit={openEdit}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          categories={categories}
          subcategories={subcategories}
          logoPreview={logoPreview}
          coverPreview={coverPreview}
          isEditingActive={isEditingActive}
          submitting={submitting}
          editingSlug={editingSlug}
          onSubmit={handleSubmit}
          onCloseForm={closeInlineEdit}
        />
      )}

      {/* Modals */}
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
