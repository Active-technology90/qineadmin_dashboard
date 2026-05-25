import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Phone,
  Building2,
  Shield,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Award,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  Truck,
  Briefcase,
} from "lucide-react";
import type { User, Membership } from "../../../types";

// Extended User type for additional fields
interface ExtendedUser extends User {
  gender?: string;
  date_joined?: string;
  last_login?: string;
  is_active?: boolean;
  permissions?: string[];
}

// Helper: format date (kept for potential future use)
// const formatDate = (dateString?: string) => {
//   if (!dateString) return "Not available";
//   return new Date(dateString).toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   });
// };

// Unified gray-only badge style for roles (Stripe/Linear inspired)
const roleBadgeClass = "bg-gray-100 text-gray-700 border border-gray-200";

// Premium Membership Card with hover lift and soft shadow
const MembershipCard: React.FC<{ membership: Membership }> = ({ membership }) => {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-xl border border-gray-100 p-3 xs:p-4 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
          <div className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
            <Building2 className="h-4 w-4 xs:h-5 xs:w-5 text-gray-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate text-sm xs:text-base">
              {membership.company_name}
            </p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-medium ${roleBadgeClass}`}>
              {membership.role}
            </span>
          </div>
        </div>
        {membership.is_active && (
          <div className="h-2 w-2 rounded-full bg-gray-400 ring-2 ring-white shrink-0" />
        )}
      </div>
    </motion.div>
  );
};

// Permissions Badges System
const PermissionsSection: React.FC<{ user: ExtendedUser }> = ({ user }) => {
  const defaultPermissions = useMemo(() => {
    const roles = user.memberships.map((m) => m.role);
    if (roles.includes("admin")) {
      return [
        "Manage Products",
        "Manage Orders",
        "View Analytics",
        "Manage Users",
      ];
    }
    if (roles.includes("staff")) {
      return ["Manage Products", "Manage Orders"];
    }
    if (roles.includes("delivery")) {
      return ["View Orders", "Update Delivery Status"];
    }
    return ["View Only"];
  }, [user.memberships]);

  const permissions = user.permissions || defaultPermissions;

  const permissionIcons: Record<string, React.ReactNode> = {
    "Manage Products": <Package className="h-3.5 w-3.5" />,
    "Manage Orders": <ShoppingCart className="h-3.5 w-3.5" />,
    "View Analytics": <BarChart3 className="h-3.5 w-3.5" />,
    "Manage Users": <Users className="h-3.5 w-3.5" />,
    "View Orders": <ShoppingCart className="h-3.5 w-3.5" />,
    "Update Delivery Status": <Truck className="h-3.5 w-3.5" />,
    "View Only": <Eye className="h-3.5 w-3.5" />,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 xs:p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 xs:mb-4">
        <h3 className="text-xs xs:text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Permissions
        </h3>
        <span className="text-[10px] xs:text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
          {permissions.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 xs:gap-2">
        {permissions.map((perm) => (
          <span
            key={perm}
            className="inline-flex items-center gap-1 xs:gap-1.5 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-[10px] xs:text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100 transition-colors hover:bg-gray-100"
          >
            {permissionIcons[perm] || <Shield className="h-3.5 w-3.5" />}
            {perm}
          </span>
        ))}
      </div>
    </div>
  );
};

// User Profile Header (Avatar, Name, Status)
const UserProfileHeader: React.FC<{ user: ExtendedUser }> = ({ user }) => {
  const initials =
    `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() ||
    user.username[0].toUpperCase();
  const isActive = user.is_active ?? true;

  return (
    <div className="flex flex-col xs:flex-row items-start gap-3 xs:gap-4">
      <div className="h-14 w-14 xs:h-16 xs:w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-lg xs:text-xl shadow-sm border border-gray-200 shrink-0 overflow-hidden">
        {user.profile_image ? (
          <img
            src={user.profile_image}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg xs:text-xl font-semibold text-gray-900 break-words">
          {user.first_name || user.username} {user.last_name || ""}
        </h2>
        <p className="text-xs xs:text-sm text-gray-500 mt-0.5 break-all">@{user.username}</p>
        <div className="flex items-center gap-2 mt-2">
          {isActive ? (
            <span className="inline-flex items-center gap-1 xs:gap-1.5 px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-medium bg-gray-100 text-gray-700">
              <CheckCircle className="h-3 w-3 text-gray-500" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 xs:gap-1.5 px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-medium bg-gray-100 text-gray-500">
              <Shield className="h-3 w-3" /> Inactive
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// User Information Card
const UserInfoCard: React.FC<{ user: ExtendedUser }> = ({ user }) => {
  const infoItems = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Phone", value: user.phone_number || "—" },
    { icon: Shield, label: "User ID", value: `#${user.id}` },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 xs:p-4 sm:p-5 shadow-sm">
      <h3 className="text-xs xs:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 xs:mb-4">
        User Information
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
        {infoItems.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2 xs:gap-3 min-w-0">
            <div className="h-7 w-7 xs:h-8 xs:w-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
              <Icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] xs:text-xs text-gray-500 truncate">{label}</p>
              <p className="text-xs xs:text-sm font-medium text-gray-900 break-words">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Statistics Cards (soft gray, no gradients)
const UserStatsCard: React.FC<{ user: ExtendedUser }> = ({ user }) => {
  const totalCompanies = user.memberships.length;
  const uniqueRoles = new Set(user.memberships.map((m) => m.role)).size;

  return (
    <div className="grid grid-cols-2 gap-3 xs:gap-4">
      <div className="bg-gray-50 rounded-xl p-3 xs:p-4 text-center border border-gray-100">
        <Building2 className="h-4 w-4 xs:h-5 xs:w-5 text-gray-500 mx-auto mb-1 xs:mb-2" />
        <p className="text-xl xs:text-2xl font-semibold text-gray-900">{totalCompanies}</p>
        <p className="text-[10px] xs:text-xs text-gray-500 mt-0.5 xs:mt-1">Companies</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 xs:p-4 text-center border border-gray-100">
        <Award className="h-4 w-4 xs:h-5 xs:w-5 text-gray-500 mx-auto mb-1 xs:mb-2" />
        <p className="text-xl xs:text-2xl font-semibold text-gray-900">{uniqueRoles}</p>
        <p className="text-[10px] xs:text-xs text-gray-500 mt-0.5 xs:mt-1">Roles</p>
      </div>
    </div>
  );
};

// Memberships Section with count header
const MembershipsSection: React.FC<{ memberships: Membership[] }> = ({ memberships }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 xs:p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 xs:mb-4">
        <h3 className="text-xs xs:text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Company Memberships
        </h3>
        <span className="text-[10px] xs:text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
          {memberships.length}
        </span>
      </div>
      {memberships.length === 0 ? (
        <div className="text-center py-6 xs:py-8 text-gray-400">
          <Briefcase className="h-8 w-8 xs:h-10 xs:w-10 mx-auto text-gray-300 mb-2" />
          <p className="text-xs xs:text-sm">No company memberships</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
          {memberships.map((membership, idx) => (
            <MembershipCard key={idx} membership={membership} />
          ))}
        </div>
      )}
    </div>
  );
};

// Modal Footer Actions (sticky, clean gray buttons)
const ModalActions: React.FC<{
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ onEdit, onDelete, onClose }) => (
  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 xs:gap-3">
    <button
      onClick={onClose}
      className="w-full sm:w-auto px-4 py-2 xs:py-2.5 rounded-lg border border-gray-200 text-gray-600 text-xs xs:text-sm font-medium hover:bg-gray-50 transition-all duration-200"
    >
      Cancel
    </button>
    <button
      onClick={onDelete}
      className="w-full sm:w-auto px-4 py-2 xs:py-2.5 rounded-lg border border-red-500 bg-red-500 text-white text-xs xs:text-sm font-medium hover:bg-red-600 transition-all duration-200"
    >
      <Trash2 className="h-4 w-4 inline mr-2" />
      Delete User
    </button>
    <button
      onClick={onEdit}
      className="w-full sm:w-auto px-4 py-2 xs:py-2.5 rounded-lg bg-secondary text-white text-xs xs:text-sm font-medium hover:bg-[#5a448c] transition-all duration-200 shadow-sm"
    >
      <Edit className="h-4 w-4 inline mr-2" />
      Edit User
    </button>
  </div>
);

// Loading Skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="bg-white rounded-none xs:rounded-t-[28px] sm:rounded-2xl shadow-xl w-full h-[100dvh] xs:h-[96dvh] sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[90vh] flex flex-col overflow-hidden mx-auto">
    <div className="px-4 xs:px-5 sm:px-6 py-3 xs:py-4 border-b border-gray-100 flex justify-between items-center">
      <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
      <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse" />
    </div>
    <div className="flex-1 overflow-y-auto px-4 xs:px-5 sm:px-6 py-4 xs:py-5 space-y-4 xs:space-y-6">
      <div className="flex gap-3 xs:gap-4">
        <div className="h-14 w-14 xs:h-16 xs:w-16 rounded-full bg-gray-100 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 gap-3 xs:gap-4">
        <div className="h-20 xs:h-24 bg-gray-50 rounded-xl animate-pulse" />
        <div className="h-20 xs:h-24 bg-gray-50 rounded-xl animate-pulse" />
      </div>
      <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
      <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
    </div>
    <div className="px-4 xs:px-5 sm:px-6 py-3 xs:py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-2 xs:gap-3">
      <div className="h-9 w-full sm:w-20 bg-gray-100 rounded animate-pulse" />
      <div className="h-9 w-full sm:w-24 bg-gray-100 rounded animate-pulse" />
      <div className="h-9 w-full sm:w-24 bg-gray-100 rounded animate-pulse" />
    </div>
  </div>
);

// Main Modal Component
interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ExtendedUser | null;
  loading?: boolean;
  onEdit?: (user: ExtendedUser) => void;
  onDelete?: (user: ExtendedUser) => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({
  isOpen,
  onClose,
  user,
  loading = false,
  onEdit,
  onDelete,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center sm:justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full"
            >
              <LoadingSkeleton />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (!user) return null;

  const handleEdit = () => onEdit?.(user);
  const handleDelete = () => onDelete?.(user);

  // Responsive modal container classes
  const modalClasses =
    "bg-white shadow-xl w-full max-h-[90vh] flex flex-col overflow-hidden mx-auto " +
    // Fullscreen on tiny (<320px)
    "max-[319px]:h-[100dvh] max-[319px]:rounded-t-xl " +
    // XS: bottom sheet style
    "xs:h-[95dvh] xs:rounded-t-xl xs:mt-auto " +
    // SM and up: centered modal
    "sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:max-w-xl " +
    "md:max-w-2xl " +
    "lg:max-w-4xl " +
    "xl:max-w-5xl " +
    "2xl:max-w-6xl";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center sm:justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className={modalClasses}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-4 xs:px-5 sm:px-6 py-3 xs:py-4 border-b border-gray-100 bg-white sticky top-0 z-10 backdrop-blur-sm bg-white/90">
              <h1 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 truncate">User profile</h1>
              <button
                onClick={onClose}
                className="p-1.5 xs:p-2 rounded-lg hover:bg-gray-50 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                aria-label="Close"
              >
                <X className="h-4 w-4 xs:h-5 xs:w-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 xs:px-5 sm:px-6 py-4 xs:py-5 space-y-4 xs:space-y-5 sm:space-y-6">
              <UserProfileHeader user={user} />
              <UserInfoCard user={user} />
              <UserStatsCard user={user} />
              <MembershipsSection memberships={user.memberships} />
              <PermissionsSection user={user} />
            </div>

            {/* Sticky Footer with safe-area */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 xs:px-5 sm:px-6 py-3 xs:py-4" style={{ paddingBottom: `max(env(safe-area-inset-bottom, 1rem), 1rem)` }}>
              <ModalActions
                onEdit={handleEdit}
                onDelete={handleDelete}
                onClose={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(ViewUserModal);