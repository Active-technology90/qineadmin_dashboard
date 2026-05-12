import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  Building2,
  CheckCircle,
  Filter,
  Briefcase,
  UserCheck,
  UserMinus,
  Shield,
  Package,
  Minus,
} from "lucide-react";
import {

  deleteUser,
  getAllUsers,
  getAvailableCompanies,
  removeUserFromCompany,
  updateUser,
  updateUserCompanyRole,
  // updateUserCompanyRole,
} from "../../../services/api";
import type { User, UserRole, Membership } from "../../../types";

// Import your custom components
import { Pagination } from "../../ui/Pagination";
import EditUserModal from "./EditUserModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ManageMembershipsModal from "./ManageMembershipsModal";
import ViewUserModal from "./ViewUserModal";


// ============================================================
// TableControls – simple wrapper for the top filter bar
// ============================================================
interface TableControlsProps {
  children: React.ReactNode;
}
const TableControls: React.FC<TableControlsProps> = ({ children }) => (
  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
    {children}
  </div>
);

// ============================================================
// Utility Functions
// ============================================================
const getInitials = (
  firstName: string,
  lastName: string,
  username: string,
): string => {
  if (firstName && lastName)
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  if (username) return username[0].toUpperCase();
  return "U";
};

const roleStyles: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  staff: "bg-blue-100 text-blue-700 border-blue-200",
  viewer: "bg-amber-100 text-amber-700 border-amber-200",
  delivery: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const roleBadgeStyles: Record<UserRole, string> = {
  admin: "bg-purple-600 text-white",
  staff: "bg-blue-600 text-white",
  viewer: "bg-amber-600 text-white",
  delivery: "bg-emerald-600 text-white",
};

const formatPhone = (phone: string | null): string => {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("251")) {
    return `+251 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
  }
  return phone;
};

// ============================================================
// Statistics Card Component
// ============================================================
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  gradient,
}) => (
  <div
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-white/70 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-3xl font-bold text-white mt-2">{value}</p>
      </div>
      <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
        {icon}
      </div>
    </div>
  </div>
);

// ============================================================
// Filters Component
// ============================================================
interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  onRefresh: () => void;
}
const UserFilters: React.FC<FiltersProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  onRefresh,
}) => (
  <>
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search by name, email, phone or company..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
      />
    </div>
    <div className="flex gap-3 w-full sm:w-auto">
      <div className="relative">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="viewer">Viewer</option>
          <option value="delivery">Delivery</option>
          <option value="no_company">No Company</option>
        </select>
        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      <button
        onClick={onRefresh}
        className="p-2.5 rounded-xl border border-gray-200 bg-white/50 hover:bg-white transition-colors"
        title="Refresh"
      >
        <RefreshCw className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  </>
);

// ============================================================
// Actions Dropdown Component
// ============================================================
interface ActionsDropdownProps {
  user: User;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onRemove: (user: User) => void;
  onManageMemberships: (user: User) => void;
}
const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  user,
  onView,
  onEdit,
  onRemove,
  onManageMemberships,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".actions-dropdown")) setOpen(false);
    };
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    <div className="relative actions-dropdown">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl hover:bg-gray-100 transition"
      >
        <MoreVertical className="h-5 w-5 text-gray-600" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#6758D4] bg-white/90 backdrop-blur-xl shadow-xl overflow-hidden z-50 animate-fadeIn">
          <button
            onClick={() => {
              onView(user);
              setOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-gray-50"
          >
            <Eye className="h-4 w-4 text-gray-600" />
            View Profile
          </button>
          <button
            onClick={() => {
              onEdit(user);
              setOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 text-blue-600" />
            Edit User
          </button>
          <button
            onClick={() => {
              onManageMemberships(user);
              setOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-gray-50"
          >
            <Building2 className="h-4 w-4 text-purple-600" />
            Manage Memberships
          </button>
          <div className=" my-1" />
          <button
            onClick={() => {
              onRemove(user);
              setOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Remove User
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Desktop Table Component
// ============================================================
interface UserTableProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onRemove: (user: User) => void;
  onManageMemberships: (user: User) => void;
}
const UserTable: React.FC<UserTableProps> = ({ users, ...actionProps }) => (
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
        <tr>
          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            User
          </th>
          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Email
          </th>
          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Phone
          </th>
          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Companies / Roles
          </th>
          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Status
          </th>
          <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {users.map((user) => (
          <tr
            key={user.id}
            className="hover:bg-gray-50/50 transition-colors group"
          >
            <td className="py-4 px-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(user.first_name, user.last_name, user.username)
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user.first_name || user.username}
                    {user.last_name && ` ${user.last_name}`}
                  </p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
              </div>
            </td>
            <td className="py-4 px-6 text-sm text-gray-600">{user.email}</td>
            <td className="py-4 px-6 text-sm text-gray-600">
              {formatPhone(user.phone_number)}
            </td>
            <td className="py-4 px-6">
              <div className="flex flex-wrap gap-2">
                {user.memberships.length > 0 ? (
                  user.memberships.map((m: Membership, idx: number) => (
                    <div key={idx} className="group relative">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${roleStyles[m.role]}`}
                      >
                        <Building2 className="h-3 w-3" />
                        {m.company_name}
                      </span>
                      <span
                        className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ring-2 ring-white ${roleBadgeStyles[m.role]}`}
                      >
                        {m.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    No companies
                  </span>
                )}
              </div>
            </td>
            <td className="py-4 px-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
               {user.is_active ? (
                <div className="flex items-center gap-1.5"> <CheckCircle className="h-3 w-3" /> Active</div>
                )
                : (
                  <div className="flex items-center gap-1.5"><Minus className="h-3 w-3 text-red-600" /> <p className="text-red-600"> Inactive</p></div>
               )}
              </span>
            </td>
            <td className="py-4 px-6 text-right">
              <ActionsDropdown user={user} {...actionProps} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ============================================================
// Mobile Cards Component
// ============================================================
const UserMobileCards: React.FC<UserTableProps> = ({
  users,
  ...actionProps
}) => (
  <div className="md:hidden space-y-4">
    {users.map((user) => (
      <div
        key={user.id}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base">
              {getInitials(user.first_name, user.last_name, user.username)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {user.first_name || user.username}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <ActionsDropdown user={user} {...actionProps} />
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Phone:</span>
            <span className="text-gray-900">
              {formatPhone(user.phone_number)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.memberships.length > 0 ? (
              user.memberships.map((m: Membership, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${roleStyles[m.role]}`}
                  >
                    {m.company_name} ({m.role})
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-400">
                No companies assigned
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle className="h-3 w-3" /> Active
          </span>
        </div>
      </div>
    ))}
  </div>
);

