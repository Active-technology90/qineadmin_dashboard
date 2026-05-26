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
  Filter,
  Briefcase,
  UserCheck,
  UserMinus,
  Shield,
  Package,
  Minus,
  X,
  ChevronRight,
} from "lucide-react";
import {
  deleteUser,
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

const roleBadgeStyles: Record<UserRole, string> = {
  owner: "bg-rose-600 text-white",
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
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div
        className="
          w-full
          flex flex-col
          lg:flex-row
          lg:items-center
          gap-3
          lg:gap-4
        "
      >
        {/* SEARCH */}
        <div className="relative flex-1 min-w-0">
          {/* Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-secondary/10 to-purple-300/10 blur-xl opacity-70" />

          <div
            className="
              relative
              flex items-center
              rounded-2xl
              border border-gray-200/70
              bg-white/80
              backdrop-blur-xl
              shadow-sm
              hover:shadow-md
              focus-within:ring-4
              focus-within:ring-secondary/10
              focus-within:border-secondary/30
              transition-all duration-300
            "
          >
            <Search
              className="
                absolute left-3 sm:left-4
                h-4 w-4 sm:h-5 sm:w-5
                text-gray-400
              "
            />

            <input
              type="text"
              placeholder="Search users, email, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full
                bg-transparent
                pl-10 sm:pl-12
                pr-10
                py-2 sm:py-2.5
                text-sm sm:text-[15px]
                text-gray-700
                placeholder:text-gray-400
                rounded-2xl
                outline-none
              "
            />

            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="
                  absolute right-3
                  flex items-center justify-center
                  h-7 w-7
                  rounded-full
                  bg-gray-100
                  hover:bg-red-50
                  hover:text-red-500
                  transition-all duration-200
                  active:scale-90
                "
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div
          className="
            flex items-center
            gap-2 sm:gap-3
            w-full lg:w-auto
          "
        >
          {/* MOBILE FILTER BUTTON */}
          <div className="flex md:hidden flex-1 gap-2">
            <button
              onClick={() => setSheetOpen(true)}
              className="
                flex-1
                flex items-center justify-center gap-2
                px-3
                rounded-2xl
                bg-gradient-to-r
                from-secondary
                to-purple-500
                text-white
                text-sm font-semibold
                shadow-lg shadow-purple-500/20
                hover:scale-[1.01]
                active:scale-[0.98]
                transition-all duration-200
              "
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            <button
              onClick={() => setRoleFilter("all")}
              className="
                px-4 py-3
                rounded-2xl
                border border-gray-200
                bg-white/80
                backdrop-blur-md
                text-gray-700
                text-sm font-medium
                hover:bg-gray-50
                active:scale-95
                transition-all duration-200
              "
            >
              Reset
            </button>
          </div>

          {/* DESKTOP FILTER */}
          <div className="hidden md:flex w-full md:w-[240px] lg:w-[260px]">
            <div className="w-full rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
              <CustomSelect
                value={roleFilter}
                onChange={setRoleFilter}
                options={roleOptions}
                placeholder="Filter by role"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter Users"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Select a role to filter users
            </p>

            <button
              onClick={() => setRoleFilter("all")}
              className="
                text-xs font-semibold
                text-secondary
                hover:underline
              "
            >
              Reset All
            </button>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setRoleFilter(opt.value);
                  setSheetOpen(false);
                }}
                className={`
                  group
                  relative
                  flex flex-col items-center justify-center
                  gap-2
                  min-h-[88px]
                  rounded-2xl
                  border
                  px-3 py-4
                  text-sm font-semibold
                  transition-all duration-200
                  active:scale-[0.97]

                  ${
                    roleFilter === opt.value
                      ? `
                        bg-gradient-to-br
                        from-secondary
                        to-purple-500
                        border-purple-500
                        text-white
                        shadow-lg shadow-purple-500/20
                      `
                      : `
                        bg-gray-50
                        border-gray-200
                        text-gray-700
                        hover:border-secondary/30
                        hover:bg-purple-50
                      `
                  }
                `}
              >
                <div className="text-lg">
                  {opt.icon}
                </div>

                <span className="text-center leading-tight">
                  {opt.label}
                </span>
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const menuItems = [
    {
      label: "View Profile",
      icon: Eye,
      iconColor: "text-gray-600",
      hover: "hover:bg-gray-50",
      action: () => onView(user),
    },
    {
      label: "Edit User",
      icon: Edit,
      iconColor: "text-blue-600",
      hover: "hover:bg-blue-50",
      action: () => onEdit(user),
    },
    {
      label: "Manage Memberships",
      icon: Building2,
      iconColor: "text-purple-600",
      hover: "hover:bg-purple-50",
      action: () => onManageMemberships(user),
    },
    {
      label: "Remove User",
      icon: Trash2,
      iconColor: "text-red-600",
      hover: "hover:bg-red-50",
      textColor: "text-red-600",
      danger: true,
      action: () => onRemove(user),
    },
  ];

  return (
    <div
      ref={dropdownRef}
      className="relative flex items-center justify-center"
    >
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`
          group
          relative
          flex items-center justify-center
          h-9 w-9
          sm:h-10 sm:w-10
          rounded-2xl
          border border-transparent
          bg-white/70
          hover:bg-white
          hover:border-[#6758D4]/20
          hover:shadow-lg
          active:scale-95
          transition-all duration-200
          backdrop-blur-md
        `}
      >
        <MoreVertical
          className={`
            h-4 w-4 sm:h-5 sm:w-5
            text-gray-600
            transition-transform duration-200
            ${open ? "rotate-90" : "group-hover:scale-110"}
          `}
        />

        {open && (
          <span className="absolute inset-0 rounded-2xl ring-2 ring-[#6758D4]/20" />
        )}
      </button>

      {/* Dropdown */}
      <div
        className={`
          absolute right-0 top-[calc(100%+10px)]
         w-[160px]
xs:w-[160px]
sm:w-[200px]
md:w-72
lg:w-72
xl:w-72
max-w-[calc(100vw-24px)]
          origin-top-right
          rounded-3xl
          border border-white/40
          bg-white/85
          backdrop-blur-2xl
          shadow-[0_20px_60px_rgba(0,0,0,0.15)]
          overflow-hidden
          z-[999]
          transition-all duration-300 ease-out
          
          ${
            open
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }
        `}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-[#6758D4]/5 to-transparent">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            User Actions
          </p>
        </div>

        {/* Menu */}
        <div className="p-2">
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
                  relative
                  flex items-center justify-between
                  w-full
                  rounded-2xl
                  px-3 sm:px-4
                  py-3 sm:py-3.5
                  transition-all duration-200
                  active:scale-[0.98]
                  ${item.hover}
                  ${item.textColor || "text-gray-700"}
                  ${index !== menuItems.length - 1 ? "mb-1" : ""}
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`
                      flex items-center justify-center
                      h-9 w-9
                      rounded-xl
                      bg-white
                      shadow-sm
                      border border-gray-100
                      transition-all duration-200
                      group-hover:scale-105
                    `}
                  >
                    <Icon
                      className={`h-4 w-4 sm:h-[18px] sm:w-[18px] ${item.iconColor}`}
                    />
                  </div>

                  <span
                    className="
                      text-sm sm:text-[15px]
                      font-medium
                      truncate
                    "
                  >
                    {item.label}
                  </span>
                </div>

                <ChevronRight
                  className="
                    h-4 w-4
                    text-gray-300
                    transition-all duration-200
                    group-hover:translate-x-1
                    group-hover:text-gray-500
                  "
                />
              </button>
            );
          })}
        </div>

        {/* Bottom Glow */}
        <div className="h-1 bg-gradient-to-r from-[#6758D4] via-purple-400 to-pink-400 opacity-70" />
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
}
const UserTable: React.FC<UserTableProps> = ({ users, ...actionProps }) => (
  <div className="hidden lg:block overflow-x-auto">
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
                  <div className="flex items-center gap-1.5">
                    {" "}
                    <CheckCircle className="h-3 w-3" /> Active
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Minus className="h-3 w-3 text-red-600" />{" "}
                    <p className="text-red-600"> Inactive</p>
                  </div>
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
  <div className="lg:hidden grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 px-1 xs:px-2 sm:px-0">
    {users.map((user) => (
      <div
        key={user.id}
        className="bg-white rounded-xl xs:rounded-2xl border border-gray-100 p-2 xs:p-3 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 xs:gap-3 min-w-0">
            <div className="h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px] xs:text-xs sm:text-sm shrink-0">
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
          <div className="flex flex-wrap gap-1.5 xs:gap-2">
            {user.memberships.length > 0 ? (
              user.memberships.map((m: Membership, idx: number) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-lg xs:rounded-xl text-[9px] xs:text-[10px] sm:text-xs font-medium border ${roleStyles[m.role]} max-w-full truncate`}
                >
                  {m.company_name}
                </span>
              ))
            ) : (
              <span className="text-[10px] xs:text-xs text-gray-400">
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

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser.id);
      showToast("success", "User deleted successfully");
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      await refreshAllUsers();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete user");
    }
  };

  const handleManageMemberships = (user: User) => {
    setManagingUser(user);
    setIsMembershipModalOpen(true);
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
              
              <div className="hidden sm:flex h-10 w-1.5 rounded-full bg-gradient-to-b from-secondary to-secondary-light shadow-sm" />

              <div className="min-w-0">
                <h1
                  className="
          text-[22px]
          xs:text-2xl
          sm:text-3xl
          md:text-4xl
          font-black
          tracking-tight
          leading-tight
          bg-gradient-to-r
          from-secondary
          via-secondary
          to-secondary
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
          text-gray-500
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

        <div className="w-full sm:flex-1 sm:hidden">
          <UserFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            onRefresh={handleRefresh}
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
                onRefresh={handleRefresh}
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
