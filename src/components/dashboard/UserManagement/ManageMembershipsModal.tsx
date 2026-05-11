import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  Building2,
  AlertCircle,
  Sparkles,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import type { User, UserRole } from "../../../types";

interface ManageMembershipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  availableCompanies: Array<{ id: number; name: string; slug: string }>;
  onAddMembership: (
    userId: number,
    companyId: number,
    role: UserRole,
  ) => Promise<void>;
  onUpdateRole: (
    userId: number,
    companySlug: string,
    role: UserRole,
  ) => Promise<void>;
  onRemoveMembership: (userId: number, companyId: number) => Promise<void>;
}

const roleOptions: UserRole[] = ["admin", "staff", "viewer", "delivery"];

// Helper for role badge colors
const getRoleBadgeClass = (role: UserRole) => {
  const classes = {
    admin: "bg-purple-100 text-purple-800 border-purple-200",
    staff: "bg-blue-100 text-blue-800 border-blue-200",
    viewer: "bg-amber-100 text-amber-800 border-amber-200",
    delivery: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return classes[role];
};

const ManageMembershipsModal: React.FC<ManageMembershipsModalProps> = ({
  isOpen,
  onClose,
  user,
  availableCompanies,
  onAddMembership,
  onUpdateRole,
  onRemoveMembership,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatingRoleCompanyId, setUpdatingRoleCompanyId] = useState<
    number | null
  >(null);
  const [removingCompanyId, setRemovingCompanyId] = useState<number | null>(
    null,
  );

  if (!isOpen || !user) return null;

  const handleAdd = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    setError("");
    try {
      await onAddMembership(user.id, Number(selectedCompanyId), selectedRole);
      setSelectedCompanyId("");
      setSelectedRole("staff");
    } catch (err: any) {
      setError(err.message || "Failed to add membership");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (companyId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this company membership?",
      )
    )
      return;
    setRemovingCompanyId(companyId);
    setError("");
    try {
      await onRemoveMembership(user.id, companyId);
    } catch (err: any) {
      setError(err.message || "Failed to remove membership");
    } finally {
      setRemovingCompanyId(null);
    }
  };

  const handleRoleChange = async (
    companySlug: string,
    companyId: number,
    newRole: UserRole,
  ) => {
    setUpdatingRoleCompanyId(companyId);
    setError("");

    try {
      await onUpdateRole(user.id, companySlug, newRole);
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    } finally {
      setUpdatingRoleCompanyId(null);
    }
  };

  const availableFilteredCompanies = availableCompanies.filter(
    (c) => !user.memberships.some((m) => m.company_id === c.id),
  );

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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient accent */}
            <div className="relative bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    Manage Memberships
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {user.first_name || user.username} • @{user.username}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/50 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Companies */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Current Companies
                </h3>
                {user.memberships.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">
                      No company memberships yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {user.memberships.map((m) => {
                      const isUpdating = updatingRoleCompanyId === m.company_id;
                      return (
                        <div
                          key={m.company_id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {m.company_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <select
                                  value={m.role}
                                  onChange={(e) =>
                                    handleRoleChange(
                                      m.company_slug,
                                      m.company_id,
                                      e.target.value as UserRole,
                                    )
                                  }
                                  disabled={isUpdating}
                                  className={`text-xs font-medium rounded-full px-2.5 py-0.5 border-0 focus:ring-2 focus:ring-purple-500 ${getRoleBadgeClass(m.role)}`}
                                >
                                  {roleOptions.map((role) => (
                                    <option
                                      key={role}
                                      value={role}
                                      className="capitalize"
                                    >
                                      {role}
                                    </option>
                                  ))}
                                </select>
                                {isUpdating && (
                                  <span className="text-xs text-gray-400 animate-pulse">
                                    Updating...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemove(m.company_id)}
                            disabled={removingCompanyId === m.company_id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove membership"
                          >
                            {removingCompanyId === m.company_id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add New Membership */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add New Membership
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <select
                      value={selectedCompanyId}
                      onChange={(e) =>
                        setSelectedCompanyId(Number(e.target.value))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                    >
                      <option value="">Select a company</option>
                      {availableFilteredCompanies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-36">
                    <select
                      value={selectedRole}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as UserRole)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role} className="capitalize">
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={!selectedCompanyId || loading}
                    className="px-5 py-2.5 bg-[#6750A4] text-white rounded-xl font-medium hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add Membership
                  </button>
                </div>
                {availableFilteredCompanies.length === 0 &&
                  selectedCompanyId === "" && (
                    <p className="text-xs text-gray-400 mt-2">
                      All companies are already assigned
                    </p>
                  )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManageMembershipsModal;
