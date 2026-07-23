// src/components/admin/SuperAdminUsers.tsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  Building2,
  CheckCircle,
  Briefcase,
  UserCheck,
  UserMinus,
  Shield,
  Package,
  Minus,
  X,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  getAllUsers,
  getAvailableCompanies,
  removeUserFromCompany,
  updateUser,
  updateUserCompanyRole,
} from "../../../services/api";
import type { User, UserRole, Membership } from "../../../types";

// Import shared UI components
import { Pagination } from "../../ui/Pagination";
import EditUserModal from "./EditUserModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ManageMembershipsModal from "./ManageMembershipsModal";
import ViewUserModal from "./ViewUserModal";
import { TableControls } from "../../ui/TableControls";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { CustomSelect } from "../../ui/CustomSelect";
import BottomSheet from "../../ui/BottomSheet";
import MobileCardSkeleton from "../../ui/MobileCardSkeleton";

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
  owner: "bg-rose-100 text-rose-700 border-rose-200",
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  staff: "bg-blue-100 text-blue-700 border-blue-200",
  viewer: "bg-amber-100 text-amber-700 border-amber-200",
  delivery: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// const roleBadgeStyles: Record<UserRole, string> = {
//   owner: "bg-rose-600 text-white",
//   admin: "bg-purple-600 text-white",
//   staff: "bg-blue-600 text-white",
//   viewer: "bg-amber-600 text-white",
//   delivery: "bg-emerald-600 text-white",
// };

