// src/components/admin/CompanyManagement.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Plus, ImageIcon, Edit3, Building2, Tag, X } from "lucide-react";
import api from "../../services/api";
import {
  createCompany,
  updateCompany,
  deleteCompany,
  getCategories,
  getSubCategories,
  getCompanyDetail,
} from "../../services/api";
import type {
  CompanyListItem,
  Category,
  SubCategory,
  Company,
} from "../../types";
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

// Memoised sub components to prevent re renders
const MemoizedDataTable = React.memo(DataTable);
const MemoizedPagination = React.memo(Pagination);
const CompanyCard = ({ company, onEdit, userRole }: any) => (
  <div className="relative flex flex-col bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden group h-fit">
    {/* Cover Image Section - Full width at top */}
    <div className="relative h-40 w-full overflow-hidden">
      {company.cover_image ? (
        <img
          src={company.cover_image}
          alt={company.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-[#6750A4] via-[#7c63b8] to-[#9b87f5]" />
      )}
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
    </div>

    {/* Content Container - White card section */}
    <div className="relative z-10 flex flex-col bg-white rounded-t-3xl -mt-8 px-5 pb-3 pt-0">
      {/* Logo and Text Container - Side by side (logo left, text right) at intersection */}
      <div className="flex items-center gap-4 -mt-12 mb-4 px-4">
        {/* Logo - Left side with enhanced shadow for dark backgrounds */}
        <div className="flex-shrink-0 drop-shadow-xl">
          {company.logo ? (
            <img
              src={company.logo}
              alt={company.name}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-2xl"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6750A4] to-[#9b87f5] flex items-center justify-center border-4 border-white shadow-2xl">
              <Building2 size={32} className="text-white" />
            </div>
          )}
        </div>

        {/* Text Container - Right side with background for readability */}
        <div className="flex-1 min-w-0">
          {/* Company Name with text shadow and dark background fallback */}
          <h3 className="font-bold text-xl mb-1 truncate drop-shadow-lg text-white [text-shadow:_0_1px_4px_rgb(0_0_0_/_0.5)]">
            {company.name}
          </h3>

          {/* Slug with semi-transparent background for visibility */}
          <p className="text-xs font-mono px-3 py-1 rounded-full inline-block bg-black/50 backdrop-blur-sm text-white/90 border border-[#6750A4]/50 shadow-lg">
            {company.slug}
          </p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap justify-end mb-3">
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
            company.is_active
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }`}
        >
          {company.is_active ? "● Active" : "○ Inactive"}
        </span>
        {/* {company.is_featured && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            ★ Featured
          </span>
        )} */}
      </div>

      {/* Category Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white rounded-md shadow-sm">
            <Tag size={14} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Category
            </p>
            <p className="font-semibold text-gray-900 text-sm">
              {company.category_name}
            </p>
          </div>
        </div>
      </div>

      {/* Subcategory Section - New */}
      {company.sub_category_name && (
        <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-lg p-3 mb-2 border border-indigo-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white rounded-md shadow-sm">
              <Tag size={14} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Subcategory
              </p>
              <p className="font-medium text-gray-700 text-sm">
                {company.sub_category_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Business Type Section - Made clearer and more visible */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white rounded-md shadow-sm">
            <Building2 size={14} className="text-[#6750A4]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Business Type
            </p>
            <p className="font-bold text-gray-900 text-sm">
              {company.business_type?.toUpperCase() || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Button - Visible but DISABLED for staff (grayed out, no click) */}
      <button
        onClick={() => onEdit(company)}
        disabled={
          userRole !== "owner" &&
          userRole !== "admin" &&
          userRole !== "super_admin"
        }
        className={`absolute bottom-3 right-4 z-20 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all duration-300 group/btn
    ${
      userRole === "owner" || userRole === "admin" || userRole === "super_admin"
        ? "bg-gradient-to-r from-[#6750A4] to-[#7c63b8] hover:from-[#5b4694] hover:to-[#6b55a8] text-white shadow-lg cursor-pointer"
        : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
    }
  `}
      >
        <Edit3
          size={24}
          className={`transition-transform ${userRole === "owner" || userRole === "admin" || userRole === "super_admin" ? "group-hover/btn:rotate-12" : ""}`}
        />
        Edit Company
      </button>
    </div>
  </div>
);
type PaginatedResponse<T> = {
  results: T[];
  next: string | null;
};

// Helper to get the highest privilege membership (owner > admin > staff > delivery > viewer)
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

  // Permission flags
  const isSuperAdmin = !user?.memberships?.length;
  const memberships = user?.memberships ?? [];
  const primaryMembership = !isSuperAdmin
    ? getPrimaryMembership(memberships)
    : null;
  const userCompanySlug = primaryMembership?.company_slug ?? null;
  const userCompanyRole = primaryMembership?.role ?? null;

  const canAddCompany = isSuperAdmin;
  const canDeleteCompany = isSuperAdmin;
  const canEditCompany = (companySlug: string) => {
    // Super admin can edit everything
    if (isSuperAdmin) return true;

    // Company owner/admin can edit their own company
    return (
      (userCompanyRole === "owner" || userCompanyRole === "admin") &&
      userCompanySlug === companySlug
    );
  };

  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----- DEBOUNCED SEARCH -----
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");
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
    minimum_order_total: "0.00",
    is_active: true,
    is_featured: false,
    logo: null as File | null,
    cover_image: null as File | null,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyListItem | null>(
    null,
  );
  const { toast, showToast } = useToast();

  // NEW: State for inline editing on the right side
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] =
    useState<CompanyListItem | null>(null);
  // NEW: State to track if editing is active (fields enabled)
  const [isEditingActive, setIsEditingActive] = useState(false);
  // --- Data filtering (super admin) ---
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
      data = data.filter((comp) => comp.sub_category_name === subCategoryFilter);
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

  const businessTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(companies.map((comp) => comp.business_type).filter(Boolean)),
      ).sort(),
    [companies],
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(companies.map((comp) => comp.category_name).filter(Boolean)),
      ).sort(),
    [companies],
  );

  const subCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set(companies.map((comp) => comp.sub_category_name).filter(Boolean)),
      ).sort(),
    [companies],
  );
  const hasActiveFilters =
    !!inputValue.trim() ||
    businessTypeFilter !== "all" ||
    categoryFilter !== "all" ||
    subCategoryFilter !== "all";

  // Sorting & pagination (super admin sees all, others see single company)
  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    isSuperAdmin ? filteredCompanies : companies,
    "name",
    "asc",
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
    [paginatedItems, currentPage, itemsPerPage],
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
          minimum_order_total: company.minimum_order_total || "0.00",
          is_active: company.is_active,
          is_featured: company.is_featured,
          description: company.description || "",
        };
        setCompanies([companyListItem]);
        // Auto-select the company for the right side form
        setSelectedCompanyForEdit(companyListItem);
        // Load its data into the form
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
        // Auto-select the first company for the right side form
        if (allCompanies.length > 0) {
          const firstCompany = allCompanies[0];
          setSelectedCompanyForEdit(firstCompany);
          setEditingSlug(firstCompany.slug);
          setFormData({
            name: firstCompany.name,
            name_am: firstCompany.name_am || "",
            slug: firstCompany.slug,
            category: firstCompany.category,
            sub_category: firstCompany.sub_category,
            business_type: firstCompany.business_type,
            description: firstCompany.description || "",
            minimum_order_total: firstCompany.minimum_order_total || "0.00",
            is_active: firstCompany.is_active,
            is_featured: firstCompany.is_featured,
            logo: null,
            cover_image: null,
          });
          if (firstCompany.logo) setLogoPreview(firstCompany.logo);
          if (firstCompany.cover_image)
            setCoverPreview(firstCompany.cover_image);
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
  }, []);

  // --- Form helpers ---
  const filteredSubcategories = useMemo(
    () => subcategories.filter((sub) => sub.category === formData.category),
    [subcategories, formData.category],
  );

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
    e.stopPropagation(); // ✅ Add this to prevent event bubbling

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
        minimum_order_total: formData.minimum_order_total || "0.00",
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
        if (formData.description)
          formPayload.append("description", formData.description);
        formPayload.append(
          "minimum_order_total",
          formData.minimum_order_total || "0.00",
        );
        formPayload.append("is_active", String(formData.is_active));
        formPayload.append("is_featured", String(formData.is_featured));
        if (formData.logo) formPayload.append("logo", formData.logo);
        if (formData.cover_image)
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
        editingSlug
          ? "Company updated successfully"
          : "Company created successfully",
      );

      // ✅ Reset form and exit edit mode
      resetForm();
      setModalOpen(false)
      setIsEditingActive(false); // ✅ Exit edit mode after successful save
      setSelectedCompanyForEdit(null); // ✅ Clear selected company

      // ✅ Refresh data WITHOUT causing redirect
      await fetchData();
    } catch (err: any) {
      console.error("Save error:", err);
      // ✅ Check if it's an authentication error
      if (err?.response?.status === 401) {
        showToast("error", "Session expired. Please refresh the page.");
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
      minimum_order_total: "0.00",
      is_active: true,
      is_featured: false,
      logo: null,
      cover_image: null,
    });
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
      setFormData({
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
      });
      if (company.logo) setLogoPreview(company.logo);
      if (company.cover_image) setCoverPreview(company.cover_image);
      if (isSuperAdmin) {
        setModalOpen(true);
      } else {
        // Non-superadmin uses inline editor panel
        setSelectedCompanyForEdit(company);
        setIsEditingActive(true);
      }
    },
    [canEditCompany, isSuperAdmin, showToast],
  );

  // NEW: Close inline edit form
  const closeInlineEdit = useCallback(() => {
    setSelectedCompanyForEdit(null);
    setEditingSlug(null);
    setIsEditingActive(false);
    resetForm();
  }, []);

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

  // --- Multi step form steps (unchanged, but defined inside render) ---
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
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
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
                  setFormData({ ...formData, name_am: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Slug (unique, optional)"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
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
                  setFormData({
                    ...formData,
                    category: catId,
                    sub_category: 0,
                  });
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
                  setFormData({
                    ...formData,
                    sub_category: Number(e.target.value),
                  })
                }
                className={`w-full border rounded-lg p-2 ${formErrors.sub_category ? "border-red-500" : "border-gray-300"}`}
                disabled={!formData.category}
              >
                <option value={0}>Select Subcategory *</option>
                {filteredSubcategories.map((sub) => (
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
                  setFormData({ ...formData, business_type: e.target.value })
                }
                className={`w-full border rounded-lg p-2 ${formErrors.business_type ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select Business Type *</option>
                <option value="brand">Brand</option>
                <option value="store">Store</option>
                <option value="service">Service</option>
                <option value="factory">Factory</option>
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
                  setFormData({ ...formData, description: e.target.value })
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
        title: "Images & Status",
        content: (
          <div className="space-y-6">
            <DragDropImageUpload
              label="Logo"
              value={formData.logo}
              onChange={(file) =>
                setFormData((prev) => ({ ...prev, logo: file }))
              }
              previewUrl={logoPreview}
              required={false}
            />
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
                    setFormData({ ...formData, is_active: e.target.checked })
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
                    setFormData({ ...formData, is_featured: e.target.checked })
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
      filteredSubcategories,
      logoPreview,
      coverPreview,
    ],
  );

  if (error) return <ErrorView error={error} onRetry={fetchData} />;

  return (
    <div>
      <Toast toast={toast} />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        {/* Title Section */}
        <div>
          <h2
            className={`text-2xl font-bold transition-colors duration-200 ${"text-[#6750A4]"}`}
          >
            {isSuperAdmin ? "Companies" : "Company Profile"}
          </h2>

          {!isSuperAdmin && (
            <p className="text-sm text-gray-500 mt-1">
              Manage your company details and settings
            </p>
          )}
        </div>

        {/* Action Button */}
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

      {/* Only super admin sees search & sort controls */}
      {isSuperAdmin && (
        <TableControls pageSize={pageSize} onPageSizeChange={setPageSize}>
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="flex-1">
                <SearchInput
                  value={inputValue}
                  onChange={handleInputChange}
                  debounceMs={0}
                  loading={loading}
                  showClearButton={false}
                  placeholder="Search by name, slug, category, subcategory, or type..."
                />
              </div>
              <select
                value={`${sortField}|${sortOrder}`}
                onChange={(e) => {
                  const [field, desiredOrder] = e.target.value.split("|");
                  if (field === sortField) {
                    if (desiredOrder !== sortOrder) handleSort(field);
                  } else {
                    handleSort(field);
                    if (desiredOrder === "desc") handleSort(field);
                  }
                }}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 sm:w-48"
              >
                <option value={`${sortField}|${sortOrder}`}>All Filters</option>
                <option value="name|asc">Name (A-Z)</option>
                <option value="name|desc">Name (Z-A)</option>
                {/* <option value="business_type|asc">Business Type (A-Z)</option>
                <option value="category_name|asc">Category (A-Z)</option>
                <option value="sub_category_name|asc">Subcategory (A-Z)</option> */}
                <option value="is_active|desc">Active First</option>
                <option value="is_featured|desc">Featured First</option>
              </select>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-3 ">
              <select
                value={businessTypeFilter}
                onChange={(e) => setBusinessTypeFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Business Types</option>
                {businessTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Subcategories</option>
                {subCategoryOptions.map((subCat) => (
                  <option key={subCat} value={subCat}>
                    {subCat}
                  </option>
                ))}
              </select>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    setSearchTerm("");
                    setBusinessTypeFilter("all");
                    setCategoryFilter("all");
                    setSubCategoryFilter("all");
                  }}
                  className="inline-flex items-center justify-center gap-1.5 border border-[#f31313] text-[#f31313] rounded-lg px-4 py-2 text-sm w-1/3 hover:bg-[#f31313]/5"
                >
                  <X size={14} />
                  Clear
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </TableControls>
      )}

      {isSuperAdmin ? (
        <>
          <MemoizedDataTable
            data={paginatedItemsWithRowNumber}
            columns={columns}
            loading={loading}
            emptyMessage="No companies found"
            onEdit={openEdit}
            onDelete={canDeleteCompany ? handleDeleteClick : undefined}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          <MemoizedPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </>
      ) : (
        <div className="flex flex-col lg:flex-row gap-0 items-stretch">
          {/* Left side: Company Cards Grid - Takes 2/3 of space */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-5 lg:w-3/5 w-full">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={openEdit}
                userRole={userCompanyRole}
              />
            ))}
          </div>

          {/* Right side: Company Details Form - WIDER to fill empty space */}
          <div className="lg:w-1/2 w-full bg-white rounded-xl border border-gray-200 shadow-md sticky top-6 overflow-hidden -ml-54">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={closeInlineEdit}
                  className="text-[#6750A4] hover:text-[#5b4694] hover:bg-gray-100 p-1 rounded-md transition-colors flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  <span className="text-[10px] font-medium">Back</span>
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-0.5 bg-[#6750A4] rounded-full"></div>
                  <h3 className="pr-5 text-xs font-bold text-[#6750A4] uppercase tracking-wide">
                    Company Details
                  </h3>
                </div>
              </div>
            </div>

            {/* Show loading indicator */}
            {loading && companies.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6750A4] mx-auto mb-3"></div>
                <p className="text-sm">Loading company data...</p>
              </div>
            )}

            {/* TWO COLUMN HORIZONTAL FORM LAYOUT */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-row divide-x divide-gray-100"
            >
              {/* LEFT COLUMN - Basic Information */}
              <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-160px)]">
                {/* Company Name */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={!isEditingActive}
                    className={`w-full border rounded-md p-1.5 text-xs transition-all ${!isEditingActive ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"}`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Name Amharic */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                    Name (Amharic)
                  </label>
                  <input
                    type="text"
                    placeholder="አማርኛ ስም"
                    value={formData.name_am}
                    onChange={(e) =>
                      setFormData({ ...formData, name_am: e.target.value })
                    }
                    disabled={!isEditingActive}
                    className={`w-full border rounded-md p-1.5 text-xs ${!isEditingActive ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"}`}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                    Slug
                  </label>
                  <input
                    type="text"
                    placeholder="company-slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    disabled={!isEditingActive}
                    className={`w-full border rounded-md p-1.5 text-xs font-mono ${!isEditingActive ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"} ${formErrors.slug ? "border-red-500" : ""}`}
                  />
                  {formErrors.slug && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {formErrors.slug}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const catId = Number(e.target.value);
                      setFormData({
                        ...formData,
                        category: catId,
                        sub_category: 0,
                      });
                    }}
                    disabled={!isEditingActive}
                    className={`w-full border rounded-md p-1.5 text-xs ${!isEditingActive ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"} ${formErrors.category ? "border-red-500" : ""}`}
                  >
                    <option value={0}>Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {formErrors.category}
                    </p>
                  )}
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                    Subcategory *
                  </label>
                  <select
                    value={formData.sub_category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sub_category: Number(e.target.value),
                      })
                    }
                    disabled={!isEditingActive || !formData.category}
                    className={`w-full border rounded-md p-1.5 text-xs ${!isEditingActive ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"} ${formErrors.sub_category ? "border-red-500" : ""}`}
                  >
                    <option value={0}>Select Subcategory</option>
                    {filteredSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.sub_category && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {formErrors.sub_category}
                    </p>
                  )}
                </div>

                {/* Business Type */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                    Business Type *
                  </label>
                  <select
                    value={formData.business_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        business_type: e.target.value,
                      })
                    }
                    disabled={!isEditingActive}
                    className={`w-full border rounded-md p-1.5 text-xs ${!isEditingActive ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"} ${formErrors.business_type ? "border-red-500" : ""}`}
                  >
                    <option value="">Select Business Type</option>
                    <option value="brand">Brand</option>
                    <option value="store">Store</option>
                    <option value="service">Service</option>
                    <option value="factory">Factory</option>
                  </select>
                  {formErrors.business_type && (
                    <p className="text-red-500 text-[10px] mt-0.5">
                      {formErrors.business_type}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Company description..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={!isEditingActive}
                    rows={2}
                    className={`w-full border rounded-md p-1.5 text-xs resize-none ${!isEditingActive ? "bg-gray-50 border-gray-200" : "bg-white border-[#6750A4]/30 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"}`}
                  />
                </div>

                {/* Minimum Order Total */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                    Minimum Order Total (ETB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.minimum_order_total}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimum_order_total: e.target.value,
                      })
                    }
                    disabled={!isEditingActive}
                    className={`w-full border rounded-md p-1.5 text-xs ${!isEditingActive ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"}`}
                  />
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    0 means no minimum for this company.
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN - Images, Status & Buttons - WIDER for banner */}
              <div className="w-72 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-160px)]">
                {/* Logo Upload - LEFT ALIGNED (not centered) */}
                <div className="relative w-32">
                  <div className={!isEditingActive ? "opacity-70" : ""}>
                    <DragDropImageUpload
                      label="Logo (Square)"
                      value={formData.logo}
                      onChange={(file) =>
                        setFormData((prev) => ({ ...prev, logo: file }))
                      }
                      previewUrl={logoPreview}
                      required={false}
                      disabled={!isEditingActive}
                    />
                  </div>
                  {!isEditingActive && (
                    <div className="absolute inset-0 cursor-not-allowed z-10"></div>
                  )}
                  <p className="text-[8px] text-gray-400 text-left mt-1">
                    Square image (1:1 ratio)
                  </p>
                </div>

                {/* Cover Image Upload - HORIZONTALLY WIDE (now column is wider) */}
                <div className="relative w-full">
                  <div className={!isEditingActive ? "opacity-70" : ""}>
                    <div className="w-full">
                      <div className="w-full bg-gradient-to-r from-purple-100/40 to-indigo-100/40 rounded-xl p-2 border-2 border-[#6750A4]/30 shadow-sm">
                        <DragDropImageUpload
                          label="🎬 COVER IMAGE (Wide Banner)"
                          value={formData.cover_image}
                          onChange={(file) =>
                            setFormData((prev) => ({
                              ...prev,
                              cover_image: file,
                            }))
                          }
                          previewUrl={coverPreview}
                          disabled={!isEditingActive}
                        />
                      </div>
                    </div>
                  </div>
                  {!isEditingActive && (
                    <div className="absolute inset-0 cursor-not-allowed z-10"></div>
                  )}
                  <p className="text-[8px] text-gray-400 text-center mt-1">
                    📐 16:9 banner ratio - fits full width
                  </p>
                </div>

                {/* Status Section */}
                <div className="pt-1 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      disabled={!isEditingActive}
                      className="h-3.5 w-3.5 text-[#6750A4] rounded border-gray-300"
                    />
                    <span
                      className={`text-[11px] ${!isEditingActive ? "text-gray-500" : "text-gray-700"}`}
                    >
                      Active
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_featured: e.target.checked,
                        })
                      }
                      disabled={!isEditingActive}
                      className="h-3.5 w-3.5 text-[#6750A4] rounded border-gray-300"
                    />
                    <span
                      className={`text-[11px] ${!isEditingActive ? "text-gray-500" : "text-gray-700"}`}
                    >
                      Featured
                    </span>
                  </label>
                </div>

                {/* Buttons - Only in edit mode */}
                {isEditingActive && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-[#6750A4] to-[#7c63b8] text-white px-2 py-1.5 rounded-md text-xs font-semibold hover:from-[#5b4694] hover:to-[#6b55a8] transition-all duration-300 disabled:opacity-50 shadow-sm"
                    >
                      {submitting
                        ? "Saving..."
                        : editingSlug
                          ? "Update"
                          : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={closeInlineEdit}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* View mode message */}
                {!isEditingActive && (
                  <div className="text-center py-2 text-gray-500 text-[10px] bg-gray-50 rounded-md border border-gray-100 mt-2">
                    🔒 View only
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

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
