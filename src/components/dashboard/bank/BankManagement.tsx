import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Building2, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { getBankInfo } from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { SearchInput } from "../../ui/SearchInput";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useAuth } from "../../../hooks/useAuth";
import type { BankInfo } from "../../../types";

// Skeleton Row for loading state
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-8" /></td>
    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-10 w-10 bg-gray-200 rounded-lg" /><div className="h-4 bg-gray-200 rounded w-24" /></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32" /></td>
    <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-20" /></td>
    <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-16" /></td>
    <td className="px-4 py-3"><div className="flex justify-end gap-2"><div className="h-8 w-8 bg-gray-200 rounded" /><div className="h-8 w-8 bg-gray-200 rounded" /></div></td>
  </tr>
);

// Status Badge Component
const StatusBadge = ({ isVerified }: { isVerified: boolean }) => {
  if (isVerified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="h-3 w-3" />
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <XCircle className="h-3 w-3" />
      Pending
    </span>
  );
};

// Main Component
export default function BankManagement() {
  const { company } = useCurrentCompany();
  const { user } = useAuth();
  const { toast, showToast } = useToast();

  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankInfo | null>(null);

  const isSuperAdmin = !user?.memberships?.length;
  const companyName = company?.name || "Your Company";

  const fetchBanks = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use company slug for company-specific banks
      const companySlug = isSuperAdmin ? undefined : company?.slug;
      
      // For now, use getBankInfo() which returns static data
      // TODO: Replace with company-specific API when backend is ready
      const response = await getBankInfo();
      const results = response.data?.results || response.data || [];
      
      // If no banks from API, use company-specific mock data
      if (results.length === 0) {
        // Company-specific mock banks
        let mockBanks = [];
        
        if (isSuperAdmin) {
          // Super Admin sees ALL banks
          mockBanks = [
            {
              id: 1,
              bank_name: "Commercial Bank of Ethiopia",
              account_number: "100013456789",
              account_name: "ABC Trading PLC",
              branch_name: "Bole Branch",
              is_verified: true,
              currency: "ETB",
              company_name: "ABC Trading PLC",
              company_slug: "abc-trading"
            },
            {
              id: 2,
              bank_name: "Dashin Bank",
              account_number: "200024567890",
              account_name: "XYZ Manufacturing",
              branch_name: "Head Office",
              is_verified: false,
              currency: "ETB",
              company_name: "XYZ Manufacturing",
              company_slug: "xyz-manufacturing"
            },
            {
              id: 3,
              bank_name: "Bank of Abyssinia",
              account_number: "300035678901",
              account_name: "ABC Trading PLC",
              branch_name: "Piassa Branch",
              is_verified: true,
              currency: "ETB",
              company_name: "ABC Trading PLC",
              company_slug: "abc-trading"
            }
          ];
        } else {
          // Company Admin sees ONLY their company's banks
          const companyName = company?.name || "Your Company";
          const companySlug2 = company?.slug || "your-company";
          
          mockBanks = [
            {
              id: 1,
              bank_name: "Commercial Bank of Ethiopia",
              account_number: "100013456789",
              account_name: companyName,
              branch_name: "Bole Branch",
              is_verified: true,
              currency: "ETB",
              company_name: companyName,
              company_slug: companySlug2
            },
            {
              id: 2,
              bank_name: "Dashin Bank",
              account_number: "200024567890",
              account_name: companyName,
              branch_name: "Head Office",
              is_verified: false,
              currency: "ETB",
              company_name: companyName,
              company_slug: companySlug2
            }
          ];
        }
        
        setBanks(mockBanks);
      } else {
        // Enrich with company info and filter by current company
        let enriched = results.map((bank: any) => ({
          ...bank,
          is_verified: bank.is_verified ?? false,
          currency: bank.currency || "ETB",
          company_name: bank.company_name || "Unknown Company",
          company_slug: bank.company_slug || "unknown"
        }));
        
        // If not Super Admin, filter by current company
        if (!isSuperAdmin && company?.slug) {
          enriched = enriched.filter(
            (bank: any) => bank.company_slug === company.slug
          );
        }
        
        setBanks(enriched);
      }
    } catch (error) {
      console.error("Failed to load banks:", error);
      // Show empty state on error instead of mock data
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
        b.account_name.toLowerCase().includes(term)
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

  const handleDelete = async (bankId: number) => {
    if (!window.confirm("Are you sure you want to delete this bank account?")) return;
    try {
      setBanks(prev => prev.filter(b => b.id !== bankId));
      showToast("success", "Bank account deleted successfully");
    } catch (error) {
      showToast("error", "Failed to delete bank account");
    }
  };

  const handleVerify = async (bankId: number) => {
    try {
      setBanks(prev =>
        prev.map(b =>
          b.id === bankId ? { ...b, is_verified: true } : b
        )
      );
      showToast("success", "Bank account verified successfully");
    } catch (error) {
      showToast("error", "Failed to verify bank account");
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
            {isSuperAdmin ? "Manage all company bank accounts" : `Bank accounts for ${companyName}`}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Bank Account
        </button>
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
              <th className="px-3 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Currency
                </span>
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => <SkeletonRow key={i} />)
            ) : paginatedBanks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="font-medium">No bank accounts found</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first bank account</p>
                </td>
              </tr>
            ) : (
              paginatedBanks.map((bank, index) => (
                <tr key={bank.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-3 py-3 text-sm text-gray-500">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {bank.logo ? (
                          <img src={bank.logo} alt={bank.bank_name} className="h-8 w-8 object-contain" />
                        ) : (
                          <Building2 className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{bank.bank_name}</span>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {bank.company_name || "N/A"}
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <span className="font-mono text-sm text-gray-700">{bank.account_number}</span>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700">{bank.account_name}</td>
                  <td className="px-3 py-3">
                    <StatusBadge isVerified={bank.is_verified || false} />
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500">{bank.currency || "ETB"}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(bank)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-secondary hover:bg-secondary/10 transition"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {isSuperAdmin && !bank.is_verified && (
                        <button
                          onClick={() => handleVerify(bank.id)}
                          className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          title="Verify"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(bank.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
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
          onClose={() => setShowModal(false)}
          onSave={(data) => {
            if (editingBank) {
              setBanks(prev =>
                prev.map(b =>
                  b.id === editingBank.id ? { ...b, ...data, is_verified: false } : b
                )
              );
              showToast("success", "Bank account updated");
            } else {
              const newBank = {
                id: Date.now(),
                ...data,
                is_verified: false,
                currency: data.currency || "ETB",
              };
              setBanks(prev => [...prev, newBank]);
              showToast("success", "Bank account created");
            }
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// Bank Account Form Component
function BankAccountForm({
  bank,
  onClose,
  onSave,
}: {
  bank: BankInfo | null;
  onClose: () => void;
  onSave: (data: Partial<BankInfo>) => void;
}) {
  const [formData, setFormData] = useState<Partial<BankInfo>>({
    bank_name: "",
    account_number: "",
    account_name: "",
    branch_name: "",
    currency: "ETB",
    account_type: "operating",
  });

  useEffect(() => {
    if (bank) {
      setFormData(bank);
    }
  }, [bank]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank_name || !formData.account_number || !formData.account_name) {
      alert("Please fill in all required fields");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition"
              placeholder="e.g. Commercial Bank of Ethiopia"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition"
              placeholder="e.g. 100013456789"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition"
              placeholder="e.g. ABC Trading PLC"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name
            </label>
            <input
              type="text"
              value={formData.branch_name || ""}
              onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition"
              placeholder="e.g. Bole Branch"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency || "ETB"}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition bg-white"
              >
                <option value="ETB">ETB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <select
                value={formData.account_type || "operating"}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition bg-white"
              >
                <option value="operating">Operating</option>
                <option value="savings">Savings</option>
                <option value="escrow">Escrow</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-secondary text-white font-medium hover:bg-secondary/90 transition shadow-sm"
            >
              {bank ? "Update" : "Create"} Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}