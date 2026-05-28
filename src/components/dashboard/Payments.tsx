import { useState, useEffect, useMemo } from "react";
import { Search, Download, Loader2, RefreshCw, X, Building2 } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../ui/Toast";
import { Pagination } from "../ui/Pagination";
import { TableControls } from "../ui/TableControls";
import { getAdminPayouts, getPayouts } from "../../services/api";
import { useAuth } from "../../context/authContext";
import { useCurrentCompany } from "../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../hooks/useCompaniesList";
import { CompanySelector } from "./company-products/CompanySelector";
import type { VendorOrder } from "../../types";
import { CustomSelect, type SelectOption } from "../ui/CustomSelect";
import { SearchInput } from "../ui/SearchInput";

interface Payout {
  id: number;
  vendor_order: number;
  company_name: string;
  company_slug: string;
  company_logo?: string;
  gross_amount: string;
  platform_fee: string;
  net_amount: string;
  status: "pending" | "completed" | "failed" | "processing";
  scheduled_at: string;
  paid_at: string | null;
  reference: string | null;
  vendor_order_details: VendorOrder;
}

export default function Payments() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const isSuperAdmin = !user?.memberships?.length;

  // Company from context
  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";

  // Overlay for company selector
  const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);

  // Effective slug for API calls
  const effectiveCompanySlug = useMemo(() => {
    if (companySlug) return companySlug;
    if (!isSuperAdmin && user?.memberships?.length) {
      return user.memberships[0]?.company_slug || null;
    }
    return null;
  }, [companySlug, isSuperAdmin, user]);

  const isAllPayouts = isSuperAdmin && !effectiveCompanySlug;

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast, showToast } = useToast();
    const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
    // Options for Page Size dropdown
  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: "5 / page" },
    { value: "10", label: "10 / page" },
    { value: "15", label: "15 / page" },
    { value: "30", label: "30 / page" },
    { value: "60", label: "60 / page" },
  ];

  // Active filter count for mobile filter badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter) count++;
    return count;
  }, [searchTerm, statusFilter]);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, page_size: pageSize };
      let response;
      if (isAllPayouts) {
        response = await getAdminPayouts(params);
      } else {
        if (!effectiveCompanySlug) {
          setPayouts([]);
          setTotalCount(0);
          return;
        }
        response = await getPayouts(effectiveCompanySlug, params);
      }
      setPayouts(response.data.results || []);
      setTotalCount(response.data.count || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };
  console.log(totalCount);
  // Refetch when dependencies change
  useEffect(() => {
    fetchPayouts();
  }, [currentPage, pageSize, effectiveCompanySlug, isSuperAdmin, isAllPayouts]);

  // Reset to page 1 when filters or company change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, effectiveCompanySlug]);

  // Client-side filtering
  const filteredPayouts = payouts.filter((payout) => {
    if (statusFilter && payout.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        payout.vendor_order.toString().includes(term) ||
        payout.company_name.toLowerCase().includes(term) ||
        payout.status.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredPayouts.length / pageSize);
  const paginatedPayouts = filteredPayouts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownloadReceipt = (payoutId: number) => {
    showToast("info", `Receipt for payout ${payoutId} not yet implemented`);
  };

  // Error state (before table)
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPayouts}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-row items-start justify-between gap-2 mb-4 sm:mb-6">
        <div className="flex-1">
          <h2 className="text-xs sm:text-2xl font-bold sm:font-extrabold text-secondary sm:tracking-tight">
            {isAllPayouts
              ? "All Payouts"
              : `Payouts for ${companyName}`}
          </h2>
          <p className="text-[10px] sm:text-sm text-secondary mt-0.5">
            {isAllPayouts
              ? "View all company payouts"
              : "Track and manage company payouts"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isSuperAdmin && (
            <button
              onClick={() => setIsCompanySelectorOpen(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-secondary/10 to-secondary/5 text-secondary text-xs sm:text-sm font-medium hover:bg-secondary/20 transition-all duration-200 border border-secondary/20"
            >
              <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline">Switch Company</span>
              <span className="inline xs:hidden">Select</span>
            </button>
          )}
          {isSuperAdmin && companySlug && (
            <button
              onClick={() => clearCompany()}
              className="p-1 sm:p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-200"
              aria-label="Clear company"
            >
              <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Company Selector Overlay */}
      {isCompanySelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-4xl mx-4">
            <CompanySelector
              companies={companies}
              isLoading={isLoadingCompanies}
              onSelect={(slug, name) => {
                const membership = user?.memberships?.find(
                  (m: any) => m.company_slug === slug,
                );
                const role =
                  membership?.role ?? (isSuperAdmin ? "admin" : "staff");
                switchCompany({ slug, name, role });
                setIsCompanySelectorOpen(false);
              }}
              onBack={() => setIsCompanySelectorOpen(false)}
            />
          </div>
        </div>
      )}
            {/* Mobile Search + Filter Row - MOBILE ONLY */}
      <div className="mb-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex-[2]">
            <SearchInput
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder="Search by company or status..."
              loading={loading}
              showMobileFilter={true}
              onMobileFilterClick={() => setShowMobileFilterModal(true)}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <div className="flex-1">
            <CustomSelect
              value={String(pageSize)}
              onChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
              options={pageSizeOptions}
              placeholder="5"
            />
          </div>
        </div>
      </div>

       {/* Table Controls - DESKTOP ONLY (hidden on mobile) */}
      <div className="hidden lg:block">
        <TableControls pageSize={pageSize} onPageSizeChange={setPageSize}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by company, or status..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary/50 focus:border-secondary"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center justify-center gap-1.5"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
        </TableControls>
      </div>

      {/* Payouts Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm mt-3 -mx-3 sm:mx-0 px-3 sm:px-0">
        <table className="min-w-[600px] lg:min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm z-10 shadow-sm">
            <tr>
              <th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Order ID
                </span>
              </th>
              {isAllPayouts && (
                <th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Company
                  </span>
                </th>
              )}
              <th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Gross (ETB)
                </span>
              </th>
              <th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Platform Fee
                </span>
              </th>
              <th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Net (ETB)
                </span>
              </th>
              <th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Payment Status
                </span>
              </th>
              <th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Payment Method
                </span>
              </th>
              <th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-secondary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Payout Date</span>
                </div>
              </th>
              <th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-right text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-secondary mx-auto" />
                  <p className="mt-2 text-gray-500">Loading payouts...</p>
                </td>
               </tr>
            ) : paginatedPayouts.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-500">
                  No payouts found
                </td>
               </tr>
            ) : (
              paginatedPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-xs sm:text-sm font-semibold text-secondary truncate max-w-[80px] sm:max-w-none">
                    #{payout.vendor_order}
                  </td>
                  {isAllPayouts && (
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                      {payout.company_logo ? (
                          <img
                            src={payout.company_logo}
                            alt={payout.company_name}
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                          </div>
                        )}
                        <span className="text-[10px] sm:text-sm font-medium text-gray-700 truncate max-w-[100px] sm:max-w-none">
                          {payout.company_name}
                        </span>
                      </div>
                     </td>
                  )}
                  <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {Number(payout.gross_amount).toLocaleString()}
                    </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {Number(payout.platform_fee).toLocaleString()}
                    </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {Number(payout.net_amount).toLocaleString()}
                    </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(payout.status)}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {payout.status}
                    </span>
                    </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {payout?.vendor_order_details?.payment_method?.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'N/A'}
                    </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap">
                    {new Date(payout.scheduled_at).toLocaleDateString()}
                    </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(payout.id)}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg text-secondary hover:text-secondary/80 hover:bg-secondary/10 text-xs sm:text-sm font-medium transition-all duration-200"
                      title="Download receipt"
                    >
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Receipt</span>
                    </button>
                    </td>
                 </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      )}

      {/* Mobile Filter Modal - Bottom Sheet */}
      {showMobileFilterModal && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setShowMobileFilterModal(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
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
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Status
                </label>
                <CustomSelect
  value={statusFilter}
  onChange={(val) => setStatusFilter(val)}
  options={[
    { value: "", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
  ]}
  placeholder="All statuses"
/>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
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
    </div>
  );
}
