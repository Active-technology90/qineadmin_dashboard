import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Eye, Package, Truck, Filter, Search, X } from "lucide-react";
import { getAdminMasterOrders } from "../../../services/api";
import type { MasterOrder } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { OrderDetailModal } from "./OrderDetailModal";
import { OrderFilters } from "./OrderFilters";

const DEFAULT_PAGE_SIZE = 10;

// ---------- Premium UI Subcomponents ----------

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "verifying receipt": "bg-orange-50 text-orange-700 border-orange-200",
    "checkout initiated": "bg-gray-50 text-gray-600 border-gray-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  const normalized = status?.toLowerCase?.() || "";
  const color =
    colors[normalized] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status || "Unknown"}
    </span>
  );
};

const OrderDate = ({ dateString }: { dateString?: string }) => {
  if (!dateString) return <span className="text-gray-400 text-xs">—</span>;
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday =
    new Date(now.setDate(now.getDate() - 1)).toDateString() ===
    date.toDateString();

  const formatTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const formatDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-gray-900">
        {isToday ? "Today" : isYesterday ? "Yesterday" : formatDate}
      </span>
      <span className="text-xs text-gray-500 font-mono">{formatTime}</span>
    </div>
  );
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(10)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
    ))}
  </tr>
);

const EmptyState = () => (
  <tr>
    <td colSpan={10} className="text-center py-12">
      <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
      <p className="text-gray-500 font-medium">No orders found</p>
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
    <td colSpan={10} className="text-center py-10">
      <div className="text-red-600 mb-4">{error}</div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Retry
      </button>
    </td>
  </tr>
);

