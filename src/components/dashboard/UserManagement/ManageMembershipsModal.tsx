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
import { useAddCompanyUser } from "../../../hooks/useAddCompanyUser";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";

interface ManageMembershipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  availableCompanies: Array<{ id: number; name: string; slug: string }>;
  onUpdateRole: (
    userId: number,
    companySlug: string,
    role: UserRole,
  ) => Promise<void>;
  onRemoveMembership: (userId: number, companyId: number) => Promise<void>;
  onRefresh?: () => void;
}

const roleOptions: UserRole[] = ["admin", "staff", "viewer", "delivery"];

const roleSelectOptions: SelectOption[] = roleOptions.map((role) => ({
  label: role.charAt(0).toUpperCase() + role.slice(1),
  value: role,
}));


const ManageMembershipsModal: React.FC<ManageMembershipsModalProps> = ({
  isOpen,
  onClose,
  user,
  availableCompanies,
  onUpdateRole,
  onRemoveMembership,
  onRefresh,
}) => {
  const { addUser } = useAddCompanyUser();

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

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [companyToRemove, setCompanyToRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);

  if (!isOpen || !user) return null;

  const userEmail = user.email;

  // --- Add membership ---
  const handleAdd = async () => {
    if (!selectedCompanyId) return;

    const selectedCompany = availableCompanies.find(
      (c) => c.id === Number(selectedCompanyId),
    );
    if (!selectedCompany) {
      setError("Selected company not found");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await addUser(selectedCompany.slug, userEmail, selectedRole);
      setSelectedCompanyId("");
      setSelectedRole("staff");
      onRefresh?.();
    } catch (err: any) {
      setError(err.message || "Failed to add membership");
    } finally {
      setLoading(false);
    }
  };

  // --- Remove membership (called after confirmation) ---
  const confirmRemove = async () => {
    if (!companyToRemove) return;

    setRemovingCompanyId(companyToRemove.id);
    setError("");
    try {
      await onRemoveMembership(user.id, companyToRemove.id);
      onRefresh?.();
      setConfirmModalOpen(false);
      setCompanyToRemove(null);
    } catch (err: any) {
      setError(err.message || "Failed to remove membership");
    } finally {
      setRemovingCompanyId(null);
    }
  };

  const handleRemoveClick = (companyId: number, companyName: string) => {
    setCompanyToRemove({ id: companyId, name: companyName });
    setConfirmModalOpen(true);
  };

  // --- Update role ---
  const handleRoleChange = async (
    companySlug: string,
    companyId: number,
    newRole: UserRole,
  ) => {
    setUpdatingRoleCompanyId(companyId);
    setError("");
    try {
      await onUpdateRole(user.id, companySlug, newRole);
      onRefresh?.();
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    } finally {
      setUpdatingRoleCompanyId(null);
    }
  };

  const availableFilteredCompanies = availableCompanies.filter(
    (c) => !user.memberships.some((m) => m.company_id === c.id),
  );

  // Transform companies into CustomSelect options
  const companySelectOptions: SelectOption[] = availableFilteredCompanies.map(
    (c) => ({
      label: c.name,
      value: String(c.id),
      icon: <Building2 className="h-4 w-4 text-purple-500" />,
    }),
  );

  // Responsive modal classes
  const modalContainerClasses = `
  bg-white shadow-2xl overflow-hidden flex flex-col
  w-full min-w-0

  /* <320px devices */
  max-[319px]:h-[100dvh]
  max-[319px]:rounded-none
  max-[319px]:max-w-full

  /* 320px+ */
  min-[320px]:h-[100dvh]
  min-[320px]:rounded-none

  /* xs */
  xs:h-[96dvh]
  xs:rounded-t-[28px]
  xs:mt-auto

  /* sm */
  sm:max-w-xl
  sm:h-auto
  sm:max-h-[92dvh]
  sm:rounded-3xl
  sm:mx-4

  /* md */
  md:max-w-2xl
  md:max-h-[90dvh]

  /* lg */
  lg:max-w-4xl
  lg:max-h-[88dvh]

  /* xl */
  xl:max-w-5xl

  /* 2xl */
  2xl:max-w-6xl
`;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={modalContainerClasses}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-20 bg-gradient-to-r from-purple-50 to-indigo-50 px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-5 border-b border-gray-200/60 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                      <Building2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <span className="truncate">Manage Memberships</span>
                    </h2>
                    <p className="text-xs xs:text-sm text-gray-500 mt-1 truncate">
                      {user.first_name || user.username} • @{user.username}
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-1.5 xs:p-2 rounded-full hover:bg-white/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Add New Membership */}
              <div className="p-3 xs:p-4 sm:p-5 md:p-6 border-b border-gray-100 space-y-3">
                <h3 className="text-xs xs:text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="h-4 w-4 flex-shrink-0" />
                  Add New Membership
                </h3>
                <div className="flex flex-col xs:flex-col sm:flex-row gap-2 xs:gap-3">
                  {/* Company CustomSelect */}
                  <div className="w-full sm:flex-1 min-w-0">
                    <CustomSelect
                      value={selectedCompanyId.toString()}
                      onChange={(val) =>
                        setSelectedCompanyId(val === "" ? "" : Number(val))
                      }
                      options={companySelectOptions}
                      placeholder="Select a company"
                      className="w-full"
                      maxHeight={220}
                    />
                  </div>
                  {/* Role CustomSelect */}
                  <div className="w-full xs:w-full sm:w-36">
                    <CustomSelect
                      value={selectedRole}
                      onChange={(val) => setSelectedRole(val as UserRole)}
                      options={roleSelectOptions}
                      className="text-xs xs:text-sm"
                      maxHeight={160}
                    />
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={!selectedCompanyId || loading}
                    className="w-full sm:w-auto px-4 xs:px-5 py-2 xs:py-2.5 bg-[#6750A4] text-white rounded-xl font-medium hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2 text-xs xs:text-sm whitespace-nowrap"
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
                    <p className="text-[11px] xs:text-xs text-gray-400">
                      All companies are already assigned
                    </p>
                  )}
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-5 space-y-4 sm:space-y-5 md:space-y-6">
                {/* Current Companies */}
                <div>
                  <h3 className="text-xs xs:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 flex-shrink-0" />
                    Current Companies
                  </h3>
                  {user.memberships.length === 0 ? (
                    <div className="text-center py-6 xs:py-8 bg-gray-50 rounded-xl">
                      <Building2 className="h-10 w-10 xs:h-12 xs:w-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-400 text-xs xs:text-sm">
                        No company memberships yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 xs:space-y-3">
                      {user.memberships.map((m) => {
                        const isUpdating =
                          updatingRoleCompanyId === m.company_id;
                        return (
                          <div
                            key={m.company_id}
                            className="flex max-[350px]:flex-col items-center justify-between p-3 xs:p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all gap-2 xs:gap-3"
                          >
                            <div className="flex items-center gap-2 xs:gap-3 flex-1 min-w-0 w-full max-[350px]:w-full">
                              <div className="h-9 w-9 xs:h-10 xs:w-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4 xs:h-5 xs:w-5 text-purple-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 truncate text-sm xs:text-base">
                                  {m.company_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-28 xs:w-32 sm:w-36">
                                    <CustomSelect
                                      value={m.role}
                                      onChange={(val) =>
                                        handleRoleChange(
                                          m.company_slug,
                                          m.company_id,
                                          val as UserRole,
                                        )
                                      }
                                      options={roleSelectOptions}
                                      className="text-[10px] xs:text-xs sm:text-xs font-medium"
                                      maxHeight={160}
                                    />
                                  </div>
                                  {isUpdating && (
                                    <span className="text-[10px] xs:text-xs text-gray-400 animate-pulse">
                                      Updating...
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveClick(m.company_id, m.company_name)
                              }
                              disabled={removingCompanyId === m.company_id}
                              className="p-1.5 xs:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0 self-start max-[350px]:self-end"
                              aria-label={`Remove ${m.company_name}`}
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
              </div>

              {/* Sticky Footer */}
              <div
                className="sticky bottom-0 z-20 bg-white border-t border-gray-200/60 p-3 xs:p-4 sm:p-5 md:p-6 space-y-3 xs:space-y-4"
                style={{
                  paddingBottom: `max(env(safe-area-inset-bottom, 1rem), 1rem)`,
                }}
              >
                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-2 xs:p-3 bg-red-50 rounded-xl text-red-600 text-xs xs:text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                {/* Done Button */}
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2 xs:py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-xs xs:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for removal */}
      <ConfirmDeleteModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setCompanyToRemove(null);
        }}
        onConfirm={confirmRemove}
        title="Remove Membership"
        message={`Are you sure you want to remove ${companyToRemove?.name} from ${user.first_name || user.username}? This will revoke all access to that company.`}
        loading={removingCompanyId !== null}
      />
    </>
  );
};

export default ManageMembershipsModal;
