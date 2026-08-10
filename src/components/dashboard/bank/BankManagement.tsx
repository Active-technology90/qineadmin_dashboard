// BankManagement.tsx (fully corrected)
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Plus,
  Building2,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  getCompanyBankAccounts,
  createCompanyBankAccount,
  updateCompanyBankAccount,
  deleteCompanyBankAccount,
  getAdminBankAccounts,
  createAdminBankAccount,
  updateAdminBankAccount,
  deleteAdminBankAccount,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { SearchInput } from "../../ui/SearchInput";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useAuth } from "../../../hooks/useAuth";
import type { BankInfo } from "../../../types";

// ------------------------------------------------------------------
// Skeleton Row
// ------------------------------------------------------------------
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-8" />
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-24" />
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-32" />
    </td>
    <td className="px-4 py-3">
      <div className="h-6 bg-gray-200 rounded-full w-20" />
    </td>
    <td className="px-4 py-3">
      <div className="h-6 bg-gray-200 rounded-full w-16" />
    </td>
    <td className="px-4 py-3">
      <div className="flex justify-end gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded" />
        <div className="h-8 w-8 bg-gray-200 rounded" />
      </div>
    </td>
  </tr>
);

// ------------------------------------------------------------------
// Status Badge
// ------------------------------------------------------------------
const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <XCircle className="h-3 w-3" />
      Inactive
    </span>
  );
};

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export default function BankManagement() {
  const { company } = useCurrentCompany();
  const { user } = useAuth();
  const { toast, showToast } = useToast();

  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isSuperAdmin = !user?.memberships?.length;
  const companyName = company?.name || "Your Company";
  const canWrite =
    isSuperAdmin || company?.role === "owner" || company?.role === "admin";

  console.log("ddddd", deleting)
  console.log("ddddd", company?.slug)
  const fetchBanks = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      if (isSuperAdmin) {
        response = await getAdminBankAccounts();
      } else if (company?.slug) {
        response = await getCompanyBankAccounts(company.slug);
      } else {
        setBanks([]);
        return;
      }
      const results = response.data?.results || response.data || [];
      setBanks(
        results.map((bank: any) => ({
          ...bank,
          is_active: bank.is_active ?? true,
          company_name: bank.company_name || "Unknown Company",
          company_slug: bank.company_slug || "unknown",
        })),
      );
    } catch (error) {
      console.error("Failed to load banks:", error);
      setBanks([]);
      showToast("error", "Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  }, [showToast, isSuperAdmin, company]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return banks;
    const term = searchTerm.toLowerCase();
    return banks.filter(
      (b) =>
        b.bank_name.toLowerCase().includes(term) ||
        b.account_number.includes(term) ||
        b.account_name.toLowerCase().includes(term) ||
        (b.company_name && b.company_name.toLowerCase().includes(term)),
    );
  }, [banks, searchTerm]);

  const paginatedBanks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBanks.slice(start, start + pageSize);
  }, [filteredBanks, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredBanks.length / pageSize);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handleCreate = () => {
    setEditingBank(null);
    setShowModal(true);
  };

  const handleEdit = (bank: BankInfo) => {
    setEditingBank(bank);
    setShowModal(true);
  };

  // ── Corrected handleSave (multipart + _method patch) ──
  const handleSave = async (data: Partial<BankInfo>, logoFile?: File) => {
    try {
      // Remove company_slug if editing (backend may reject)
      if (editingBank) {
        delete data.company_slug;
      }

      let payload: Record<string, unknown> | FormData = data as Record<
        string,
        unknown
      >;

      // If a logo file is provided, use FormData
      if (logoFile) {
        const fd = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            fd.append(key, value.toString());
          }
        });
        fd.append("logo", logoFile);
        payload = fd;
      }

      if (editingBank) {
        // Update existing bank
        if (isSuperAdmin) {
          await updateAdminBankAccount(editingBank.id, payload);
        } else if (company?.slug) {
          await updateCompanyBankAccount(company.slug, editingBank.id, payload);
        }
        showToast("success", "Bank account updated successfully");
      } else {
        // Create new bank
        if (isSuperAdmin) {
          await createAdminBankAccount(payload);
        } else if (company?.slug) {
          await createCompanyBankAccount(company.slug, payload);
        }
        showToast("success", "Bank account created successfully");
      }

      setShowModal(false);
      setEditingBank(null);
      fetchBanks();
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0] ||
        (editingBank
          ? "Failed to update bank account"
          : "Failed to create bank account");
      showToast("error", msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (isSuperAdmin) {
        await deleteAdminBankAccount(deleteTarget.id);
      } else if (company?.slug) {
        await deleteCompanyBankAccount(company.slug, deleteTarget.id);
      }
      showToast("success", "Bank account deleted successfully");
      setDeleteTarget(null);
      fetchBanks();
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail || "Failed to delete bank account";
      showToast("error", msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <Toast toast={toast} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-secondary tracking-tight">
            Bank Accounts
          </h2>
          <p className="text-xs sm:text-sm text-secondary/70 mt-0.5">
            {isSuperAdmin
              ? "Manage all company bank accounts"
              : `Bank accounts for ${companyName}`}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Bank Account
          </button>
        )}
      </div>

      <div className="mb-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by bank name, account number, or account holder..."
          loading={loading}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm -mx-3 sm:mx-0 px-3 sm:px-0">
        <table className="min-w-[600px] lg:min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm shadow-sm">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  No.
                </span>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Bank Name
                </span>
              </th>
              {isSuperAdmin && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Company
                  </span>
                </th>
              )}
              <th className="px-3 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Account Number
                </span>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Account Holder
                </span>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Status
                </span>
              </th>
              {canWrite && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Actions
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            ) : paginatedBanks.length === 0 ? (
              <tr>
                <td
                  colSpan={isSuperAdmin ? 7 : 6}
                  className="text-center py-12 text-gray-500"
                >
                  <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="font-medium">No bank accounts found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {canWrite
                      ? "Add your first bank account"
                      : "No bank accounts have been added yet"}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedBanks.map((bank, index) => (
                <tr
                  key={bank.id}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-3 py-3 text-sm text-gray-500">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {bank.logo ? (
                          <img
                            src={bank.logo}
                            alt={bank.bank_name}
                            className="h-8 w-8 object-contain"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {bank.bank_name}
                      </span>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {bank.company_name || "N/A"}
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <span className="font-mono text-sm text-gray-700">
                      {bank.account_number}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700">
                    {bank.account_name}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge isActive={bank.is_active ?? true} />
                  </td>
                  {canWrite && (
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(bank)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-secondary hover:bg-secondary/10 transition"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(bank)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      {showModal && (
        <BankAccountForm
          bank={editingBank}
          isSuperAdmin={isSuperAdmin}
          companySlug={company?.slug}
          onClose={() => {
            setShowModal(false);
            setEditingBank(null);
          }}
          onSave={handleSave}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={`Bank Account "${deleteTarget?.bank_name || ""}"`}
        onConfirm={handleDelete}
        deleteTitle={"Delete Bank Account"}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ------------------------------------------------------------------
// Bank Account Form (logo upload with file, no base64)
// ------------------------------------------------------------------
function BankAccountForm({
  bank,
  isSuperAdmin,
  companySlug: _,
  onClose,
  onSave,
}: {
  bank: BankInfo | null;
  isSuperAdmin: boolean;
  companySlug?: string;
  onClose: () => void;
  onSave: (data: Partial<BankInfo>, logoFile?: File) => void;
}) {
  const [formData, setFormData] = useState<Record<string, any>>({
    bank_name: "",
    account_number: "",
    account_name: "",
    is_active: true,
    order: 0,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bank) {
      setFormData({
        bank_name: bank.bank_name || "",
        account_number: bank.account_number || "",
        account_name: bank.account_name || "",
        is_active: bank.is_active ?? true,
        order: bank.order ?? 0,
      });
      setLogoPreview(bank.logo || null);
    } else {
      setFormData({
        bank_name: "",
        account_number: "",
        account_name: "",
        is_active: true,
        order: 0,
      });
      setLogoPreview(null);
    }
    setLogoFile(null);
  }, [bank]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5 MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(bank?.logo || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.bank_name.trim() ||
      !formData.account_number.trim() ||
      !formData.account_name.trim()
    )
      return;

    setSaving(true);
    try {
      const dataToSend = { ...formData };

      // Remove company_slug on edit or if not superadmin
      if (!isSuperAdmin || bank) {
        delete dataToSend.company_slug;
      }

      // Pass the file to parent – parent will handle multipart
      await onSave(dataToSend, logoFile ?? undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-secondary">
            {bank ? "Edit Bank Account" : "New Bank Account"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <XCircle className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3">
          {/* Bank Name & Account Number */}
          <div className="flex flex-col md:flex-row items-start gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) =>
                  setFormData({ ...formData, bank_name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition text-sm"
                placeholder="e.g. Commercial Bank of Ethiopia"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) =>
                  setFormData({ ...formData, account_number: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition text-sm"
                placeholder="e.g. 100013456789"
                required
              />
            </div>
          </div>

          {/* Account Holder Name & Company Slug */}
          <div className="flex flex-col md:flex-row items-start gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.account_name}
                onChange={(e) =>
                  setFormData({ ...formData, account_name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition text-sm"
                placeholder="e.g. ABC Trading PLC"
                required
              />
            </div>
            {isSuperAdmin && !bank && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-0.5">
                  Company Slug
                </label>
                <input
                  type="text"
                  value={formData.company_slug || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, company_slug: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition text-sm"
                  placeholder="e.g. abc-trading"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty for an unassigned bank account.
                </p>
              </div>
            )}
          </div>

          {/* Bank Logo */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Bank Logo
            </label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Preview */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white transition-all hover:border-secondary hover:bg-gray-50"
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Bank Logo"
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-gray-400">
                      <Building2 className="h-6 w-6 mb-1" />
                      <span className="text-xs font-medium">No Logo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      Upload
                    </span>
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Upload Bank Logo
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-500">
                      PNG, JPG or SVG • Max 5 MB
                    </p>
                  </div>

                  {logoFile && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1">
                      <p className="text-xs font-medium text-emerald-700 truncate">
                        {logoFile.name}
                      </p>
                      <p className="text-xs text-emerald-600">
                        {(logoFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-secondary/90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {logoPreview ? "Replace" : "Choose"}
                    </button>
                    {(logoPreview || logoFile) && (
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order & Active */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={formData.order || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={formData.is_active ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary/20"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-secondary text-white font-medium text-sm hover:bg-secondary/90 transition shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {bank ? "Update" : "Create"} Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
