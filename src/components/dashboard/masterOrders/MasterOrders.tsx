import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Eye, Package, Truck, Filter } from "lucide-react";
import { getAdminMasterOrders } from "../../../services/api";
import type { MasterOrder } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { OrderDetailModal } from "./OrderDetailModal";
import { OrderFilters } from "./OrderFilters";
import { TableControls } from "../../ui/TableControls";

const DEFAULT_PAGE_SIZE = 10;

// ---------- Premium UI Subcomponents ----------
const StatusBadge = ({ status }: { status: string }) => {
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    approved: "Approved",
    rejected: "Rejected",
  };

  const colors: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    paid: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    processing: "bg-orange-50 text-orange-700 border-orange-200",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const normalized = status?.toLowerCase?.() || "";
  const display = statusLabels[normalized] || normalized.replace(/_/g, " ");
  const color = colors[normalized] || "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {display}
    </span>
  );
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "verifying receipt": "bg-orange-50 text-orange-700 border-orange-200",
    "checkout initiated": "bg-gray-50 text-gray-600 border-gray-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  const normalized = status?.toLowerCase?.() || "";
  const color = colors[normalized] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status || "Unknown"}
    </span>
  );
};

const DeliveryStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    shipped: "bg-blue-50 text-blue-700 border-blue-200",
    out_for_delivery: "bg-violet-50 text-violet-700 border-violet-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    multiple: "bg-gray-300 text-gray-700 border-gray-300",
  };
  const normalized = status?.toLowerCase?.() || "n/a";
  const display = normalized === "multiple" ? "Multiple" : normalized.replace(/_/g, " ");
  const color = colors[normalized] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {display}
    </span>
  );
};

const OrderDate = ({ dateString }: { dateString?: string }) => {
  if (!dateString) return <span className="text-gray-400 text-xs">—</span>;
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

  const formatTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-gray-900">
        {isToday ? 'Today' : isYesterday ? 'Yesterday' : formatDate}
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

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <tr>
    <td colSpan={10} className="text-center py-10">
      <div className="text-red-600 mb-4">{error}</div>
      <button onClick={onRetry} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
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
  const { toast, showToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper: get aggregated delivery status for a master order
  const getOrderDeliveryStatus = (order: MasterOrder): string => {
    const statuses = order.vendor_orders?.map(vo => vo.delivery_status).filter(s => !!s) || [];
    if (statuses.length === 0) return "N/A";
    const unique = [...new Set(statuses)];
    if (unique.length === 1) return unique[0];
    return "multiple";
  };

  // Fetch orders with abort support
  const fetchOrders = useCallback(async (page: number, status: string) => {
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
      }, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setOrders(res.data.results);
      }
    } catch (err: any) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      const message = err.message === "SESSION_EXPIRED"
        ? "Your session has expired. Please log in again."
        : err.response?.data?.detail || err.message || "Failed to load orders";
      if (!controller.signal.aborted) {
        setError(message);
        showToast("error", message);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [pageSize, showToast]);

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
      result = result.filter(o =>
        String(o.id).includes(lower) ||
        o.recipient_name?.toLowerCase().includes(lower) ||
        o.shipping_phone?.toLowerCase().includes(lower) ||
        o.shipping_address_text?.toLowerCase().includes(lower)
      );
    }
    if (statusFilter) result = result.filter(o => o.status === statusFilter);
    if (deliveryStatusFilter) {
      result = result.filter(o => getOrderDeliveryStatus(o) === deliveryStatusFilter);
    }
    if (paymentStatusFilter) result = result.filter(o => o.payment_status === paymentStatusFilter);
    if (fulfillmentTypeFilter) result = result.filter(o => o.fulfillment_type === fulfillmentTypeFilter);
    return result;
  }, [orders, searchTerm, statusFilter, deliveryStatusFilter, paymentStatusFilter, fulfillmentTypeFilter]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const goToPage = (page: number) => setCurrentPage(Math.min(Math.max(1, page), totalPages));

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <Toast toast={toast} />

      {/* Header with title and mobile filter button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
             <h2 className="text-2xl font-extrabold text-secondary tracking-tight"> All master Orders</h2>
          <p className="text-sm text-secondary mt-0.5">Manage and track all customer orders</p>
        </div>
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          Filters
          {(searchTerm || statusFilter || deliveryStatusFilter || paymentStatusFilter || fulfillmentTypeFilter) && (
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          )}
        </button>
      </div>

      {/* Filters row: left side filters, right side TableControls */}
     {/* Filters row – TableControls is now inside OrderFilters */}
<div className={`${showMobileFilters ? 'block' : 'hidden lg:block'} mb-6`}>
  <OrderFilters
    searchTerm={searchTerm}
    onSearchChange={setSearchTerm}
    statusFilter={statusFilter}
    onStatusChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
    deliveryStatusFilter={deliveryStatusFilter}
    onDeliveryStatusChange={(val) => { setDeliveryStatusFilter(val); setCurrentPage(1); }}
    paymentStatusFilter={paymentStatusFilter}
    onPaymentStatusChange={(val) => { setPaymentStatusFilter(val); setCurrentPage(1); }}
    fulfillmentTypeFilter={fulfillmentTypeFilter}
    onFulfillmentTypeChange={(val) => { setFulfillmentTypeFilter(val); setCurrentPage(1); }}
    pageSize={pageSize}
    onPageSizeChange={setPageSize}
    onClear={clearFilters}
    showMobile={showMobileFilters}
    onToggleMobile={() => setShowMobileFilters(false)}
  />
</div>

      {/* Orders Table – Fixed width, no horizontal scroll */}
      <div className="overflow-x-auto lg:overflow-x-hidden rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full table-fixed">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="w-[80px] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="w-[110px] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="w-[110px] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="w-[130px] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
              <th className="w-[120px] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fulfillment</th>
              <th className="w-[120px] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery</th>
              <th className="w-[90px] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Companies</th>
              <th className="w-[150px] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Date & Time</span>
                </div>
              </th>
              <th className="w-[90px] px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <ErrorState error={error} onRetry={() => fetchOrders(currentPage, statusFilter)} />
            ) : filteredOrders.length === 0 ? (
              <EmptyState />
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-indigo-600 truncate">#{order.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate">
                    {order.recipient_name || <span className="text-gray-400 italic">Pickup</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 truncate">
                    {Number(order.total_amount).toLocaleString()} <span className="text-xs text-gray-500">ETB</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3"><PaymentStatusBadge status={order.payment_status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      {order.fulfillment_type === "delivery" ? (
                        <Truck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <Package className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="capitalize truncate">{order.fulfillment_type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><DeliveryStatusBadge status={getOrderDeliveryStatus(order)} /></td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 truncate">{order.vendor_orders?.length ?? 0}</td>
                  <td className="px-4 py-3"><OrderDate dateString={order.created_at} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-sm font-medium transition-all duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          {/* <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
          </div> */}
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
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}