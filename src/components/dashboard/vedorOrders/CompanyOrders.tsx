import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Eye,
  Package,
  Building2,
  User as UserIcon,
  RefreshCw,
  X,
} from "lucide-react";
import {
  getAdminVendorOrders,
  getCompanyVendorOrders,
} from "../../../services/api";
import type { VendorOrder } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { useAuth } from "../../../hooks/useAuth";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { Toast } from "../../ui/Toast";
import { VendorOrderFilters } from "./VendorOrderFilters";
import { VendorOrderDetailModal } from "./VendorOrderDetailModal";
import { DeliveryManager } from "./DeliveryManager";
import { CompanySelector } from "../company-products/CompanySelector";
import { useReadOnly } from "../AdminDashboard"; // 👈 viewer detection

const ITEMS_PER_PAGE = 10;

/* ---------- Reusable sub‑components ---------- */
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    approved: "bg-green-50 text-green-700 border border-green-200",
    paid: "bg-blue-50 text-blue-700 border border-blue-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    processing: "bg-orange-50 text-orange-700 border border-orange-200",
    confirmed: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    shipped: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    out_for_delivery: "bg-violet-50 text-violet-700 border border-violet-200",
    accepted: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    cancelled: "bg-red-50 text-red-700 border border-red-200",
    rejected: "bg-rose-50 text-rose-700 border border-rose-200",
    contacted: "bg-teal-50 text-teal-700 border border-teal-200",
    fulfilled: "bg-green-100 text-green-800 border border-green-200",
    payment_rejected: "bg-red-50 text-red-700 border border-red-200",
  };
  const color = colors[status.toLowerCase()] || "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status.replace(/_/g, " ")}
    </span>
  );
};

const CompanyAvatar = ({
  logo,
  name,
}: {
  logo?: string | null;
  name: string;
}) => (
  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
    {logo ? (
      <img src={logo} alt={name} className="w-full h-full object-cover" />
    ) : (
      <Building2 className="h-4 w-4 text-gray-500" />
    )}
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(8)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
    ))}
  </tr>
);

const EmptyState = () => (
  <tr>
    <td colSpan={8} className="text-center py-16">
      <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
      <p className="text-gray-500 font-medium">No vendor orders found</p>
      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
    </td>
  </tr>
);

