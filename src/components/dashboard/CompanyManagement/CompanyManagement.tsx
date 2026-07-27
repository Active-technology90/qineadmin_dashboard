// src/components/admin/CompanyManagement/CompanyManagement.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Plus, MapPin } from "lucide-react";
import api from "../../../services/api";
import {
  createCompany,
  updateCompany,
  deleteCompany,
  getCategories,
  getSubCategories,
  getCompanyDetail,
  getHeadCompanies,
} from "../../../services/api";
import type {
  CompanyListItem,
  Category,
  SubCategory,
  Company,
  HeadCompany,
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
import LocationPickerModal from "./LocationPickerModal";

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
  const isMarketing = !!user?.is_marketing;
  const isSuperAdmin = !user?.memberships?.length && !isMarketing;
  const memberships = user?.memberships ?? [];
  const primaryMembership = !isSuperAdmin && !isMarketing
    ? getPrimaryMembership(memberships)
    : null;
  // const userCompanySlug = primaryMembership?.company_slug ?? null;
  const userCompanyRole = primaryMembership?.role ?? null;

  // Get role for currently selected company
  const getCurrentCompanyRole = () => {
    if (isSuperAdmin) return "super_admin";
    if (!currentCompany?.slug || !memberships.length) return userCompanyRole;
    const membership = memberships.find(
      (m) => m.company_slug === currentCompany.slug,
    );
    return membership?.role || userCompanyRole;
  };

  const currentCompanyRole = getCurrentCompanyRole();

  const canAddCompany = isSuperAdmin || isMarketing;
  const canDeleteCompany = isSuperAdmin;
  const canEditCompany = useCallback(
    (companySlug: string) => {
      if (isSuperAdmin || isMarketing) return true;
      // Get the role for the specific company being edited
      const membershipForCompany = memberships.find(
        (m) => m.company_slug === companySlug,
      );
      const roleForCompany = membershipForCompany?.role;
      return roleForCompany === "owner" || roleForCompany === "admin";
    },
    [isSuperAdmin, isMarketing, memberships],
  );

  // Data states
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [headCompanies, setHeadCompanies] = useState<HeadCompany[]>([]);
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
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    name_am: "",
    slug: "",
    head_company: null,
    category: 0,
    sub_category: 0,
    business_type: "",
    address: "",
    address_am: "",
    description: "",
    description_am: "",
    minimum_order_total: "0.00",
    latitude: "",
    longitude: "",
    delivery_fee_per_km: "0.00",
    is_active: true,
    is_featured: false,
    supports_table_service: false,
    logo: null,
    cover_image: null,
  });
  const [originalFormData, setOriginalFormData] =
    useState<CompanyFormData | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyListItem | null>(
    null,
  );
  const { toast, showToast } = useToast();
  const [isEditingActive, setIsEditingActive] = useState(false);

  // Filtered companies (super admin or marketing agent)
  const filteredCompanies = useMemo(() => {
    if (!isSuperAdmin && !isMarketing) return companies;
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
    isSuperAdmin || isMarketing ? filteredCompanies : companies,
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
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ImageIcon size={16} className="text-gray-400" />
            </div>
          ),
      },
      {
        key: "name",
        header: "Name",
        sortable: true,
        className:
          "font-medium text-gray-900 max-w-[120px] sm:max-w-[200px] break-words",
      },
      {
        key: "slug",
        header: "Slug",
        sortable: true,
        className:
          "font-mono text-gray-500 max-w-[100px] sm:max-w-[150px] break-words",
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
        key: "address",
        header: "Address",
        sortable: true,
        render: (comp) => comp.address || "-",
      },

      // {
      //   key: "head_company",
      //   header: "Head Company",
      //   sortable: true,
      //   render: (comp) => comp.head_company_detail?.name || "-",
      // },

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
      if (!isSuperAdmin && !isMarketing && currentCompany?.slug) {
        const companyRes = await getCompanyDetail(currentCompany.slug);
        const company = companyRes.data as Company;
        const companyListItem: CompanyListItem = {
          id: company.id,
          name: company.name,
          name_am: company.name_am || "",
          slug: company.slug,
          logo: company.logo,
          cover_image: company.cover_image,
          head_company: company.head_company ?? null,
          head_company_detail: company.head_company_detail ?? null,
          category: company.category,
          category_name: company.category_name,
          sub_category: company.sub_category,
          sub_category_name: company.sub_category_name,
          business_type: company.business_type,
          minimum_order_total: company.minimum_order_total || "0.00",
          latitude: company.latitude || "",
          longitude: company.longitude || "",
          delivery_fee_per_km: company.delivery_fee_per_km || "0.00",
          is_active: company.is_active,
          is_featured: company.is_featured,
          supports_table_service: company.supports_table_service,
          description: company.description || "",
          address: company.address || "",
          address_am: (company as any).address_am || "", // may not be in the typed response
        };
        setCompanies([companyListItem]);
        // Load form data for inline edit
        setEditingSlug(companyListItem.slug);
        setFormData({
          name: companyListItem.name,
          name_am: companyListItem.name_am || "",
          slug: companyListItem.slug,
          head_company: companyListItem.head_company ?? null,
          category: companyListItem.category,
          sub_category: companyListItem.sub_category,
          business_type: companyListItem.business_type,
          address: companyListItem.address || "",
          address_am: (companyListItem as any).address_am || "",
          description: companyListItem.description || "",
          description_am: (companyListItem as any).description_am || "",
          minimum_order_total: companyListItem.minimum_order_total || "0.00",
          latitude: companyListItem.latitude || "",
          longitude: companyListItem.longitude || "",
          delivery_fee_per_km: companyListItem.delivery_fee_per_km || "0.00",
          is_active: companyListItem.is_active,
          is_featured: companyListItem.is_featured,
          supports_table_service: companyListItem.supports_table_service,
          logo: null,
          cover_image: null,
          
        });
        if (companyListItem.logo) setLogoPreview(companyListItem.logo);
        if (companyListItem.cover_image)
          setCoverPreview(companyListItem.cover_image);
      } else if (isSuperAdmin || isMarketing) {
        let allCompanies: CompanyListItem[] = [];
        const extraParam = isMarketing ? "&my_registrations=true" : "";
        let nextUrl: string | null = `/companies/?page=1&ordering=name${extraParam}`;
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
          const newFormData = {
            name: first.name,
            name_am: first.name_am || "",
            slug: first.slug,
            head_company: first.head_company ?? null,
            category: first.category,
            sub_category: first.sub_category,
            business_type: first.business_type,
            address: first.address || "",
            address_am: (first as any).address_am || "",
            description: first.description || "",
            description_am: (first as any).description_am || "",
            minimum_order_total: first.minimum_order_total || "0.00",
            latitude: first.latitude || "",
            longitude: first.longitude || "",
            delivery_fee_per_km: first.delivery_fee_per_km || "0.00",
            is_active: first.is_active,
            is_featured: first.is_featured,
            supports_table_service: first.supports_table_service,
            logo: null,
            cover_image: null,
          };
          setFormData(newFormData);
          setOriginalFormData({
            ...newFormData,
            logo: first.logo as any,
            cover_image: first.cover_image as any,
          });
          if (first.logo) setLogoPreview(first.logo);
          if (first.cover_image) setCoverPreview(first.cover_image);
        }
      } else {
        setCompanies([]);
      }
      const [categoriesRes, subcategoriesRes, headCompaniesRes] =
        await Promise.all([
          getCategories(),
          getSubCategories(),
          getHeadCompanies(),
        ]);
      setCategories(categoriesRes.data);
      setSubcategories(subcategoriesRes.data);
      const headData = headCompaniesRes.data;
      setHeadCompanies(
        Array.isArray(headData) ? headData : (headData.results ?? []),
      );
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
    if (!formData.address.trim()) errors.address = "Address is required";
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
        // Safe string comparison helper
        const cleanString = (val: any) =>
          val === null || val === undefined ? "" : String(val).trim();

        // Safe float comparison helper (coordinates / prices)
        const cleanFloat = (val: any) => {
          if (val === null || val === undefined || val === "") return 0;
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 0 : parsed;
        };

        const compareFloats = (val1: any, val2: any) => {
          return Math.abs(cleanFloat(val1) - cleanFloat(val2)) > 0.000001;
        };

        // Text & Select Fields
        if (cleanString(formData.name) !== cleanString(originalFormData.name))
          return true;
        if (
          cleanString(formData.name_am) !==
          cleanString(originalFormData.name_am)
        )
          return true;
        if (Number(formData.category) !== Number(originalFormData.category))
          return true;
        if (
          Number(formData.sub_category) !==
          Number(originalFormData.sub_category)
        )
          return true;
        if (
          cleanString(formData.business_type) !==
          cleanString(originalFormData.business_type)
        )
          return true;
        if (
          cleanString(formData.address) !==
          cleanString(originalFormData.address)
        )
          return true;
        if (
          cleanString(formData.address_am) !==
          cleanString(originalFormData.address_am)
        )
          return true;
        if (
          Number(formData.head_company ?? 0) !==
          Number(originalFormData.head_company ?? 0)
        )
          return true;
        if (
          cleanString(formData.description) !==
          cleanString(originalFormData.description)
        )
          return true;
        if (
          cleanString(formData.description_am) !==
          cleanString(originalFormData.description_am)
        )
          return true;

        // Floats and Decimals (Monetary & Coordinates)
        if (
          compareFloats(
            formData.minimum_order_total,
            originalFormData.minimum_order_total,
          )
        )
          return true;
        if (compareFloats(formData.latitude, originalFormData.latitude))
          return true;
        if (compareFloats(formData.longitude, originalFormData.longitude))
          return true;
        if (
          compareFloats(
            formData.delivery_fee_per_km,
            originalFormData.delivery_fee_per_km,
          )
        )
          return true;

        // Booleans
        if (Boolean(formData.is_active) !== Boolean(originalFormData.is_active))
          return true;
        if (
          Boolean(formData.is_featured) !==
          Boolean(originalFormData.is_featured)
        )
          return true;
        if (
          Boolean(formData.supports_table_service) !==
          Boolean(originalFormData.supports_table_service)
        )
          return true;

        // File Uploads
        if (formData.logo !== null) return true;
        if (formData.cover_image !== null) return true;

        return false;
      };

      const changesExist = hasChanges();
      console.log("Changes detected:", changesExist);
      console.log("Form data logo:", formData.logo);
      console.log("Original logo:", originalFormData.logo);
      console.log("Form data cover:", formData.cover_image);
      console.log("Original cover:", originalFormData.cover_image);

      if (!changesExist) {
        showToast("info", "No changes detected. Update canceled.");
        // Close edit mode without submitting
        if (!isSuperAdmin && !isMarketing) {
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
      // Always use FormData to handle image deletion
      const formPayload = new FormData();

      formPayload.append("name", formData.name);

      if (formData.name_am) formPayload.append("name_am", formData.name_am);

      if (formData.slug) formPayload.append("slug", formData.slug);

      formPayload.append("category", String(formData.category));

      formPayload.append("sub_category", String(formData.sub_category));

      // head_company: send the id, or "" to clear it (backend treats "" as null).
      // Ignored by the backend for non-superusers (read-only there).
      formPayload.append(
        "head_company",
        formData.head_company ? String(formData.head_company) : "",
      );

      formPayload.append("business_type", formData.business_type);
      if (formData.address) {
        formPayload.append("address", formData.address);
      }
      if (formData.address_am) {
        formPayload.append("address_am", formData.address_am);
      }

      if (formData.description) {
        formPayload.append("description", formData.description);
      }
      if (formData.description_am) {
        formPayload.append("description_am", formData.description_am);
      }

      formPayload.append(
        "minimum_order_total",
        formData.minimum_order_total || "0.00",
      );

      if (formData.latitude) {
        formPayload.append("latitude", formData.latitude);
      }
      if (formData.longitude) {
        formPayload.append("longitude", formData.longitude);
      }
      formPayload.append(
        "delivery_fee_per_km",
        formData.delivery_fee_per_km || "0.00",
      );

      formPayload.append("is_active", String(formData.is_active));

      formPayload.append("is_featured", String(formData.is_featured));

      formPayload.append(
        "supports_table_service",
        String(formData.supports_table_service),
      );

      // Handle logo: only send if user uploaded a new file OR intentionally removed it
      // Do NOT send anything if the logo hasn't changed (formData.logo is null and original had image but user didn't click remove)
      if (formData.logo instanceof File) {
        formPayload.append("logo", formData.logo);
      } else if (
        formData.logo === null &&
        originalFormData?.logo &&
        logoPreview === null
      ) {
        // User removed the image (logoPreview is null confirms they clicked remove)
        formPayload.append("logo", "");
      }

      // Handle cover_image: only send if user uploaded a new file OR intentionally removed it
      if (formData.cover_image instanceof File) {
        formPayload.append("cover_image", formData.cover_image);
      } else if (
        formData.cover_image === null &&
        originalFormData?.cover_image &&
        coverPreview === null
      ) {
        // User removed the cover image (coverPreview is null confirms they clicked remove)
        formPayload.append("cover_image", "");
      }

      if (editingSlug) {
        await updateCompany(editingSlug, formPayload);
      } else {
        await createCompany(formPayload);
      }

      showToast(
        "success",
        editingSlug
          ? "Company updated successfully"
          : "Company created successfully",
      );

      // close modal smoothly
      setModalOpen(false);
      setIsEditingActive(false);

      setTimeout(async () => {
        resetForm();
        await fetchData();
      }, 250);
    } catch (err: any) {
      console.error("Company registration submit error:", err.response?.data || err);
      if (err?.response?.status === 401) {
        showToast("error", "Session expired. Please refresh the page.");
      } else {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          (err.response?.data ? JSON.stringify(err.response.data) : null) ||
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
      head_company: null,
      category: 0,
      sub_category: 0,
      business_type: "",
      address: "",
      address_am: "",
      description: "",
      description_am: "",
      minimum_order_total: "0.00",
      latitude: "",
      longitude: "",
      delivery_fee_per_km: "0.00",
      is_active: true,
      is_featured: false,
      supports_table_service: false,
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
        head_company: company.head_company ?? null,
        category: company.category,
        sub_category: company.sub_category,
        business_type: company.business_type,
        address: company.address || "",
        address_am: (company as any).address_am || "",
        description: company.description || "",
        description_am: (company as any).description_am || "",
        minimum_order_total: company.minimum_order_total || "0.00",
        latitude: company.latitude || "",
        longitude: company.longitude || "",
        delivery_fee_per_km: company.delivery_fee_per_km || "0.00",
        is_active: company.is_active,
        is_featured: company.is_featured,
        supports_table_service: company.supports_table_service,
        logo: null,
        cover_image: null,
      };
      setFormData(newFormData);
      // Save original data for change detection (including original image URLs)
      setOriginalFormData({
        ...newFormData,
        logo: company.logo as any,
        cover_image: company.cover_image as any,
      });
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
        title: <span className="text-secondary">Basic Information</span>,
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Company Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter company name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className={`w-full border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary ${formErrors.name ? "border-red-500" : "border-gray-300"}`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Name (Amharic)
              </label>
              <input
                type="text"
                placeholder="Enter company name in Amharic"
                value={formData.name_am}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name_am: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
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
                className={`w-full border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary ${formErrors.category ? "border-red-500" : "border-gray-300"}`}
              >
                <option value={0}>Select Category</option>
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Subcategory <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.sub_category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sub_category: Number(e.target.value),
                  }))
                }
                className={`w-full border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary ${!formData.category ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"} ${formErrors.sub_category ? "border-red-500" : "border-gray-300"}`}
                disabled={!formData.category}
                style={{
                  cursor: !formData.category ? "not-allowed" : "default",
                }}
              >
                <option value={0}>Select Subcategory</option>
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.business_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    business_type: e.target.value,
                  }))
                }
                className={`w-full border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary ${formErrors.business_type ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select Business Type</option>
                <option value="brand">Company</option>
                <option value="store">Store</option>
                <option value="service">Service</option>
                <option value="delivery_service">Delivery Service</option>
              </select>
              {formErrors.business_type && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.business_type}
                </p>
              )}
            </div>
            {/* Address Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Address
              </label>
              <input
                type="text"
                placeholder="Street, city, area..."
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary"
              />
              <p className="text-xs text-gray-400 mt-1">
                Optional – physical address of the company.
              </p>
            </div>
            {/* Address (Amharic) - ADD THIS BLOCK */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Address (Amharic)
              </label>
              <input
                type="text"
                placeholder="አድራሻ በአማርኛ (ከሆነ)"
                value={formData.address_am}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address_am: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary"
              />
              <p className="text-xs text-gray-400 mt-1">
                Optional – Amharic version of the company address.
              </p>
            </div>

            {/* 📍 GPS Coordinates & Map Picker - MOVED HERE (below Address) */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Company Location (GPS)
                </label>
                {/* <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="text-xs text-secondary hover:text-[#5b4694] font-extrabold flex items-center gap-1 hover:underline transition-all cursor-pointer"
                >
                  <MapPin className="h-3 w-3" />
                  Pick on Map
                </button> */}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        latitude: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base pr-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary border-gray-300"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-extrabold text-gray-400 select-none">
                    LAT
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        longitude: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base pr-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary border-gray-300"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-extrabold text-gray-400 select-none">
                    LON
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="mt-2 w-full py-2.5 border border-dashed border-secondary/40 hover:border-secondary hover:bg-purple-50/30 text-secondary rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-[0.99]"
              >
                <MapPin className="h-3.5 w-3.5" />
                Choose Location on Map Picker
              </button>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Head Company
              </label>
              <select
                value={formData.head_company ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    head_company: val === 0 ? null : val,
                  }));
                }}
                className={`w-full border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary ${formErrors.head_company ? "border-red-500" : "border-gray-300"}`}
              >
                <option value={0}>— None (standalone) —</option>
                {headCompanies.map((head) => (
                  <option key={head.id} value={head.id}>
                    {head.name}
                  </option>
                ))}
              </select>
              {formErrors.head_company && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.head_company}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Group this company under a parent head company. A head can span
                any categories - each branch keeps its own category.
              </p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., my-company-slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                disabled={!!editingSlug}
                className={`w-full border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary ${formErrors.slug ? "border-red-500" : "border-gray-300"}
               ${editingSlug ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
              />
              {formErrors.slug && (
                <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
              )}
            </div>
            {/* Description - English & Amharic side by side */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {/* English Description */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Enter company description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary"
                    rows={3}
                  />
                </div>

                {/* Amharic Description */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Description (Amharic)
                  </label>
                  <textarea
                    placeholder="የኩባንያ መግለጫ በአማርኛ (ከሆነ)"
                    value={formData.description_am}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description_am: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-30 focus:border-secondary"
                    rows={3}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Optional – Amharic version of the company description.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
        validate: validateBasicInfo,
      },
      {
        id: "images",
        title: <span className="text-secondary">Images & Status</span>,
        content: (
          <div className="space-y-8">
            {/* Logo and Cover Image - Side by Side */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-secondary to-secondary-light"></div>
                Company Images
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <DragDropImageUpload
                      label="Logo"
                      size="sm"
                      value={formData.logo}
              onChange={(file) =>
                setFormData((prev) => ({ ...prev, logo: file }))
              }
              previewUrl={logoPreview}
              required={false}
            />
            </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Square image recommended (1:1 ratio)</p>
                </div> */}
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Logo
                    </label>
                    <div
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 p-3 flex flex-col items-center justify-center transition-all duration-300 hover:border-secondary hover:bg-gray-50/80 min-h-[140px] sm:min-h-[160px]"
                      style={{ height: "auto" }}
                    >
                      <input
                        type="file"
                        id="company-logo-upload"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              alert("File must be smaller than 5MB");
                              return;
                            }
                            setFormData((prev) => ({ ...prev, logo: file }));
                            setLogoPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {logoPreview ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                          <div className="relative group/preview">
                            <img
                              src={logoPreview}
                              alt="Logo Preview"
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-lg ring-2 ring-secondary/20"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-[10px] font-medium">
                                Preview
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, logo: null }));
                              setLogoPreview(null);
                              const fileInput = document.getElementById(
                                "company-logo-upload",
                              ) as HTMLInputElement;
                              if (fileInput) fileInput.value = "";
                            }}
                            className="mt-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                            title="Remove image"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="company-logo-upload"
                          className="flex flex-col items-center justify-center cursor-pointer w-full h-full transition-all duration-200 hover:scale-102 py-4"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:shadow-md">
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6 text-secondary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <span className="text-[11px] sm:text-xs font-semibold text-gray-600">
                            Upload Logo
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5">
                            PNG, JPG up to 5MB
                          </span>
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Square image recommended (1:1 ratio)
                    </p>
                  </div>
                </div>
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <DragDropImageUpload
                      label="Cover Image"
                      value={formData.cover_image}
                      onChange={(file) =>
                        setFormData((prev) => ({ ...prev, cover_image: file }))
                      }
                      previewUrl={coverPreview}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Wide banner recommended (16:9 ratio)
                  </p>
                </div>
              </div>
            </div>

            {/* Status Settings */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-secondary to-secondary-light"></div>
                Status Settings
              </h4>
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                <div className="flex flex-wrap items-center gap-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-secondary rounded border-gray-300 focus:ring-secondary focus:ring-2 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-secondary transition-colors">
                        Active
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Company is visible to customers
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_featured: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-secondary rounded border-gray-300 focus:ring-secondary focus:ring-2 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-secondary transition-colors">
                        Featured
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Highlighted on homepage and listings
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.supports_table_service}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          supports_table_service: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-secondary rounded border-gray-300 focus:ring-secondary focus:ring-2 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-secondary transition-colors">
                        OnSpot Service
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Enable table service for this company
                      </p>
                    </div>
                  </label>
                </div>
              </div>
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
      headCompanies,
      logoPreview,
      coverPreview,
    ],
  );

  if (error) return <ErrorView error={error} onRetry={fetchData} />;

  return (
    <div className="max-w-full  min-h-screen">
      <Toast toast={toast} />
      <div className="p-2  sm:p-4 md:p-4 lg:p-6 space-y-3 sm:space-y-3 md:space-y-4">
        {/* Header Section - Premium & Responsive */}
        <div className="pt-1 px-2 sm:pt-3 md:pt-4 flex justify-between items-center gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            {loading && !isSuperAdmin ? (
              <div className="animate-pulse">
                <div className="h-6 sm:h-7 md:h-8 bg-gray-200 rounded w-48 sm:w-56 mb-2" />
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-gray-200" />
                  <div className="h-4 bg-gray-200 rounded w-64 sm:w-80" />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-base sm:text-sm md:text-xl font-bold text-secondary truncate">
                  {isSuperAdmin || isMarketing ? "Companies" : "Company Detail"}
                </h2>
                {!isSuperAdmin && !isMarketing && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#674FA3]"></span>
                    Manage your company details and settings
                  </p>
                )}
              </>
            )}
          </div>
          {canAddCompany && (
            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="bg-secondary text-white px-4 sm:px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-[#5b4694] transition shadow-sm text-sm sm:text-base flex-shrink-0"
            >
              <Plus size={18} className=" w-3 h-3 sm:w-5 sm:h-5" />
              <span className="hidden md:inline">Add Company</span>
              <span className="inline xs:hidden text-xs">Add</span>
            </button>
          )}
        </div>

        {/* Filters Section (super admin or marketing) with premium card styling */}
        {(isSuperAdmin || isMarketing) && (
          // <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-5">

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
          // </div>
        )}

        {/* Main content views with responsive overflow handling */}
        {isSuperAdmin || isMarketing ? (
          <div className=" ">
            <SuperAdminView
              // Original data / layout props
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
              // --- Mobile filter props (new) ---
              inputValue={inputValue}
              onInputChange={handleInputChange}
              onSortChange={onSortChange} // the wrapper that calls handleSort
              businessTypeFilter={businessTypeFilter}
              onBusinessTypeChange={setBusinessTypeFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              subCategoryFilter={subCategoryFilter}
              onSubCategoryChange={setSubCategoryFilter}
              businessTypeOptions={businessTypeOptions}
              categoryOptions={categoryOptions}
              subCategoryOptions={subCategoryOptions}
              onClearAll={clearAllFilters}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <NonSuperAdminView
              companies={companies}
              userCompanyRole={currentCompanyRole}
              onEdit={openEdit}
              loading={loading}
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
              headCompanyName={
                headCompanies.find((h) => h.id === formData.head_company)
                  ?.name ??
                companies[0]?.head_company_detail?.name ??
                null
              }
              onSubmit={handleSubmit}
              onCloseForm={closeInlineEdit}
            />
          </div>
        )}

        {/* Modals - already responsive via underlying components */}
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
          deleteTitle={
            "Delete Company"
          }
          onCancel={() => setDeleteTarget(null)}
        />
      </div>

      {/* Location Picker Modal */}
      {showMapPicker && (
        <LocationPickerModal
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onSelect={(selectedLat, selectedLon) => {
            setFormData((prev) => ({
              ...prev,
              latitude: selectedLat,
              longitude: selectedLon,
            }));
          }}
          onSelectAddress={(address) => {
            setFormData((prev) => ({
              ...prev,
              address: address,
            }));
          }}
          initialLat={formData.latitude}
          initialLon={formData.longitude}
          initialAddress={formData.address}
        />
      )}
    </div>
  );
}