const formatPhone = (phone: string | null): string => {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("251")) {
    return `+251 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
  }
  return phone;
};

const roleOptions = [
  { label: "All Roles", value: "all", icon: <Users className="h-4 w-4" /> },
  {
    label: "Admin",
    value: "admin",
    icon: <Shield className="h-4 w-4 text-purple-600" />,
  },
  {
    label: "Staff",
    value: "staff",
    icon: <Users className="h-4 w-4 text-blue-600" />,
  },
  {
    label: "Viewer",
    value: "viewer",
    icon: <Eye className="h-4 w-4 text-amber-600" />,
  },
  {
    label: "Delivery",
    value: "delivery",
    icon: <Package className="h-4 w-4 text-emerald-600" />,
  },
  {
    label: "No Company",
    value: "no_company",
    icon: <Briefcase className="h-4 w-4 text-gray-600" />,
  },
];

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
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 sm:p-5 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-white/70 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-white mt-2">
          {value}
        </p>
      </div>
      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
        {icon}
      </div>
    </div>
  </div>
);

// ============================================================
// Filters Component (refactored to use BottomSheet)
// ============================================================
interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;

  // ADD THESE
  pageSize: number;
  setPageSize: (size: number) => void;
}
const UserFilters: React.FC<FiltersProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  pageSize,
  setPageSize,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pageSizeOptions = [
    { label: "5", value: "5" },
    { label: "10", value: "10" },
    { label: "15", value: "15" },
    { label: "30", value: "30" },
    { label: "60", value: "60" },
  ];
  return (
    <>
      <div className="w-full flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
        {/* SEARCH + FILTER INSIDE INPUT */}
        <div className="relative flex flex-1 min-w-0 items-center gap-2 px-2">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-secondary/10 to-purple-300/10 blur-xl opacity-70" />

          {/* SEARCH BOX */}
          <div className="w-3/4 md:w-full relative flex items-center rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-xl shadow-sm hover:shadow-md focus-within:ring-4 focus-within:ring-secondary/10 focus-within:border-secondary/30 transition-all duration-300">

            <Search className="absolute left-3 sm:left-4 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />

            <input
              type="text"
              placeholder="Search users, email, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-10 sm:pl-12 pr-24 py-2 sm:py-2.5 text-sm sm:text-[15px] text-gray-700 placeholder:text-gray-400 rounded-xl border border-secondary outline-none"
            />

            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-14 flex items-center justify-center h-7 w-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* MOBILE FILTER */}
            <div className="absolute right-4 flex items-center gap-2 md:hidden">
              <button
                onClick={() => setSheetOpen(true)}
                className="flex items-center justify-center h-7 w-7 rounded-full bg-secondary text-white shadow-md hover:scale-[1.02] active:scale-95 transition"
              >
                <Filter className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* PER PAGE SELECT (FIXED) */}
          <div className="w-1/4 flex justify-end md:hidden">
            <div className="w-full max-w-[120px]">
              <CustomSelect
                value={pageSize.toString()}
                onChange={(val) => setPageSize(parseInt(val))}
                options={pageSizeOptions}
                placeholder="10"
                className="h-9 text-xs w-full"
              />
            </div>
          </div>
        </div>

        {/* DESKTOP DROPDOWN FILTER (UNCHANGED) */}
        <div className="hidden md:flex w-full md:w-[240px] lg:w-[260px]">
          <CustomSelect
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleOptions}
            placeholder="Filter by role"
          />
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter Users"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Select a role to filter users
            </p>

            {/* RESET COMMENTED OUT (as requested) */}
            {/*
            <button
              onClick={() => setRoleFilter("all")}
              className="text-xs font-semibold text-secondary hover:underline"
            >
              Reset All
            </button>
            */}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setRoleFilter(opt.value);
                  setSheetOpen(false);
                }}
                className={`
                  flex flex-col items-center justify-center gap-2
                  min-h-[88px] rounded-2xl border px-3 py-4
                  text-sm font-semibold transition-all active:scale-[0.97]
                  ${roleFilter === opt.value
                    ? "bg-gradient-to-br from-secondary to-secondary border-secondary text-white shadow-lg"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-purple-50"
                  }
                `}
              >
                <div>{opt.icon}</div>
                <span className="text-center">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
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
  const [isAbove, setIsAbove] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Click outside / Escape to close ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // ── Check if dropdown fits below ──
  useEffect(() => {
    if (open && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 200; // approximate menu height (adjust if needed)
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // If there's less space below than the menu height, and more space above, flip upward
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        setIsAbove(true);
      } else {
        setIsAbove(false);
      }
    }
  }, [open]);

  const menuItems = [
    {
      label: "View Profile",
      icon: Eye,
      iconColor: "text-indigo-500",
      hover: "hover:bg-indigo-50",
      iconBg: "bg-indigo-50/60",
      action: () => onView(user),
    },
    {
      label: "Edit User",
      icon: Edit,
      iconColor: "text-blue-500",
      hover: "hover:bg-blue-50",
      iconBg: "bg-blue-50/60",
      action: () => onEdit(user),
    },
    {
      label: "Manage Memberships",
      icon: Building2,
      iconColor: "text-purple-500",
      hover: "hover:bg-purple-50",
      iconBg: "bg-purple-50/60",
      action: () => onManageMemberships(user),
    },
    {
      label: "Remove User",
      icon: Trash2,
      iconColor: "text-rose-500",
      hover: "hover:bg-rose-50",
      iconBg: "bg-rose-50/60",
      textColor: "text-rose-600",
      action: () => onRemove(user),
    },
  ];

  return (
    <div
      ref={dropdownRef}
      className="relative flex items-center justify-center z-50 "
    >
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className={`
          group
          relative
          flex items-center justify-center
          h-8 w-8
          rounded-xl  z-50
          bg-white/80
          backdrop-blur-sm
          border border-gray-200/70
          hover:border-indigo-300
          hover:shadow-lg
          hover:shadow-indigo-100/40
          active:scale-95
          transition-all duration-300
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-indigo-400
          focus-visible:ring-offset-2
          ${open ? "border-indigo-300 shadow-lg shadow-indigo-100/40 bg-indigo-50/40" : ""}
        `}
      >
        {open && (
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 opacity-20 -z-10 blur-sm" />
        )}

        <MoreVertical
          className={`
            h-4 w-4
            transition-all duration-300
            ${open ? "text-indigo-600 rotate-90" : "text-gray-500 group-hover:text-indigo-500 group-hover:scale-110"}
          `}
        />
      </button>

      {/* Dropdown – Glassmorphism with dynamic vertical placement */}
      <div
        ref={menuRef}
        className={`
          absolute
          ${isAbove ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"}
          right-0
          w-56
           z-50
          origin-top-right
          rounded-2xl
          bg-white/90
          backdrop-blur-xl
          shadow-[0_20px_60px_rgba(79,70,229,0.12)]
          border border-white/30
          overflow-hidden
          z-[999]
          transition-all duration-300 ease-out
          ${open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }
        `}
      >
        {/* Menu Items */}
        <div className="py-1.5">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={() => {
                  item.action();
                  setOpen(false);
                }}
                className={`
                  group
                  flex items-center gap-3
                  w-full
                  px-4
                  py-2.5
                  text-xs
                  font-medium
                  text-gray-700
                  transition-all duration-200
                  hover:pl-5
                  ${item.hover}
                  ${item.textColor || ""}
                  ${index > 0 ? "border-t border-gray-100/40" : ""}
                `}
              >
                <div
                  className={`
                    flex items-center justify-center
                    h-7 w-7
                    rounded-xl
                    ${item.iconBg}
                    transition-all duration-200
                    group-hover:scale-105
                    group-hover:shadow-sm
                  `}
                >
                  <Icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                </div>

                <span className="flex-1 text-left text-[13px] font-medium">
                  {item.label}
                </span>

                <ChevronRight
                  className="
                    h-3.5 w-3.5
                    text-gray-300
                    transition-all duration-200
                    group-hover:translate-x-1
                    group-hover:text-indigo-400
                  "
                />
              </button>
            );
          })}
        </div>

        {/* Bottom gradient bar */}
        <div className="h-[2px] bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 opacity-60" />
      </div>
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
  editingRoleInTable: string | null;
  setEditingRoleInTable: (value: string | null) => void;
  setEditingCompanyInTable: (value: Membership | null) => void;
  handleRoleChangeFromTable: (membership: Membership, newRole: UserRole, userId: number) => Promise<void>;
  handleRemoveMembershipFromTable: (companyId: number, companyName: string, userId: number, userName: string) => void;
}

interface UserMobileCardsProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onRemove: (user: User) => void;
  onManageMemberships: (user: User) => void;
}
const UserTable: React.FC<UserTableProps> = ({
  users,
  editingRoleInTable,
  setEditingRoleInTable,
  setEditingCompanyInTable,
  handleRoleChangeFromTable,
  handleRemoveMembershipFromTable,
  ...actionProps
}) => (
  <div className="hidden lg:block overflow-x-auto">
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 border-b border-gray-200/60">
            <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Companies / Roles
            </th>
            <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-right py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr
              key={user.id}
              className={`
                group transition-all duration-150
                ${index !== users.length - 1 ? 'border-b border-gray-100/80' : ''}
                hover:bg-gray-50/60
              `}
            >
              <td className="py-3.5 px-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-secondary/10 flex-shrink-0">
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
                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                      {user.first_name || user.username}
                      {user.last_name && ` ${user.last_name}`}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">@{user.username}</p>
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-5">
                <span className="text-sm text-gray-600 font-medium">
                  {user.email}
                </span>
              </td>
              <td className="py-3.5 px-5">
                <span className="text-sm text-gray-600 font-medium">
                  {formatPhone(user.phone_number)}
                </span>
              </td>
              <td className="py-3.5 px-5">
                {user.memberships.length > 0 ? (
                  <div className="max-h-[160px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-secondary/20 scrollbar-track-transparent hover:scrollbar-thumb-secondary/40">
                    <div className="flex flex-col gap-1.5">
                      {user.memberships.map((m: Membership, idx: number) => (
                        <div
                          key={idx}
                          className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-gray-100/80 bg-white/50 hover:bg-secondary/5 hover:border-secondary/20 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-secondary" />
                            <span className="text-xs font-medium text-gray-700 truncate max-w-[110px]">
                              {m.company_name}
                            </span>
                          </div>
                          {/* Role Dropdown or Role Badge */}
                          <div className="flex items-center gap-1">
                            {editingRoleInTable === `role-${user.id}-${m.company_id}` ? (
                              <div className="relative">
                                <select
                                  value={m.role}
                                  onChange={(e) => {
                                    handleRoleChangeFromTable(m, e.target.value as UserRole, user.id);
                                  }}
                                  onBlur={() => {
                                    setEditingRoleInTable(null);
                                    setEditingCompanyInTable(null);
                                  }}
                                  autoFocus
                                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border border-secondary/30 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20"
                                >
                                  {['admin', 'staff', 'viewer', 'delivery'].map((role) => (
                                    <option key={role} value={role} className="text-xs">
                                      {role}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingRoleInTable(`role-${user.id}-${m.company_id}`);
                                  setEditingCompanyInTable(m);
                                }}
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full cursor-pointer hover:scale-105 transition-transform ${m.role === 'admin' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : m.role === 'staff' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : m.role === 'delivery' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : m.role === 'viewer' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
                              >
                                {m.role}
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMembershipFromTable(m.company_id, m.company_name, user.id, user.first_name || user.username)}
                              className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove company"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">No companies</span>
                )}
              </td>
              <td className="py-3.5 px-5">
                <span className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                  ${user.is_active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                    : 'bg-gray-100 text-gray-500 border border-gray-200/50'
                  }
                `}>
                  {user.is_active ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Inactive
                    </>
                  )}
                </span>
              </td>
              <td className="py-3.5 px-5 text-right">
                <ActionsDropdown user={user} {...actionProps} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ============================================================
