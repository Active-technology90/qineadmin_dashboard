// src/components/admin/ServiceManagement.tsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Plus,
  Filter,
  Users,
  BarChart3,
  Search,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Package,
  Activity,
  DollarSign,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Clock,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Shield,
  Tag,
  Layers,
} from "lucide-react";
import type { Service, Category } from "../../types";
import type { ServiceGroup } from "../../mock/serviceApi";
import { SearchInput } from "../ui/SearchInput";
import { TableControls } from "../ui/TableControls";
import { Pagination } from "../ui/Pagination";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { ErrorView } from "../ui/ErrorView";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { usePagination } from "../../hooks/usePagination";
import { useSorting } from "../../hooks/useSorting";
import { useReadOnly } from "./AdminDashboard";
import { CustomSelect, type SelectOption } from "../ui/CustomSelect";
import FilterSortSheet from "../ui/FilterSortSheet";
import ServiceTable from "./service-management/ServiceTable";
import ServiceFormModal from "./service-management/ServiceFormModal";
import ServiceFieldsModal from "./service-management/ServiceFieldsModal";
import ServiceCompaniesModal from "./service-management/ServiceCompaniesModal";
import ProviderApproval from "./service-management/ProviderApproval";
import CategoriesManagement from "./service-management/CategoriesManagement";
import PricingPolicySettings from "./service-management/PricingPolicy";
import ComplianceManagement from "./service-management/ComplianceManagement";
import PromotionsManagement from "./service-management/PromotionsManagement";
import AdvancedReports from "./service-management/AdvancedReports";
import ServiceDetailModal from "./service-management/ServiceDetailModal";
import ServiceGroupManagement from "./service-management/ServiceGroupManagement";
import {
  fetchServices,
  fetchCategoriesMock,
  createService,
  updateService,
  deleteService,
  updateServiceFields,
  updateServiceCompanies,
  MOCK_COMPANIES,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  getBookings,
  type Booking,
  type ApiResponse,
  type BookingFilterParams,
  type User,
  fetchServiceGroups,
} from "../../mock/serviceApi";
import BookingsManagement from "./service-management/BookingsManagement";
import AdminDashboard from "./service-management/AdminDashboard";
import ProviderDashboard from "./provider/ProviderDashboard";

const MemoizedPagination = React.memo(Pagination);

type Tab =
   | "admin-dashboard"
  | "provider-dashboard"
  | "services"
  | "service-groups"
  | "provider-approval"
  | "categories"
  | "pricing"
  | "compliance"
  | "promotions"
  | "reports"
  | "bookings";

// ----- Helpers -----
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// ----- Tab metadata -----
const TAB_META: Record<
  Tab,
  { label: string; icon: React.FC<any>; description: string }
  > = {
   "admin-dashboard": {
    label: "Admin Dashboard",
    icon: BarChart3,
    description: "High‑level admin overview",
  },
  "provider-dashboard": {
    label: "Provider Dashboard",
    icon: Users,
    description: "Provider performance metrics",
  },
  services: {
    label: "All Services",
    icon: Package,
    description: "View and manage all services",
  },
  "service-groups": {
    label: "Service Groups",
    icon: Layers,
    description: "Manage service categories and their collections",
  },
  "provider-approval": {
    label: "Provider Approval",
    icon: ShieldCheck,
    description: "Review and approve service providers",
  },
  categories: {
    label: "Service Categories",
    icon: Package,
    description: "Organise services into categories",
  },
  pricing: {
    label: "Pricing Policy",
    icon: DollarSign,
    description: "Set global pricing rules and commissions",
  },
  compliance: {
    label: "Customer Compliance",
    icon: Shield,
    description: "Verify customer documents and compliance",
  },
  promotions: {
    label: "Promotions",
    icon: Tag,
    description: "Create and manage discount promotions",
  },
  reports: {
    label: "Advanced Reports",
    icon: Activity,
    description: "Detailed reports and exportable data",
  },
  "bookings": {
  label: "Bookings",
  icon: ShoppingBag,
  description: "Manage customer bookings and appointments",
},

};

// ----- Skeleton Components -----
const SkeletonStatCard = () => (
  <div className="animate-pulse rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-gray-200" />
        <div className="h-8 w-24 rounded bg-gray-200" />
      </div>
      <div className="h-10 w-10 rounded-full bg-gray-200" />
    </div>
  </div>
);

const SkeletonTable = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-10 w-full rounded bg-gray-200" />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 w-full rounded bg-gray-100" />
    ))}
  </div>
);

