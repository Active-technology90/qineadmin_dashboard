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
  AlertCircle,
  Truck,
  Eye,
} from "lucide-react";
import type { User, Membership, UserRole } from "../../../types";

// Extended User type for additional fields
interface ExtendedUser extends User {
  gender?: string;
  date_joined?: string;
  last_login?: string;
  is_active?: boolean;
  permissions?: string[];
}

// Helper: format date
// const formatDate = (dateString?: string) => {
//   if (!dateString) return "Not available";
//   return new Date(dateString).toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   });
// };

// Helper: get role style
const roleStyles: Record<UserRole, string> = {
  owner: "bg-rose-100 text-rose-700 border-rose-200",
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  staff: "bg-blue-100 text-blue-700 border-blue-200",
  viewer: "bg-amber-100 text-amber-700 border-amber-200",
  delivery: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// Header Section (without close button)
const UserProfileHeader: React.FC<{ user: ExtendedUser }> = ({ user }) => {
  const initials =
    `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() ||
    user.username[0].toUpperCase();
  const isActive = user.is_active ?? true;

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {user.first_name || user.username} {user.last_name || ""}
          </h2>
          <p className="text-gray-500">@{user.username}</p>
          <div className="flex items-center gap-2 mt-1">
            {isActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <CheckCircle className="h-3 w-3" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <AlertCircle className="h-3 w-3" /> Inactive
              </span>
            )}
          </div>
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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        User Information
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {infoItems.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-medium text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Membership Card
const MembershipCard: React.FC<{ membership: Membership }> = ({
  membership,
}) => {
  const roleColor = roleStyles[membership.role];

  return (
    <div
      className={`group relative bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${roleColor}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {membership.company_name}
            </p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColor}`}
            >
              {membership.role}
            </span>
          </div>
        </div>
        {membership.is_active && (
          <div className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </div>
    </div>
  );
};

// Permissions Section
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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Permissions
      </h3>
      <div className="flex flex-wrap gap-2">
        {permissions.map((perm) => (
          <span
            key={perm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
          >
            {permissionIcons[perm] || <Shield className="h-3.5 w-3.5" />}
            {perm}
          </span>
        ))}
      </div>
    </div>
  );
};

// Statistics Mini Cards
const UserStatsCard: React.FC<{ user: ExtendedUser }> = ({ user }) => {
  const totalCompanies = user.memberships.length;
  const uniqueRoles = new Set(user.memberships.map((m) => m.role)).size;


  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 text-center">
        <Building2 className="h-5 w-5 text-purple-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-gray-900">{totalCompanies}</p>
        <p className="text-xs text-gray-500">Companies</p>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center">
        <Award className="h-5 w-5 text-blue-600 mx-auto mb-2" />
        <p className="text-2xl font-bold text-gray-900">{uniqueRoles}</p>
        <p className="text-xs text-gray-500">Roles</p>
      </div>
    
    </div>
  );
};

// Modal Footer Actions
const ModalActions: React.FC<{
  onEdit: () => void;
  // onSuspend: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ onEdit,  onDelete, onClose }) => (
  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
    <button
      onClick={onClose}
      className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
    >
      Cancel
    </button>
   
    <button
      onClick={onDelete}
      className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition shadow-md"
    >
      <Trash2 className="h-4 w-4 inline mr-2" />
      Delete User
    </button>
    <button
      onClick={onEdit }
      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg transition"
    >
      <Edit className="h-4 w-4 inline mr-2" />
      Edit User
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main Modal Component
// ─────────────────────────────────────────────────────────────
interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ExtendedUser | null;
  loading?: boolean;
  onEdit?: (user: ExtendedUser) => void;
  onSuspend?: (user: ExtendedUser) => void;
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-40 bg-gray-100 rounded animate-pulse" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (!user) return null;

  const handleEdit = () => onEdit?.(user);
  // const handleSuspend = () => onSuspend?.(user);
  const handleDelete = () => onDelete?.(user);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              {/* Close button at top right */}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <UserProfileHeader user={user} />
              <UserInfoCard user={user} />
              <UserStatsCard user={user} />

              {/* Company Memberships Section */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Company Memberships
                </h3>
                {user.memberships.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No company memberships</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.memberships.map((membership, idx) => (
                      <MembershipCard key={idx} membership={membership} />
                    ))}
                  </div>
                )}
              </div>

              <PermissionsSection user={user} />

              <ModalActions
                onEdit={handleEdit}
                // onSuspend={handleSuspend}
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