// ---------- Main Component ----------
export default function Orders() {
  const [orders, setOrders] = useState<MasterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [fulfillmentTypeFilter, setFulfillmentTypeFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const { toast, showToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper: get aggregated delivery status for a master order
  const getOrderDeliveryStatus = (order: MasterOrder): string => {
    const statuses =
      order.vendor_orders?.map((vo) => vo.delivery_status).filter((s) => !!s) ||
      [];
    if (statuses.length === 0) return "N/A";
    const unique = [...new Set(statuses)];
    if (unique.length === 1) return unique[0] || "N/A";
    return "multiple";
  };

  // Fetch orders with abort support
  const fetchOrders = useCallback(
    async (page: number, status: string) => {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Please log in to view orders");
        setLoading(false);
        return;
      }

      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const res = await getAdminMasterOrders({
          page,
          page_size: pageSize,
          status: status || undefined,
          ordering: "-created_at",
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setOrders(res.data.results);
        }
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        const message =
          err.message === "SESSION_EXPIRED"
            ? "Your session has expired. Please log in again."
            : err.response?.data?.detail ||
              err.message ||
              "Failed to load orders";
        if (!controller.signal.aborted) {
          setError(message);
          showToast("error", message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [pageSize, showToast],
  );

  // Reset page when pageSize changes
  useEffect(() => setCurrentPage(1), [pageSize]);

  // Fetch when dependencies change
  useEffect(() => {
    if (localStorage.getItem("access")) {
      fetchOrders(currentPage, statusFilter);
    }
  }, [currentPage, statusFilter, pageSize, fetchOrders]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  // Client-side filtering (search + additional filters)
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          String(o.id).includes(lower) ||
          o.recipient_name?.toLowerCase().includes(lower) ||
          o.shipping_phone?.toLowerCase().includes(lower) ||
          o.shipping_address_text?.toLowerCase().includes(lower),
      );
    }
    if (statusFilter) result = result.filter((o) => o.status === statusFilter);
    if (deliveryStatusFilter) {
      result = result.filter(
        (o) => getOrderDeliveryStatus(o) === deliveryStatusFilter,
      );
    }
    if (paymentStatusFilter)
      result = result.filter((o) => o.payment_status === paymentStatusFilter);
    if (fulfillmentTypeFilter)
      result = result.filter(
        (o) => o.fulfillment_type === fulfillmentTypeFilter,
      );
    return result;
  }, [
    orders,
    searchTerm,
    statusFilter,
    deliveryStatusFilter,
    paymentStatusFilter,
    fulfillmentTypeFilter,
  ]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const goToPage = (page: number) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));

  // Reset page when filters change
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredOrders.length, pageSize]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDeliveryStatusFilter("");
    setPaymentStatusFilter("");
    setFulfillmentTypeFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
      <Toast toast={toast} />

      {/* Header with title and mobile filter button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-secondary tracking-tight">
            All Master Orders
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Manage and track all customer orders
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div
        className={`${showMobileFilters ? "block" : "hidden lg:block"} mb-6`}
      >
        <OrderFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          deliveryStatusFilter={deliveryStatusFilter}
          paymentStatusFilter={paymentStatusFilter}
          onPaymentStatusChange={(val) => {
            setPaymentStatusFilter(val);
            setCurrentPage(1);
          }}
          fulfillmentTypeFilter={fulfillmentTypeFilter}
          onFulfillmentTypeChange={(val) => {
            setFulfillmentTypeFilter(val);
            setCurrentPage(1);
          }}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onClear={clearFilters}
          showMobile={showMobileFilters}
          onToggleMobile={() => setShowMobileFilters(false)}
        />
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm -mx-3 sm:mx-0 px-3 sm:px-0">
        <table className="min-w-[800px] lg:min-w-full table-fixed">
          <thead className="sticky top-0 bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm z-10 shadow-sm">
            <tr>
              <th className="w-[80px] px-1.5 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Order ID
                </span>
              </th>
              <th className="w-[140px] px-1.5 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Customer
                </span>
              </th>
              <th className="w-[110px] px-1.5 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Total
                </span>
              </th>
              <th className="w-[120px] px-1.5 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Fulfillment
                </span>
              </th>
              <th className="w-[130px] px-1.5 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Payment Status
                </span>
              </th>
              <th className="w-[90px] px-1.5 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Companies
                </span>
              </th>
              <th className="w-[150px] px-1.5 sm:px-4 py-2 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <svg
                    className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-secondary/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Date & Time</span>
                </div>
              </th>
              <th className="w-[90px] px-1.5 sm:px-4 py-2 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            ) : error ? (
              <ErrorState
                error={error}
                onRetry={() => fetchOrders(currentPage, statusFilter)}
              />
            ) : filteredOrders.length === 0 ? (
              <EmptyState />
            ) : (
              paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-semibold text-indigo-600 truncate">
                    #{order.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate">
                    {order.recipient_name || (
                      <span className="text-gray-400 italic">Pickup</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 truncate">
                    {Number(order.total_amount).toLocaleString()}{" "}
                    <span className="text-xs text-gray-500">ETB</span>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                      {order.fulfillment_type === "delivery" ? (
                        <Truck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="capitalize truncate">
                        {order.fulfillment_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={order.payment_status} />
                  </td>
                  {/* <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3"><DeliveryStatusBadge status={getOrderDeliveryStatus(order)} /></td> */}
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 truncate">
                    {order.vendor_orders?.length ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <OrderDate dateString={order.created_at} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs sm:text-sm font-medium transition-all duration-200"
                    >
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="inline">View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            pageSize={pageSize}
            enableUrlSync={true}
            className="rounded-xl border border-gray-100"
          />
        </div>
      )}

      {/* Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Mobile Filter Button - Bottom Left (only visible on mobile) */}
      <button
        onClick={() => setShowMobileFilterModal(true)}
        className="fixed bottom-5 left-5 z-40 lg:hidden flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white border-2 border-[#674FA3] shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
      >
        <div className="relative">
          <svg
            className="w-5 h-5 text-[#674FA3]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {(searchTerm ||
            statusFilter ||
            deliveryStatusFilter ||
            paymentStatusFilter ||
            fulfillmentTypeFilter) && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </div>
        <span className="text-sm font-bold tracking-wide text-[#674FA3]">
          Filter
        </span>
        {(searchTerm ||
          statusFilter ||
          deliveryStatusFilter ||
          paymentStatusFilter ||
          fulfillmentTypeFilter) && (
          <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-[#674FA3]/10 text-[#674FA3] rounded-full">
            Active
          </span>
        )}
      </button>

      {/* Mobile Filter Modal - Bottom Sheet */}
      {showMobileFilterModal && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setShowMobileFilterModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Bottom Sheet Content */}
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
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by order ID, customer name, phone, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-[#674FA3] focus:shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Payment Status
                </label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-[#674FA3] focus:shadow-sm transition-all"
                >
                  <option value="">All Payment Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Verifying Receipt">Verifying Receipt</option>
                  <option value="Pay on Delivery">Pay on Delivery</option>
                  <option value="Checkout Initiated">Checkout Initiated</option>
                  <option value="Awaiting Bank Transfer">
                    Awaiting Bank Transfer
                  </option>
                </select>
              </div>

              {/* Fulfillment Type Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Fulfillment Type
                </label>
                <select
                  value={fulfillmentTypeFilter}
                  onChange={(e) => setFulfillmentTypeFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-[#674FA3] focus:shadow-sm transition-all"
                >
                  <option value="">All Fulfillment Types</option>
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>

              {/* Page Size */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Items per page
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-[#674FA3] focus:shadow-sm transition-all"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={15}>15 / page</option>
                  <option value={30}>30 / page</option>
                  <option value={60}>60 / page</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {(searchTerm ||
                  statusFilter ||
                  deliveryStatusFilter ||
                  paymentStatusFilter ||
                  fulfillmentTypeFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                      setDeliveryStatusFilter("");
                      setPaymentStatusFilter("");
                      setFulfillmentTypeFilter("");
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