// ----- StatCard Component -----
const StatCard = ({
  label,
  value,
  icon,
  change,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: { value: number; positive: boolean };
  color: string;
}) => {
  const changeColor =
    change?.positive === undefined
      ? "text-gray-500"
      : change.positive
      ? "text-emerald-600"
      : "text-rose-600";

  return (
    <div className="group rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-secondary">{value}</p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${changeColor}`}>
              {change.positive ? (
                <TrendingUp className="inline h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="inline h-3 w-3 mr-1" />
              )}
              {change.value}% from last month
            </p>
          )}
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${color} p-3 shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ----- EmptyState Component -----
const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
    <Package className="h-12 w-12 text-gray-400" />
    <h3 className="mt-4 text-lg font-semibold text-gray-800">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ----- Main Component -----
export default function ServiceManagement() {
  const readOnly = useReadOnly();
  const [activeTab, setActiveTab] = useState<Tab>("services");

  // Services state
  const [pageSize, setPageSize] = useState(10);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState("all");
  const [tempStatus, setTempStatus] = useState("all");
  const [tempSort, setTempSort] = useState("title|asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const [fieldsTarget, setFieldsTarget] = useState<Service | null>(null);
  const [companiesTarget, setCompaniesTarget] = useState<Service | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingService, setViewingService] = useState<Service | null>(null);
const [bookings, setBookings] = useState<Booking[]>([]);
const [bookingsLoading, setBookingsLoading] = useState(false);

  // Users state (kept for potential future use)
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);

  // Groups state
  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const { toast, showToast } = useToast();

  // ----- Data fetching (services) -----
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [servicesData, categoriesData] = await Promise.all([
        fetchServices(),
        fetchCategoriesMock(),
      ]);
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ----- Data fetching (users) -----
  const fetchUsersData = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsersData();
    }
  }, [activeTab, fetchUsersData]);

  // Fetch groups when tab active
  useEffect(() => {
    if (activeTab === "service-groups") {
      setGroupsLoading(true);
      fetchServiceGroups().then(setGroups).finally(() => setGroupsLoading(false));
    }
  }, [activeTab]);
// useEffect(() => {
//   if (activeTab === "bookings") {
//     setBookingsLoading(true);
//     fetchBookings().then(setBookings).finally(() => setBookingsLoading(false));
//   }
// }, [activeTab]);

  // ----- Filters & sorting -----
  const filteredServices = useMemo(() => {
    let filtered = services;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((s) => s.service_category === categoryFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((s) => s.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((s) => !s.is_active);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((s) => {
        const titleMatch = s.title?.toLowerCase().includes(term) ?? false;
        const slugMatch = s.slug?.toLowerCase().includes(term) ?? false;
        const descMatch = s.description?.toLowerCase().includes(term) ?? false;
        const catMatch = s.service_category?.toLowerCase().includes(term) ?? false;
        const tagsMatch =
          s.tags?.some((tag) => tag.toLowerCase().includes(term)) ?? false;
        return titleMatch || slugMatch || descMatch || catMatch || tagsMatch;
      });
    }

    return filtered;
  }, [services, searchTerm, categoryFilter, statusFilter]);

  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    filteredServices,
    "title",
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

  useEffect(() => {
    resetPage();
  }, [searchTerm, pageSize, categoryFilter, statusFilter, resetPage]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearchTerm(value), 200);
  };

  useEffect(() => {
    if (sheetOpen) {
      setTempCategory(categoryFilter);
      setTempStatus(statusFilter);
      setTempSort(`${sortField}|${sortOrder}`);
    }
  }, [sheetOpen, categoryFilter, statusFilter, sortField, sortOrder]);

  const applyMobileFilters = () => {
    if (tempSort !== `${sortField}|${sortOrder}`) {
      const [field, desiredOrder] = tempSort.split("|");
      if (field === sortField) {
        if (desiredOrder !== sortOrder) handleSort(field);
      } else {
        handleSort(field);
        if (desiredOrder === "desc") handleSort(field);
      }
    }
    setCategoryFilter(tempCategory);
    setStatusFilter(tempStatus);
    setSheetOpen(false);
  };

  const clearAllFilters = () => {
    setInputValue("");
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setSheetOpen(false);
  };

  // ----- Service CRUD -----
  const handleCreate = () => {
    setEditingService(null);
    setViewingService(null);
    setModalOpen(true);
  };
  const handleEdit = (service: Service) => {
    if (readOnly) return;
    setEditingService(service);
    setViewingService(null);
    setModalOpen(true);
  };
  const handleView = (service: Service) => {
    setViewingService(service);
    setDetailModalOpen(true);
  };
  const handleDelete = async (service: Service) => {
    if (readOnly) return;
    setDeleteTarget(service);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService(deleteTarget.slug);
      showToast("success", "Service deleted successfully");
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      showToast("error", err.message || "Delete failed");
    }
  };

  const onSubmit = async (formData: any) => {
    if (readOnly) return;
    try {
      if (editingService) {
        await updateService(editingService.slug, formData);
        showToast("success", "Service updated successfully");
      } else {
        await createService(formData);
        showToast("success", "Service created successfully");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast("error", err.message || "Operation failed");
    }
  };

  // ----- Manage fields & companies -----
  const handleManageFields = (service: Service) => {
    if (readOnly) return;
    setFieldsTarget(service);
  };
  const handleManageCompanies = (service: Service) => {
    if (readOnly) return;
    setCompaniesTarget(service);
  };

  const saveFields = async (slug: string, fields: any[]) => {
    await updateServiceFields(slug, fields);
    showToast("success", "Fields updated");
    setFieldsTarget(null);
    fetchData();
  };

  const saveCompanies = async (slug: string, companyIds: number[]) => {
    await updateServiceCompanies(slug, companyIds);
    showToast("success", "Companies updated");
    setCompaniesTarget(null);
    fetchData();
  };

  // ----- User CRUD (kept for potential future use) -----
  const handleUserCreate = () => {
    setEditingUser(null);
    setUserModalOpen(true);
  };
  const handleUserEdit = (user: User) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };
  const handleUserDelete = (user: User) => {
    setDeleteUserTarget(user);
  };
  const confirmUserDelete = async () => {
    if (!deleteUserTarget) return;
    try {
      await deleteUser(deleteUserTarget.id);
      showToast("success", "User deleted");
      setDeleteUserTarget(null);
      fetchUsersData();
    } catch (err: any) {
      showToast("error", err.message || "Delete failed");
    }
  };
  const onUserSubmit = async (formData: Omit<User, "id" | "createdAt">) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        showToast("success", "User updated");
      } else {
        await createUser(formData);
        showToast("success", "User created");
      }
      setUserModalOpen(false);
      fetchUsersData();
    } catch (err: any) {
      showToast("error", err.message || "Save failed");
    }
  };

  // Filtered users (search)
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const term = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }, [users, userSearch]);

  // ----- Statistics (services tab) -----
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.is_active).length;
  const totalOrders = services.reduce((sum, s) => sum + (s.orders_count || 0), 0);
  const totalRevenue = services.reduce((sum, s) => sum + (s.revenue || 0), 0);

  const getChange = (value: number) => {
    const change = Math.round((Math.random() * 10 - 2) * 10) / 10;
    return { value: Math.abs(change), positive: change >= 0 };
  };

  // ----- Select options -----
  const categoryOptions: SelectOption[] = useMemo(() => {
    const unique = Array.from(
      new Set(services.map((s) => s.service_category).filter(Boolean))
    );
    return [
      { value: "all", label: "All Categories" },
      ...unique.map((cat) => ({ value: cat, label: cat })),
    ];
  }, [services]);

  const sortOptions: SelectOption[] = [
    { value: "title|asc", label: "Title A-Z" },
    { value: "title|desc", label: "Title Z-A" },
    { value: "price|asc", label: "Price Low-High" },
    { value: "price|desc", label: "Price High-Low" },
    { value: "duration_minutes|asc", label: "Duration Short-Long" },
    { value: "duration_minutes|desc", label: "Duration Long-Short" },
    { value: "created_at|desc", label: "Newest First" },
    { value: "created_at|asc", label: "Oldest First" },
    { value: "revenue|desc", label: "Revenue High-Low" },
    { value: "revenue|asc", label: "Revenue Low-High" },
    { value: "orders_count|desc", label: "Most Orders" },
    { value: "orders_count|asc", label: "Fewest Orders" },
    { value: "is_active|desc", label: "Active First" },
    { value: "is_active|asc", label: "Inactive First" },
  ];

  if (error && activeTab === "services")
    return <ErrorView error={error} onRetry={fetchData} />;

  // ----- Render -----
  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <Toast toast={toast} />

      {/* ----- Sticky Header (dynamic) ----- */}
      <header className=" top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/80 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Home</span>
              <ChevronRight className="h-3 w-3" />
              <span>Admin</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-gray-700">
                {TAB_META[activeTab].label}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-secondary">
              {TAB_META[activeTab].label}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeTab === "services"
                ? `Manage your service catalog (${totalServices} total, ${activeServices} active)`
                : TAB_META[activeTab].description}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {activeTab === "services" && (
                <>
                  <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                    <Package className="mr-1 h-3 w-3" />
                    {totalServices} Total
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {activeServices} Active
                  </span>
                  {readOnly && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      View Only
                    </span>
                  )}
                </>
              )}
              <span className="inline-flex items-center text-xs text-gray-400">
                <Clock className="mr-1 h-3 w-3" />
                Updated {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(activeTab === "services" || activeTab === "users") && (
              <>
                <button
                  onClick={() => {
                    if (activeTab === "services") fetchData();
                    else fetchUsersData();
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 active:scale-95"
                  aria-label="Refresh"
                >
                  <RefreshCw size={16} className="mr-1.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 active:scale-95"
                  aria-label="Export"
                >
                  <Download size={16} className="mr-1.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </>
            )}
            {activeTab === "services" && !readOnly && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-secondary-dark hover:shadow-md active:scale-95"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">New Service</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
            {activeTab === "users" && !readOnly && (
              <button
                onClick={handleUserCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-secondary-dark hover:shadow-md active:scale-95"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">New User</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ----- Pill Tabs ----- */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {Object.entries(TAB_META).map(([key, { icon: Icon }]) => {
          const tabKey = key as Tab;
          const count =
            tabKey === "services"
              ? totalServices
              : tabKey === "users"
              ? users.length
              : undefined;
          return (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === tabKey
                  ? "bg-secondary text-white shadow-md shadow-secondary/30"
                  : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
              }`}
            >
              <Icon size={16} />
              <span>
                {key
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </span>
              {count !== undefined && (
                <span
                  className={`ml-0.5 rounded-full px-2 py-0.5 text-xs ${
                    activeTab === tabKey
                      ? "bg-white/20 text-white"
                      : "bg-gray-200/70 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---- SERVICES TAB ---- */}
      {activeTab === "services" && (
        <>
          {/* Statistics Cards */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total Services"
                value={totalServices}
                icon={<Package className="h-5 w-5 text-white" />}
                change={getChange(totalServices)}
                color="from-blue-500 to-indigo-600"
              />
              <StatCard
                label="Active Services"
                value={activeServices}
                icon={<CheckCircle className="h-5 w-5 text-white" />}
                change={getChange(activeServices)}
                color="from-emerald-500 to-teal-600"
              />
              <StatCard
                label="Total Orders"
                value={totalOrders}
                icon={<ShoppingBag className="h-5 w-5 text-white" />}
                change={getChange(totalOrders)}
                color="from-orange-500 to-amber-600"
              />
              <StatCard
                label="Total Revenue"
                value={formatCurrency(totalRevenue)}
                icon={<DollarSign className="h-5 w-5 text-white" />}
                change={getChange(totalRevenue)}
                color="from-purple-500 to-violet-600"
              />
            </div>
          )}

          {/* Compact Toolbar (desktop) */}
          <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-sm px-4 py-2.5 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[180px]">
                <SearchInput
                  value={inputValue}
                  onChange={handleInputChange}
                  debounceMs={0}
                  showClearButton={false}
                  placeholder="Search by title, slug, category, tags..."
                  loading={loading}
                  className="w-full"
                />
              </div>
              <div className="w-40">
                <CustomSelect
                  value={`${sortField}|${sortOrder}`}
                  onChange={(val) => {
                    const [field, desiredOrder] = val.split("|");
                    if (field === sortField) {
                      if (desiredOrder !== sortOrder) handleSort(field);
                    } else {
                      handleSort(field);
                      if (desiredOrder === "desc") handleSort(field);
                    }
                  }}
                  options={sortOptions}
                  placeholder="Sort by..."
                  className="w-full"
                />
              </div>
              <div className="w-44">
                <CustomSelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={categoryOptions}
                  placeholder="Category..."
                  className="w-full"
                />
              </div>
              <div className="w-32">
                <CustomSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  placeholder="Status..."
                  className="w-full"
                />
              </div>
              <div className="w-28">
                <TableControls pageSize={pageSize} onPageSizeChange={setPageSize} />
              </div>
            </div>
          </div>

          {/* Mobile Search + Filter */}
          <div className="md:hidden sticky top-[88px] z-20 bg-white/90 backdrop-blur border-b border-gray-200 py-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchInput
                  value={inputValue}
                  onChange={handleInputChange}
                  debounceMs={0}
                  loading={loading}
                  showClearButton={false}
                  placeholder="Search services..."
                  className="rounded-xl shadow-sm"
                />
              </div>
              <button
                onClick={() => setSheetOpen(true)}
                className="shrink-0 h-10 w-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-md active:scale-95 transition"
                aria-label="Filter"
              >
                <Filter size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Service Table */}
          {loading ? (
            <SkeletonTable />
          ) : paginatedItems.length === 0 ? (
            <EmptyState
              title="No services found"
              description="Try adjusting your search or filters."
              action={
                !readOnly && (
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary-dark"
                  >
                    <Plus size={16} /> Create Service
                  </button>
                )
              }
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
              <ServiceTable
                services={paginatedItems}
                categories={categories}
                loading={loading}
                readOnly={readOnly}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onManageFields={handleManageFields}
                onManageCompanies={handleManageCompanies}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}

          <div className="mt-6">
            <MemoizedPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>

          <FilterSortSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            sortOptions={sortOptions}
            tempSort={tempSort}
            onTempSortChange={setTempSort}
            categoryOptions={categoryOptions}
            tempCategory={tempCategory}
            onTempCategoryChange={setTempCategory}
            categoryNameMap={Object.fromEntries(
              categories.map((c) => [String(c.id), c.name])
            )}
            onApply={applyMobileFilters}
            onClearAll={clearAllFilters}
          />

          {modalOpen && (
            <ServiceFormModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              service={editingService || viewingService}
              mode={editingService ? "edit" : viewingService ? "view" : "create"}
              categories={categories}
              onSubmit={onSubmit}
              readOnly={readOnly || !!viewingService}
              allCompanies={MOCK_COMPANIES}
              services={services}
            />
          )}

          <DeleteConfirmModal
            isOpen={!!deleteTarget}
            title={deleteTarget?.title || ""}
            deleteTitle="Delete Service"
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />

          {fieldsTarget && (
            <ServiceFieldsModal
              isOpen={!!fieldsTarget}
              onClose={() => setFieldsTarget(null)}
              slug={fieldsTarget.slug}
              initialFields={fieldsTarget.intake_form_schema || []}
              onSave={saveFields}
            />
          )}

          {detailModalOpen && (
            <ServiceDetailModal
              isOpen={detailModalOpen}
              services={services}
              onClose={() => {
                setDetailModalOpen(false);
                setViewingService(null);
              }}
              service={viewingService}
              onEdit={(svc) => {
                setDetailModalOpen(false);
                handleEdit(svc);
              }}
              onDelete={(svc) => {
                setDetailModalOpen(false);
                handleDelete(svc);
              }}
              readOnly={readOnly}
            />
          )}

          {companiesTarget && (
            <ServiceCompaniesModal
              isOpen={!!companiesTarget}
              onClose={() => setCompaniesTarget(null)}
              slug={companiesTarget.slug}
              allCompanies={MOCK_COMPANIES}
              assignedIds={companiesTarget.company_ids || []}
              onSave={saveCompanies}
            />
          )}
        </>
      )}

      
{activeTab === "admin-dashboard" && <AdminDashboard />}
{activeTab === "provider-dashboard" && <ProviderDashboard />}
      {/* ---- SERVICE GROUPS TAB ---- */}
      {activeTab === "service-groups" && (
        <ServiceGroupManagement
          groups={groups}
          loading={groupsLoading}
          readOnly={readOnly}
          services={services}
          onRefresh={() => fetchServiceGroups().then(setGroups)}
        />
      )}

      {/* ---- PROVIDER APPROVAL TAB ---- */}
      {activeTab === "provider-approval" && <ProviderApproval />}

      {/* ---- CATEGORIES TAB ---- */}
      {activeTab === "categories" && (
        <CategoriesManagement readOnly={readOnly} />
      )}

      {/* ---- PRICING POLICY TAB ---- */}
      {activeTab === "pricing" && (
        <PricingPolicySettings readOnly={readOnly} />
      )}

      {/* ---- COMPLIANCE TAB ---- */}
      {activeTab === "compliance" && (
        <ComplianceManagement readOnly={readOnly} />
      )}

      {/* ---- PROMOTIONS TAB ---- */}
      {activeTab === "promotions" && (
        <PromotionsManagement readOnly={readOnly} />
      )}

      {/* ---- REPORTS TAB ---- */}
      {activeTab === "reports" && <AdvancedReports />}
 {activeTab === "bookings" && <BookingsManagement />}
      {/* Delete User Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteUserTarget}
        title={deleteUserTarget?.name || ""}
        deleteTitle="Delete User"
        onConfirm={confirmUserDelete}
        onCancel={() => setDeleteUserTarget(null)}
      />

      {/* User Form Modal */}
      {/* {userModalOpen && (
        <UserFormModal
          isOpen={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          user={editingUser}
          onSave={onUserSubmit}
        />
      )} */}
    </div>
  );
}