// ============================================================
// Empty State Component
// ============================================================
interface EmptyStateProps {
  onReset: () => void;
}
const EmptyState: React.FC<EmptyStateProps> = ({ onReset }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="h-24 w-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
      <Users className="h-12 w-12 text-purple-500" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
    <p className="text-gray-500 max-w-sm mb-6">
      Try adjusting your search or filter to find what you're looking for.
    </p>
    <button
      onClick={onReset}
      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
    >
      Reset Filters
    </button>
  </div>
);

// ============================================================
// Loading Skeleton
// ============================================================
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-32 bg-gray-100 rounded-2xl animate-pulse"
        ></div>
      ))}
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================
// Main Component: SuperAdminUsers
// ============================================================
const SuperAdminUsers: React.FC = () => {
  // Data state – all users loaded once
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering & pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<User | null>(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<
    Array<{ id: number; name: string; slug: string }>
  >([]);

  // Helper: recursively fetch all users
  const fetchAllUsers = useCallback(async (): Promise<User[]> => {
    let page = 1;
    let all: User[] = [];
    let hasMore = true;
    while (hasMore) {
      const response = await getAllUsers(page, 100);
      all = [...all, ...response.results];
      hasMore = !!response.next;
      page++;
    }
    return all;
  }, []);

  // Load all users on mount
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const users = await fetchAllUsers();
        setAllUsers(users);
      } catch (err: any) {
        setError(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [fetchAllUsers]);
  
  useEffect(() => {
  if (managingUser && allUsers.length) {
    const updated = allUsers.find(u => u.id === managingUser.id);
    if (updated) setManagingUser(updated);
  }
}, [allUsers, managingUser]);

  // Filter users based on search term and role (client‑side)
  const filteredUsers = useMemo(() => {
    let filtered = [...allUsers];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          (user.phone_number && user.phone_number.includes(term)) ||
          user.memberships.some((m) =>
            m.company_name.toLowerCase().includes(term),
          ),
      );
    }
    if (roleFilter !== "all") {
      if (roleFilter === "no_company") {
        filtered = filtered.filter((user) => user.memberships.length === 0);
      } else {
        filtered = filtered.filter((user) =>
          user.memberships.some((m) => m.role === roleFilter),
        );
      }
    }
    return filtered;
  }, [allUsers, searchTerm, roleFilter]);

  // Paginate filtered users
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, pageSize]);

  // Stats based on ALL filtered users (not just current page)
  const stats = useMemo(() => {
    const totalAdmins = filteredUsers.filter((u) =>
      u.memberships.some((m) => m.role === "admin"),
    ).length;
    const totalStaff = filteredUsers.filter((u) =>
      u.memberships.some((m) => m.role === "staff"),
    ).length;
    const totalViewers = filteredUsers.filter((u) =>
      u.memberships.some((m) => m.role === "viewer"),
    ).length;
    const totalDelivery = filteredUsers.filter((u) =>
      u.memberships.some((m) => m.role === "delivery"),
    ).length;
    const noCompany = filteredUsers.filter(
      (u) => u.memberships.length === 0,
    ).length;
    return { totalAdmins, totalStaff, totalViewers, totalDelivery, noCompany };
  }, [filteredUsers]);

  // Handlers
 // Inside SuperAdminUsers component