// Mobile Cards Component – with Scrollable Companies
// ============================================================
const UserMobileCards: React.FC<UserMobileCardsProps> = ({
  users,
  ...actionProps
}) => (
  <div className="lg:hidden grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 px-1 xs:px-2 sm:px-0">
    {users.map((user) => (
      <div
        key={user.id}
        className="bg-white rounded-xl xs:rounded-2xl border border-gray-100 p-2 xs:p-3 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 xs:gap-3 min-w-0">
            <div className="h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-secondary to-indigo-600 flex items-center justify-center text-white font-bold text-[10px] xs:text-xs sm:text-sm shrink-0">
              {getInitials(user.first_name, user.last_name, user.username)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-xs xs:text-sm sm:text-base truncate">
                {user.first_name || user.username}
              </p>
              <p className="text-[10px] xs:text-[11px] sm:text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <ActionsDropdown user={user} {...actionProps} />
          </div>
        </div>

        <div className="mt-3 xs:mt-4 space-y-2 flex-1">
          <div className="flex items-center gap-2 text-[11px] xs:text-xs sm:text-sm">
            <span className="text-gray-500">Phone:</span>
            <span className="text-gray-900 truncate">
              {formatPhone(user.phone_number)}
            </span>
          </div>

          {/* ─── SCROLLABLE COMPANIES SECTION ─── */}
          <div className="mt-1">
            <p className="text-[9px] xs:text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
              Companies
            </p>
            {user.memberships.length > 0 ? (
              <div className="max-h-24 xs:max-h-28 sm:max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-secondary/20 scrollbar-track-transparent hover:scrollbar-thumb-secondary/40">
                <div className="flex flex-col gap-1">
                  {user.memberships.map((m: Membership, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2 py-1 rounded-lg bg-gray-50/80 border border-gray-100/60"
                    >
                      <span className="text-[10px] xs:text-[11px] sm:text-xs font-medium text-gray-700 truncate max-w-[70%]">
                        {m.company_name}
                      </span>
                      <span
                        className={`text-[8px] xs:text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${roleStyles[m.role]}`}
                      >
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-[10px] xs:text-xs text-gray-400 italic">
                No companies assigned
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 xs:mt-3 pt-2 xs:pt-3 border-t border-gray-100 flex justify-between items-center">
          {user.is_active ? (
            <span className="inline-flex items-center gap-1 text-[10px] xs:text-xs text-emerald-600">
              <CheckCircle className="h-3 w-3 xs:h-4 xs:w-4" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] xs:text-xs text-red-600">
              <Minus className="h-3 w-3 xs:h-4 xs:w-4" />
              Inactive
            </span>
          )}
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
      <Users className="h-12 w-12 text-secondary" />
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
// Loading Skeleton (now includes mobile cards via MobileCardSkeleton)
// ============================================================
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Desktop stats skeleton */}
    <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-5">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-32 bg-gray-100 rounded-2xl animate-pulse"
        ></div>
      ))}
    </div>
    {/* Desktop table skeleton */}
    <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
    {/* Mobile cards skeleton (using shared MobileCardSkeleton) */}
    <div className="lg:hidden px-1 xs:px-2 sm:px-0">
      <MobileCardSkeleton count={5} />
    </div>
  </div>
);

// ============================================================
// Main Component: SuperAdminUsers
// ============================================================
const SuperAdminUsers: React.FC = () => {
  const { toast, showToast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
  // Table row role editing states
  const [editingRoleInTable, setEditingRoleInTable] = useState<string | null>(null);
  const [editingCompanyInTable, setEditingCompanyInTable] = useState<Membership | null>(null);
  // Remove membership modal states
  const [removeMembershipModalOpen, setRemoveMembershipModalOpen] = useState(false);
  const [removeMembershipData, setRemoveMembershipData] = useState<{
    companyId: number;
    companyName: string;
    userId: number;
    userName: string;
  } | null>(null);
  const [isRemovingMembership, setIsRemovingMembership] = useState(false);

  console.log(isDeleteModalOpen, "isDeleteModalOpen")
  console.log(editingCompanyInTable, "editingcompanyInTable")
  console.log(deletingUser, "deletingUser")

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
      const updated = allUsers.find((u) => u.id === managingUser.id);
      if (updated) setManagingUser(updated);
    }
  }, [allUsers, managingUser]);

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

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, pageSize]);

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

  const handleRefresh = async () => {
    setSearchTerm("");
    setRoleFilter("all");
    setCurrentPage(1);
    await refreshAllUsers();
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
    if (managingUser) {
      const updatedUser = users.find((u) => u.id === managingUser.id);
      if (updatedUser) setManagingUser(updatedUser);
    }
    if (selectedUser) {
      const updatedUser = users.find((u) => u.id === selectedUser.id);
      if (updatedUser) setSelectedUser(updatedUser);
    }
    if (editingUser) {
      const updatedUser = users.find((u) => u.id === editingUser.id);
      if (updatedUser) setEditingUser(updatedUser);
    }
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData: Partial<User>) => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.id, updatedData);
      await refreshAllUsers();
      showToast("success", "User updated successfully");
      setIsEditModalOpen(false);
    } catch (err: any) {
      showToast("error", err.message || "Failed to update user");
    }
  };

  const handleRemove = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  // const handleConfirmDelete = async () => {
  //   if (!deletingUser) return;
  //   try {
  //     await deleteUser(deletingUser.id);
  //     showToast("success", "User deleted successfully");
  //     setIsDeleteModalOpen(false);
  //     setDeletingUser(null);
  //     await refreshAllUsers();
  //   } catch (err: any) {
  //     showToast("error", err.message || "Failed to delete user");
  //   }
  // };

  const handleManageMemberships = (user: User) => {
    setManagingUser(user);
    setIsMembershipModalOpen(true);
  };
  // ── Table row role change handler ──
  const handleRoleChangeFromTable = async (membership: Membership, newRole: UserRole, userId: number) => {
    try {
      await updateUserCompanyRole(membership.company_slug, userId, newRole);
      await refreshAllUsers();
      showToast("success", `Role updated to ${newRole}`);
      setEditingRoleInTable(null);
      setEditingCompanyInTable(null);
    } catch (err: any) {
      showToast("error", err.message || "Failed to update role");
    }
  };

  // ── Table row remove membership handler ──
  const handleRemoveMembershipFromTable = (companyId: number, companyName: string, userId: number, userName: string) => {
    setRemoveMembershipData({ companyId, companyName, userId, userName });
    setRemoveMembershipModalOpen(true);
  };

  // ── Confirm remove membership ──
  const confirmRemoveMembership = async () => {
    if (!removeMembershipData) return;

    const { companyId, companyName, userId, userName } = removeMembershipData;

    setIsRemovingMembership(true);

    try {
      // Find the user to get their memberships
      const userToRemove = allUsers.find(u => u.id === userId);
      if (!userToRemove) {
        showToast("error", "User not found");
        setIsRemovingMembership(false);
        return;
      }

      // Find the membership to get the company_slug
      const membership = userToRemove.memberships.find(m => m.company_id === companyId);
      if (!membership) {
        showToast("error", "Membership not found");
        setIsRemovingMembership(false);
        return;
      }

      // Use the company_slug from the membership (not from availableCompanies)
      await removeUserFromCompany(membership.company_slug, userId);
      await refreshAllUsers();
      showToast("success", `Removed ${userName} from ${companyName}`);
      setRemoveMembershipModalOpen(false);
      setRemoveMembershipData(null);
    } catch (err: any) {
      showToast("error", err.message || "Failed to remove company");
    } finally {
      setIsRemovingMembership(false);
    }
  };

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
      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1 sm:gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="hidden sm:flex h-10 w-1.5 rounded-full bg-gradient-to-b from-secondary to-purple-400 shadow-sm" />

              <div className="min-w-0">
                <h1
                  className="
          text-base
          xs:text-md
          sm:text-lg
          md:text-xl
          font-black
          tracking-tight
          leading-tight
          bg-gradient-to-r
          from-secondary
          via-secondary
          to-secondary-dark
          bg-clip-text
          text-transparent
          break-words
        "
                >
                  User Management
                </h1>

                <p
                  className="
          mt-1
          text-xs
          xs:text-sm
          sm:text-base
          text-secondary-light
          leading-relaxed
          max-w-2xl
        "
                >
                  Manage platform users, roles, and company memberships
                </p>
              </div>
            </div>

            {/* Decorative line */}
            <div className="mt-1 h-[3px] w-20 sm:w-28 rounded-full bg-gradient-to-r from-secondary to-purple-300 opacity-80" />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              Total Users: {allUsers.length}
            </div>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-5">
          <StatCard
            title="Total Admins"
            value={stats.totalAdmins}
            icon={<Shield className="h-6 w-6 text-white" />}
            gradient="from-secondary to-secondary-dark"
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

        <div className="w-full sm:flex-1 sm:hidden">
          <UserFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            pageSize={pageSize}
            setPageSize={handlePageSizeChange}
          />
        </div>

        <div className="hidden sm:flex w-full items-center justify-between gap-3">
          <div className="w-full py-1">
            <TableControls
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            // className="w-full"
            >
              <UserFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                pageSize={pageSize}
                setPageSize={handlePageSizeChange}
              />
            </TableControls>
          </div>
        </div>

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
              editingRoleInTable={editingRoleInTable}
              setEditingRoleInTable={setEditingRoleInTable}
              setEditingCompanyInTable={setEditingCompanyInTable}
              handleRoleChangeFromTable={handleRoleChangeFromTable}
              handleRemoveMembershipFromTable={handleRemoveMembershipFromTable}
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
              enableUrlSync={false}
            />
          </>
        )}
      </div>

      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        user={selectedUser}
        onEdit={handleEdit}
        // onSuspend={(user) => console.log("Suspend user", user)}
        onDelete={handleRemove}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={editingUser}
        onSave={handleSaveEdit}
      />

      {/* Confirm Delete Modal for Remove Membership */}
      <ConfirmDeleteModal
        isOpen={removeMembershipModalOpen}
        onClose={() => {
          if (isRemovingMembership) return;
          setRemoveMembershipModalOpen(false);
          setRemoveMembershipData(null);
        }}
        onConfirm={confirmRemoveMembership}
        title="Remove Membership"
        message={`Are you sure you want to remove ${removeMembershipData?.companyName} from ${removeMembershipData?.userName}? This will revoke all access to that company.`}
        loading={isRemovingMembership}
      />

      <ManageMembershipsModal
        isOpen={isMembershipModalOpen}
        onClose={() => setIsMembershipModalOpen(false)}
        user={managingUser}
        availableCompanies={availableCompanies}
        onUpdateRole={async (userId, companySlug, role) => {
          try {
            await updateUserCompanyRole(companySlug, userId, role);
            await refreshAllUsers();
            showToast("success", "Role updated successfully");
          } catch (err: any) {
            showToast("error", "Failed to update role");
          }
        }}
        onRemoveMembership={async (userId, companyId) => {
          try {
            const company = availableCompanies.find((c) => c.id === companyId);
            if (!company) throw new Error("Company not found");
            await removeUserFromCompany(company.slug, userId);
            await refreshAllUsers();
            showToast("success", "User removed from company");
          } catch (err: any) {
            showToast("error", err.message || "Failed to remove user");
          }
        }}
        onRefresh={refreshAllUsers}
      />
      <Toast toast={toast} />
    </>
  );
};

export default SuperAdminUsers;