const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <tr>
    <td colSpan={8} className="text-center py-12">
      <div className="text-red-600 mb-4">{error}</div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary transition"
      >
        Retry
      </button>
    </td>
  </tr>
);

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    let pageNum: number;
    if (totalPages <= 5) pageNum = i + 1;
    else if (currentPage <= 3) pageNum = i + 1;
    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
    else pageNum = currentPage - 2 + i;
    return pageNum;
  }).filter((p) => p >= 1 && p <= totalPages);

  return (
    <div className="flex gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        ‹
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-lg text-sm ${
            page === currentPage
              ? "bg-indigo-600 text-white"
              : "border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
};

/* ---------- Main Component ---------- */
export default function CompanyOrders() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();
  const readOnly = useReadOnly(); // true for viewers

  const isSuperAdmin = !user?.memberships?.length;
  const isAdminLike = isSuperAdmin || readOnly; // viewers see all data like super admin

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";

  // ---- Company selector overlay state ----
  const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);

  // Effective slug for API calls (only used when not admin‑like)
  const effectiveSlug = useMemo(() => {
    if (companySlug) return companySlug;
    if (!isSuperAdmin && user?.memberships?.length && !readOnly) {
      return user.memberships[0]?.company_slug || null;
    }
    return null;
  }, [companySlug, isSuperAdmin, user, readOnly]);

  // Are we showing all orders (super admin or viewer)?
  const isAdminView = isAdminLike && !companySlug;
  // For non‑admin‑like, show only the selected company's orders
  const shouldFetchAll = isAdminView || (readOnly && !companySlug);

  // ----- Filter state -----
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [allOrders, setAllOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast, showToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // ----- Fetch orders based on user role / company selection -----
  const fetchAllOrders = useCallback(async (): Promise<VendorOrder[]> => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("Please log in to view orders");
      setLoading(false);
      return [];
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const fetchPage = async (page: number) => {
        const params = {
          page,
          page_size: 200,
          ordering: "-created_at" as const,
        };

        if (shouldFetchAll) {
          return getAdminVendorOrders(params);
        } else if (effectiveSlug) {
          return getCompanyVendorOrders(effectiveSlug, params);
        } else {
          return { data: { results: [], count: 0 } };
        }
      };

      const firstResponse = await fetchPage(1);
      if (controller.signal.aborted) return [];

      let allData = [...firstResponse.data.results];
      const total = firstResponse.data.count;

      if (total > allData.length) {
        const remainingPages = Math.ceil((total - allData.length) / 200);
        const promises = [];
        for (let i = 0; i < remainingPages; i++) {
          promises.push(fetchPage(i + 2));
        }
        const results = await Promise.all(promises);
        results.forEach((res) => {
          allData = allData.concat(res.data.results);
        });
      }

      if (!controller.signal.aborted) {
        setAllOrders(allData);
      }
      return allData;
    } catch (err: any) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED")
        return [];
      const message =
        err.message === "SESSION_EXPIRED"
          ? "Your session has expired."
          : err.response?.data?.detail ||
            err.message ||
            "Failed to load orders";
      if (!controller.signal.aborted) {
        setError(message);
        showToast("error", message);
      }
      return [];
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [shouldFetchAll, effectiveSlug, showToast]);

  const handleModalUpdate = useCallback(async () => {
    const freshOrders = await fetchAllOrders();
    if (selectedOrder) {
      const updated = freshOrders.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [fetchAllOrders, selectedOrder]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    orderStatusFilter,
    deliveryStatusFilter,
    paymentMethodFilter,
    selectedCompanyId,
  ]);

  // Client‑side filtering (same as before)
  const filteredOrders = useMemo(() => {
    let result = allOrders;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          String(o.id).includes(s) ||
          o.company?.name?.toLowerCase().includes(s) ||
          o.recipient_name?.toLowerCase().includes(s),
      );
    }
    if (orderStatusFilter) {
      result = result.filter(
        (o) => o.status?.toLowerCase() === orderStatusFilter.toLowerCase(),
      );
    }
    if (deliveryStatusFilter) {
      result = result.filter(
        (o) =>
          o.delivery?.status?.toLowerCase() ===
          deliveryStatusFilter.toLowerCase(),
      );
    }
    if (paymentMethodFilter) {
      result = result.filter(
        (o) =>
          o.payment_method?.toLowerCase() === paymentMethodFilter.toLowerCase(),
      );
    }
    if (selectedCompanyId) {
      result = result.filter(
        (o) => o.company?.id === Number(selectedCompanyId),
      );
    }

    return result;
  }, [
    allOrders,
    searchTerm,
    orderStatusFilter,
    deliveryStatusFilter,
    paymentMethodFilter,
    selectedCompanyId,
  ]);

  const totalFilteredCount = filteredOrders.length;
  const totalPages = Math.ceil(totalFilteredCount / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const showingFrom =
    totalFilteredCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showingTo = Math.min(currentPage * ITEMS_PER_PAGE, totalFilteredCount);
  const goToPage = (page: number) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));

  const clearFilters = () => {
    setSearchTerm("");
    setOrderStatusFilter("");
    setDeliveryStatusFilter("");
    setPaymentMethodFilter("");
    setSelectedCompanyId("");
    setCurrentPage(1);
  };

  // Actions are disabled for viewers
  const canAssign = !readOnly;
  // const canClearCompany = isSuperAdmin || readOnly;
  const canSwitchCompany = isSuperAdmin || readOnly;

  const isAssignAllowed = (order: VendorOrder): boolean => {
    if (!canAssign) return false;
    const orderConfirmed = order.status?.toLowerCase() === "confirmed";
    return orderConfirmed;
  };

  const getDisabledReason = (order: VendorOrder): string => {
    if (!canAssign) return "You are in view‑only mode.";
    if (!order.status || order.status.toLowerCase() !== "confirmed") {
      return "Order status must be 'Confirmed' before a delivery person can be assigned.";
    }
    return "";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[#6750A4]">Vendor Orders</h2>
          {readOnly && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              View Only
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => clearCompany()}
              className="px-4 py-2 rounded-full border text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
            >
              <X className="h-4 w-4" /> Clear Company
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => setIsCompanySelectorOpen(true)}
              className="px-4 py-2 rounded-full border text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
            >
              <RefreshCw className="h-4 w-4" /> Switch Company
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-1 mb-4">
        {isAdminView
          ? "Showing all vendor orders"
          : companySlug
            ? `Orders for ${companyName}`
            : "Orders"}
      </p>

      {/* Filters */}
      <VendorOrderFilters
        searchTerm={searchTerm}
        onSearchChange={(v) => setSearchTerm(v)}
        orderStatusFilter={orderStatusFilter}
        onOrderStatusChange={(v) => setOrderStatusFilter(v)}
        deliveryStatusFilter={deliveryStatusFilter}
        onDeliveryStatusChange={(v) => setDeliveryStatusFilter(v)}
        paymentMethodFilter={paymentMethodFilter}
        onPaymentMethodChange={(v) => setPaymentMethodFilter(v)}
        selectedCompanyId={selectedCompanyId}
        onCompanyChange={(v) => setSelectedCompanyId(v)}
        companies={isAdminLike ? companies : []}
        onClear={clearFilters}
        showMobile={showFilters}
        onToggleMobile={() => setShowFilters(!showFilters)}
        hideCompanyFilter={!isAdminLike}
      />

      {/* Company selector overlay – accessible to viewers */}
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
              allowSwitch={canSwitchCompany}
            />
          </div>
        </div>
      )}

      {/* Orders Table */}
      {error ? (
        <ErrorState error={error} onRetry={fetchAllOrders} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Delivery
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Delivery Person
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginatedOrders.length === 0 ? (
                <EmptyState />
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CompanyAvatar
                          logo={order.company?.logo}
                          name={order.company?.name || "Unknown"}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {order.company?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {Number(order.amount).toLocaleString()}{" "}
                      <span className="text-xs text-gray-500">ETB</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={order.delivery?.status || "not assigned"}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {order.delivery?.delivery_person_name ? (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-800">
                              {order.delivery?.delivery_person_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Not assigned
                          </span>
                        )}
                        <div>
                          {isAssignAllowed(order) ? (
                            <button className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-[#6750A4] text-[#6750A4] hover:bg-[#6750A4]/10">
                              <DeliveryManager
                                orderId={order.id}
                                currentDelivery={order.delivery || null}
                                companySlug={order.company?.slug || ""}
                                onUpdate={fetchAllOrders}
                              />
                              {order.delivery?.delivery_person_name
                                ? "Change"
                                : "Assign"}
                            </button>
                          ) : (
                            <button
                              disabled
                              title={getDisabledReason(order)}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                            >
                              {order.delivery?.delivery_person_name
                                ? "Change"
                                : "Assign"}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.payment_method
                        ? order.payment_method.replace(/_/g, " ")
                        : "—"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs font-medium transition"
                      >
                        <Eye className="h-4 w-4" /> <span>View Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination footer */}
      {!loading && totalFilteredCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-500">
            Showing {showingFrom} to {showingTo} of {totalFilteredCount} orders
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      {/* Detail modal – read‑only by nature (no edit controls) */}
      <VendorOrderDetailModal
        order={selectedOrder}
        receipt={selectedOrder?.receipt || null}
        onClose={() => setSelectedOrder(null)}
        onUpdate={handleModalUpdate}
        readOnly={readOnly}
      />
    </div>
  );
}
