// src/components/admin/companyUser/CompanyUsers.tsx
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useCompanyUsers } from "../../../hooks/useCompanyUsers";
import { useAddCompanyUser } from "../../../hooks/useAddCompanyUser";
import {
  onboardCompanyStaff,
  removeUserFromCompany,
  searchUsers,
  updateUserCompanyRole,
} from "../../../services/api";
import { useDebounce } from "../../../hooks/useDebounce";
import type { User, UserRole } from "../../../types";
import {
  Building2,
  UserPlus,
  Users,
  Shield,
  Briefcase,
  Truck,
  Eye,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
import { Pagination } from "../../ui/Pagination";
import { ErrorView } from "../../ui/ErrorView";
import { CompanyUsersTable } from "./CompanyUsersTable";
import { AddUserModal } from "./AddUserModal";
import { EditUserModal } from "./EditUserModal";
import { DeleteUserModal } from "./DeleteUserModal";
import { CompanySelector } from "../company-products/CompanySelector";
import { useReadOnly } from "../AdminDashboard";
import { CreateCompanyUserModal } from "./CreateCompanyUserModal";
import { TableControls } from "../../ui/TableControls";

// ----------------------------------------------------------------------
// Compact skeletons
// ----------------------------------------------------------------------
const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="rounded-xl border border-gray-100 bg-white p-2 animate-pulse"
      >
        <div className="h-3 w-12 bg-gray-200 rounded mb-1" />
        <div className="h-5 w-8 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="divide-y divide-gray-100">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-1">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="h-2 w-40 bg-gray-100 rounded" />
        </div>
        <div className="h-5 w-14 bg-gray-200 rounded-full" />
        <div className="h-7 w-7 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function CompanyUsers() {
  const { user: currentUser } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();
  const readOnly = useReadOnly();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";

  const companyLogo = useMemo(() => {
    if (!companySlug || !companies.length) return null;
    const foundCompany = companies.find((c: any) => c.slug === companySlug);
    return foundCompany?.logo || null;
  }, [companySlug, companies]);

  const isSuperAdmin = !currentUser?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const [roleFilter, setRoleFilter] = useState<
    "all" | "admin" | "staff" | "viewer" | "delivery"
  >("all");

  const currentUserRole = useMemo(() => {
    if (!currentUser || !companySlug) return null;
    if (isSuperAdmin) return "superAdmin";
    const membership = currentUser.memberships?.find(
      (m: any) => m.company_slug === companySlug,
    );
    return membership?.role || null;
  }, [currentUser, companySlug, isSuperAdmin]);

  const canViewUsers =
    isSuperAdmin ||
    currentUserRole === "admin" ||
    currentUserRole === "staff" ||
    readOnly;
  const canManageUsers =
    (isSuperAdmin || currentUserRole === "admin") && !readOnly;

  const { users, loading, error, refetch } = useCompanyUsers(companySlug);
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtered users (search + role)
  const filteredUsers = (users || []).filter((u: any) => {
    const matchesSearch =
      `${u.first_name} ${u.last_name}`
        .toLowerCase()
        .includes(tableSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(tableSearch.toLowerCase());
    const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Role counts for stats
  const roleCounts = useMemo(() => {
    const counts = { admin: 0, staff: 0, viewer: 0, delivery: 0 };
    (users || []).forEach((u: any) => {
      if (counts.hasOwnProperty(u.role))
        counts[u.role as keyof typeof counts]++;
    });
    return counts;
  }, [users]);

  const { addUser } = useAddCompanyUser();

  // Add user modal state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "staff" | "viewer" | "delivery"
  >("staff");
  const [showAddModal, setShowAddModal] = useState(false);
  const debouncedQuery = useDebounce(searchTerm, 500);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch search results when debounced query changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await searchUsers(debouncedQuery);
        setSearchResults(res.data.results || []);
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };
    fetchSearchResults();
  }, [debouncedQuery]);

  const handleAddUser = async () => {
    if (!companySlug || !selectedUser) return;
    setAdding(true);
    try {
      await addUser(companySlug, selectedUser.email, selectedRole);
      setShowAddModal(false);
      setSelectedUser(null);
      setSearchTerm("");
      setSelectedRole("staff");
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleCreateUser = async (data: any) => {
    if (!companySlug) return;
    setCreatingUser(true);
    try {
      await onboardCompanyStaff(companySlug, data);
      setShowCreateModal(false);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleEditUser = async (updatedUser: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    role: string;
  }) => {
    if (!companySlug) return;
    setUpdating(true);
    try {
      const userId = editingUser?.user_id || Number(updatedUser.id);
      await updateUserCompanyRole(
        companySlug,
        userId,
        updatedUser.role as UserRole,
      );
      setEditingUser(null);
      await refetch();
    } catch (err: any) {
      console.error("Role update error:", err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.user_role?.[0] ||
        err.response?.data?.role?.[0] ||
        "Failed to update role.";
      alert(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!companySlug || !deletingUser) return;
    setDeleting(true);
    try {
      await removeUserFromCompany(companySlug, deletingUser.user_id);
      setDeletingUser(null);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, tableSearch]);

  // Permission guard
  if (!canViewUsers) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 text-center mx-4 sm:mx-0">
        <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-50 text-gray-400 mb-2">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
          Access Restricted
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
          You don't have permission to view company users.
        </p>
      </div>
    );
  }

  // Company selector (super admin, no company selected)
  if (showSelector) {
    return (
      <CompanySelector
        companies={companies}
        title="All Users"
        subtitle="Select a company to manage users"
        searchPlaceholder="Search companies by name..."
        isLoading={isLoadingCompanies}
        disableProductSearch={true}
        onSelect={(slug, name) => {
          const membership = currentUser?.memberships?.find(
            (m: any) => m.company_slug === slug,
          );
          const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");
          switchCompany({ slug, name, role });
        }}
        onBack={clearCompany}
      />
    );
  }

  if (error && !companySlug) {
    return <ErrorView error={error} onRetry={() => refetch?.()} />;
  }

  if (!companySlug) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-10 px-4 sm:px-0 text-gray-500 bg-white rounded-xl border border-gray-100 mx-4 sm:mx-0">
        <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mb-2" />
        <p className="text-xs sm:text-sm text-center">
          No company selected. Please select a company first.
        </p>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER - LAYOUT: Header → Unified Toolbar → Stats → Table
  // ----------------------------------------------------------------------
  return (
    <div className="space-y-3 px-4 sm:px-0">
      {/* ===== 1. COMPACT HEADER ===== */}
      <div className="flex flex-row items-center justify-between gap-3 px-0">
        {/* LEFT SIDE - Logo and Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo only shows for Super Admin */}
          {isSuperAdmin && (
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
              </div>
            )}
          </div>

          )}
          <div className="min-w-0">
            <h1 className="text-sm sm:text-2xl font-extrabold text-secondary leading-tight break-words">
              {isSuperAdmin ? companyName : "All Users"}
            </h1>
            <p className="text-[9px] sm:text-xs text-gray-500">
              Manage roles and organization access
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - Switch button (only for super admin) */}
        {isSuperAdmin && (
          <button
            onClick={clearCompany}
            className="
        h-8 sm:h-9 px-2 sm:px-3
        rounded-lg
        border border-secondary/30
        bg-secondary
        text-[10px] sm:text-xs font-medium text-white
        hover:bg-secondary/90
        transition-all
        flex-shrink-0
        shadow-sm
      "
          >
            Switch
          </button>
        )}
      </div>
      {/* ===== 3. COMPACT STATS ROW ===== */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <StatCard
            title="Total"
            value={users?.length || 0}
            icon={Users}
            color="gray"
          />
          <StatCard
            title="Admins"
            value={roleCounts.admin}
            icon={Shield}
            color="purple"
          />
          <StatCard
            title="Staff"
            value={roleCounts.staff}
            icon={Briefcase}
            color="blue"
          />
          <StatCard
            title="Delivery"
            value={roleCounts.delivery}
            icon={Truck}
            color="green"
          />
          <StatCard
            title="Viewers"
            value={roleCounts.viewer}
            icon={Eye}
            color="amber"
          />
        </div>
      )}

      {/* ===== 4. MAIN TABLE CARD ===== */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* TableControls wraps search + page size selector */}
        {/* TableControls - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block">
          <TableControls
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            {/* LEFT SIDE - SEARCH (Hidden on mobile) */}
            <div className="hidden sm:flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
              {/* SEARCH */}
              <div className="relative w-full sm:w-[380px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="
                    w-full h-11
                    pl-10 pr-10
                    rounded-xl
                    border border-gray-200
                    bg-white
                    text-sm text-gray-700
                    placeholder:text-gray-400
                    shadow-sm
                    focus:outline-none
                    focus:ring-2 focus:ring-gray-100
                    focus:border-gray-300
                    transition-all
                  "
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch("")}
                    className="
                      absolute right-2.5 top-1/2 -translate-y-1/2
                      h-6 w-6
                      rounded-md
                      flex items-center justify-center
                      hover:bg-gray-100
                      active:scale-95
                      transition
                    "
                  >
                    <X className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            {/* RIGHT SIDE */}
            <div className="flex items-center gap-2 shrink-0">
              {/* ROLE FILTERS (Hidden on mobile) */}
              <div className="hidden sm:block relative w-44">
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(
                      e.target.value as
                        | "all"
                        | "admin"
                        | "staff"
                        | "viewer"
                        | "delivery"
                    )
                  }
                  className="
                    w-full h-9 px-3 pr-8
                    rounded-xl
                    border border-gray-200
                    bg-white
                    text-sm text-gray-700
                    font-medium
                    shadow-sm
                    focus:outline-none
                    focus:ring-2 focus:ring-gray-200
                    transition
                  "
                >
                  <option value="all">All</option>
                  <option value="admin">Admin ({roleCounts.admin || 0})</option>
                  <option value="staff">Staff ({roleCounts.staff || 0})</option>
                  <option value="viewer">Viewer ({roleCounts.viewer || 0})</option>
                  <option value="delivery">Delivery ({roleCounts.delivery || 0})</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>
              {/* DESKTOP: Buttons on right side (original layout) */}
              <div className="hidden lg:flex items-center gap-2">
                {canManageUsers && (
                  <>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="
                        h-9 px-3.5
                        rounded-xl
                        bg-[#6750A4]
                        text-white
                        text-xs font-medium
                        hover:bg-[#4c3789]
                        transition-all
                        flex items-center gap-1.5
                        shadow-sm
                      "
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add Member
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="
                        h-9 px-3.5
                        rounded-xl
                        border-2 border-[#6750A4]
                        bg-white
                        text-xs font-medium text-[#6750A4]
                        hover:bg-secondary/5
                        transition-all
                        flex items-center gap-1.5
                      "
                    >
                      <UserPlus className="h-3.5 w-3.5 text-[#6750A4]" />
                      Create User
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          </TableControls>
        </div>

        {/* MOBILE: Buttons with space-between layout (Create User left, Add Member right) */}
        <div className="flex lg:hidden items-center justify-between gap-2 mb-3">
          {canManageUsers && (
            <>
              <button
                onClick={() => setShowCreateModal(true)}
                className="
                  h-9 px-3.5
                  rounded-xl
                  border-2 border-[#6750A4]
                  bg-white
                  text-xs font-medium text-[#6750A4]
                  hover:bg-secondary/5
                  transition-all
                  flex items-center gap-1.5
                "
              >
                <UserPlus className="h-3.5 w-3.5 text-[#6750A4]" />
                Create User
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="
                  h-9 px-3.5
                  rounded-xl
                  border-2 border-[#6750A4]
                  bg-white
                  text-xs font-medium text-[#6750A4]
                  hover:bg-secondary/5
                  transition-all
                  flex items-center gap-1.5
                "
              >
                <UserPlus className="h-3.5 w-3.5 text-[#6750A4]" />
                Add Member
              </button>
            </>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={pageSize} />
        ) : paginatedUsers.length === 0 ? (
          <div className="py-8 sm:py-10 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-50 text-gray-400 mb-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-900">
              No members found
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              {tableSearch || roleFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Get started by adding your first team member."}
            </p>
            {canManageUsers && !tableSearch && roleFilter === "all" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-[#6750A4] text-white text-[10px] sm:text-xs font-medium hover:bg-[#4c3789] transition"
              >
                <UserPlus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Add member
              </button>
            )}
          </div>
        ) : (
          <>
            <CompanyUsersTable
              users={paginatedUsers}
              currentUser={currentUser}
              isAdmin={canManageUsers}
              onEdit={(user) => setEditingUser({ ...user, user_id: user.id })}
              onDelete={setDeletingUser}
            />
            {/* Enhanced Pagination with pageSize control, keyboard nav, URL sync */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              enableUrlSync={true}
            />
          </>
        )}
      </div>

      {/* Mobile Filter Button - Bottom Left (only visible on mobile) */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-5 left-5 z-40 lg:hidden flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white border-2 border-[#6750A4] shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <div className="relative">
          <svg className="w-5 h-5 text-[#6750A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {(tableSearch || roleFilter !== "all") && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </div>
        <span className="text-sm font-semibold tracking-wide text-[#6750A4]">Filter</span>
        {(tableSearch || roleFilter !== "all") && (
          <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-[#6750A4]/10 text-[#6750A4] rounded-full">
            Active
          </span>
        )}
      </button>

      {/* Mobile Filter Modal - Bottom Sheet */}
      {showMobileFilterModal && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setShowMobileFilterModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          {/* Bottom Sheet Content */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-secondary">Filters</h3>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-[#6750A4] focus:shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-[#6750A4] focus:shadow-sm transition-all"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin ({roleCounts.admin || 0})</option>
                  <option value="staff">Staff ({roleCounts.staff || 0})</option>
                  <option value="viewer">Viewer ({roleCounts.viewer || 0})</option>
                  <option value="delivery">Delivery ({roleCounts.delivery || 0})</option>
                </select>
              </div>

              {/* Page Size */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Items per page
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-[#6750A4] focus:shadow-sm transition-all"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={15}>15 / page</option>
                  <option value={30}>30 / page</option>
                  <option value={60}>60 / page</option>
                </select>
              </div>

              {/* Action Buttons - Equal width, side by side */}
              <div className="flex items-center gap-3 pt-2">
                {(tableSearch || roleFilter !== "all") && (
                  <button
                    onClick={() => {
                      setTableSearch("");
                      setRoleFilter("all");
                      setCurrentPage(1);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowMobileFilterModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modals ===== */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedUser(null);
          setSearchTerm("");
        }}
        searching={searching}
        searchResults={searchResults}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        adding={adding}
        onAdd={handleAddUser}
      />
      <CreateCompanyUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        loading={creatingUser}
        onSubmit={handleCreateUser}
      />
      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        updating={updating}
        onClose={() => setEditingUser(null)}
        onSave={handleEditUser}
      />
      <DeleteUserModal
        isOpen={!!deletingUser}
        user={deletingUser}
        deleting={deleting}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Ultra-compact Stat Card
// ----------------------------------------------------------------------
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.FC<{ className?: string }>;
  color: "gray" | "purple" | "blue" | "green" | "amber";
}> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    gray: "bg-gray-50 text-gray-600",
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      className="
        rounded-xl
        border border-gray-100
        bg-white
        p-2 sm:p-4
        shadow-sm
        hover:shadow-md
        transition-all
      "
    >
      <div className="flex items-center justify-between gap-2 p-1 sm:p-2">
        {/* LEFT */}
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-[9px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>

          <p className="text-base sm:text-xl font-semibold text-gray-900 leading-none">
            {value}
          </p>
        </div>

        {/* RIGHT ICON */}
        <div
          className={`
            h-7 w-7 sm:h-9 sm:w-9
            rounded-lg
            flex items-center justify-center
            ${colorClasses[color]}
          `}
        >
          <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
        </div>
      </div>
    </motion.div>
  );
};