const handleRefresh = async () => {
  setSearchTerm("");
  setRoleFilter("all");
  setCurrentPage(1);
  await refreshAllUsers(); // 👈 fetch latest data from API
};

 const handleResetFilters = async () => {
  setSearchTerm("");
  setRoleFilter("all");
  setCurrentPage(1);
  await refreshAllUsers();
};
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

 const refreshAllUsers = async () => {
  const users = await fetchAllUsers();
  setAllUsers(users);
  
  // If a user is currently being managed, update that state with fresh data
  if (managingUser) {
    const updatedUser = users.find(u => u.id === managingUser.id);
    if (updatedUser) setManagingUser(updatedUser);
  }
  // Similarly, update other selected user states if needed (e.g., selectedUser, editingUser)
  if (selectedUser) {
    const updatedUser = users.find(u => u.id === selectedUser.id);
    if (updatedUser) setSelectedUser(updatedUser);
  }
  if (editingUser) {
    const updatedUser = users.find(u => u.id === editingUser.id);
    if (updatedUser) setEditingUser(updatedUser);
  }
};
  // View user
  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  // Edit user
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData: Partial<User>) => {
    if (!editingUser) return;
    await updateUser(editingUser.id, updatedData);
    await refreshAllUsers();
  };

  // Delete user
  const handleRemove = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    await deleteUser(deletingUser.id);
    setIsDeleteModalOpen(false);
    setDeletingUser(null);
    await refreshAllUsers();
  };

  // Manage memberships
  const handleManageMemberships = (user: User) => {
    setManagingUser(user);
    setIsMembershipModalOpen(true);
  };

  // Load available companies when membership modal opens
  useEffect(() => {
    if (isMembershipModalOpen) {
      getAvailableCompanies().then(setAvailableCompanies).catch(console.error);
    }
  }, [isMembershipModalOpen]);

  if (loading) return <LoadingSkeleton />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-[#6750A4] bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-gray-500 mt-1">
              Manage platform users, roles, and company memberships
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              Total Users: {allUsers.length}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <StatCard
            title="Total Admins"
            value={stats.totalAdmins}
            icon={<Shield className="h-6 w-6 text-white" />}
            gradient="from-purple-500 to-indigo-600"
          />
          <StatCard
            title="Staff"
            value={stats.totalStaff}
            icon={<UserCheck className="h-6 w-6 text-white" />}
            gradient="from-blue-500 to-cyan-600"
          />
          <StatCard
            title="Viewers"
            value={stats.totalViewers}
            icon={<UserMinus className="h-6 w-6 text-white" />}
            gradient="from-amber-500 to-orange-600"
          />
          <StatCard
            title="Delivery"
            value={stats.totalDelivery}
            icon={<Package className="h-6 w-6 text-white" />}
            gradient="from-emerald-500 to-teal-600"
          />
          <StatCard
            title="No Company"
            value={stats.noCompany}
            icon={<Briefcase className="h-6 w-6 text-white" />}
            gradient="from-gray-600 to-gray-700"
          />
        </div>

        {/* TableControls + Filters */}
        <TableControls>
          <UserFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            onRefresh={handleRefresh}
          />
        </TableControls>

        {/* Content */}
        {filteredUsers.length === 0 ? (
          <EmptyState onReset={handleResetFilters} />
        ) : (
          <>
            <UserTable
              users={paginatedUsers}
              onView={handleView}
              onEdit={handleEdit}
              onRemove={handleRemove}
              onManageMemberships={handleManageMemberships}
            />
            <UserMobileCards
              users={paginatedUsers}
              onView={handleView}
              onEdit={handleEdit}
              onRemove={handleRemove}
              onManageMemberships={handleManageMemberships}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredUsers.length / pageSize)}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[10, 25, 50, 100]}
              enableUrlSync={false}
            />
          </>
        )}
      </div>

      {/* View User Modal */}
      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        user={selectedUser}
        onEdit={handleEdit}
        onSuspend={(user) => console.log("Suspend user", user)}
        onDelete={handleRemove}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={editingUser}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />


<ManageMembershipsModal
  isOpen={isMembershipModalOpen}
  onClose={() => setIsMembershipModalOpen(false)}
  user={managingUser}
  availableCompanies={availableCompanies}
  onUpdateRole={async (userId, companySlug, role) => {
    await updateUserCompanyRole(companySlug, userId, role);
    await refreshAllUsers();
  }}
  onRemoveMembership={async (userId, companyId) => {
    const company = availableCompanies.find(c => c.id === companyId);
    if (!company) throw new Error("Company not found");
    await removeUserFromCompany(company.slug, userId);
    await refreshAllUsers();
  }}
  onRefresh={refreshAllUsers}  // <-- will refresh after add
/>
    </>
  );
};

export default SuperAdminUsers;
