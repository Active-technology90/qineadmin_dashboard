// src/components/dashboard/orders/Orders.tsx
import { useState, useEffect, useMemo } from "react";
import { Eye, Truck, Package } from "lucide-react";
import { getAdminMasterOrders } from "../../../services/api";
import type { MasterOrder } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { OrderDetailModal } from "./OrderDetailModal";
import { OrderFilters } from "./OrderFilters";
import { TableControls } from "../../ui/TableControls";

const DEFAULT_PAGE_SIZE = 10;

export default function Orders() {
  const [orders, setOrders] = useState<MasterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(""); // NEW
  const [fulfillmentTypeFilter, setFulfillmentTypeFilter] = useState(""); // NEW
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { toast, showToast } = useToast();

  // Reset page when pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Fetch orders – only order status is sent to the API (other filters are client-side)
  const fetchOrders = async (page: number, status: string) => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("Please log in to view orders");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminMasterOrders({
        page,
        page_size: pageSize,
        status: status || undefined,
        ordering: "-created_at",
      });
      setOrders(res.data.results);
      setTotalCount(res.data.count);
    } catch (err: any) {
      const message =
        err.message === "SESSION_EXPIRED"
          ? "Your session has expired. Please log in again."
          : err.response?.data?.detail ||
            err.message ||
            "Failed to load orders";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("access")) {
      fetchOrders(currentPage, statusFilter);
    }
  }, [currentPage, statusFilter, pageSize]);

  // --- Combined client‑side filters (search + order status + delivery status + payment status) ---
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filter by search term (order ID, customer name, phone, shipping address)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((order) => {
        const idMatch = String(order.id).includes(lowerSearch);
        const nameMatch = order.recipient_name
          ?.toLowerCase()
          .includes(lowerSearch);
        const phoneMatch = order.shipping_phone
          ?.toLowerCase()
          .includes(lowerSearch);
        const addressMatch = order.shipping_address_text
          ?.toLowerCase()
          .includes(lowerSearch);
        return idMatch || nameMatch || phoneMatch || addressMatch;
      });
    }

    // Filter by order status (if any)
    if (statusFilter) {
      result = result.filter((order) => order.status === statusFilter);
    }

    // Filter by delivery status (if any)
    if (deliveryStatusFilter) {
      result = result.filter((order) =>
        order.vendor_orders?.some(
          (vo) => vo.delivery_status === deliveryStatusFilter,
        ),
      );
    }

    // NEW: Filter by payment status (if any)
    if (paymentStatusFilter) {
      result = result.filter(
        (order) => order.payment_status === paymentStatusFilter,
      );
    }
    // filter by fullfiment type (if any)

    if (fulfillmentTypeFilter) {
      result = result.filter(
        (order) => order.fulfillment_type === fulfillmentTypeFilter,
      );
    }

    return result;
  }, [
    orders,
    searchTerm,
    statusFilter,
    deliveryStatusFilter,
    paymentStatusFilter,
    fulfillmentTypeFilter,
  ]);

  // Calculate paginated orders (client-side pagination after filtering)
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = useMemo(
    () => Math.ceil(filteredOrders.length / pageSize),
    [filteredOrders.length, pageSize],
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages]);

  // Clear all filters (search, status, delivery status, payment status) and reset page
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDeliveryStatusFilter("");
    setPaymentStatusFilter(""); // NEW
    setFulfillmentTypeFilter("");
    setCurrentPage(1);
  };

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "delivered")
      return "bg-emerald-100 text-emerald-800";
    if (s === "paid") return "bg-blue-100 text-blue-800";
    if (s === "pending") return "bg-amber-100 text-amber-800";
    if (s === "cancelled") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (ps: string) => {
    const p = ps?.toLowerCase();
    if (p === "paid") return "bg-emerald-100 text-emerald-800";
    if (p === "verifying receipt") return "bg-orange-100 text-orange-800";
    if (p === "checkout initiated") return "bg-gray-100 text-gray-800";
    if (p === "cancelled") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-600";
  };
  const getDeliveryStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s === "delivered") return "bg-emerald-100 text-emerald-800";
  if (s === "shipped" || s === "out_for_delivery") return "bg-blue-100 text-blue-800";
  if (s === "pending") return "bg-amber-100 text-amber-800";
  if (s === "mixed") return "bg-gray-300 text-gray-700";
  return "bg-gray-100 text-gray-600";
};
  function getOrderDeliveryStatus(order: MasterOrder): string {
    const statuses =
      order.vendor_orders?.map((vo) => vo.delivery_status).filter(Boolean) ||
      [];
    if (statuses.length === 0) return "N/A";
    const unique = [...new Set(statuses)];
    if (unique.length === 1) return unique[0];
    return "mixed"; // or "partially delivered"
  }

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded w-20" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <Toast toast={toast} />

      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Orders</h2>
      </div>

      {/* Filters – using TableControls for page size only */}
      <TableControls pageSize={pageSize} onPageSizeChange={setPageSize}>
        <div className="[&_.mb-6]:hidden">
          <OrderFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            deliveryStatusFilter={deliveryStatusFilter}
            onDeliveryStatusChange={(val) => {
              setDeliveryStatusFilter(val);
              setCurrentPage(1);
            }}
            paymentStatusFilter={paymentStatusFilter} // NEW
            onPaymentStatusChange={(val) => {
              // NEW
              setPaymentStatusFilter(val);
              setCurrentPage(1);
            }}
            fulfillmentTypeFilter={fulfillmentTypeFilter}
            onFulfillmentTypeChange={(val) => {
              setFulfillmentTypeFilter(val);
              setCurrentPage(1);
            }}
            onClear={handleClearFilters}
            showMobile={showMobileFilters}
            onToggleMobile={() => setShowMobileFilters((prev) => !prev)}
          />
        </div>
      </TableControls>

      {/* Table */}
      <div
        key={pageSize}
        className="overflow-x-auto rounded-xl border border-gray-200"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Fulfillment
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Delivery
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Companies
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Created at
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              [...Array(pageSize)].map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <tr>
                <td colSpan={10} className="text-center py-16">
                  <div className="text-red-600 mb-4">{error}</div>
                  <button
                    onClick={() => fetchOrders(currentPage, statusFilter)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No orders found</p>
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">
                    #{order.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {order.recipient_name || (
                      <span className="text-gray-400 italic">Pickup</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {Number(order.total_amount).toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}
                    >
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {order.fulfillment_type === "delivery" ? (
                        <Truck size={14} />
                      ) : (
                        <Package size={14} />
                      )}
                      <span className="capitalize">
                        {order.fulfillment_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getDeliveryStatusColor(getOrderDeliveryStatus(order))}`}
                    >
                      {getOrderDeliveryStatus(order)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">
                    {order.vendor_orders?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition text-xs font-semibold"
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

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
