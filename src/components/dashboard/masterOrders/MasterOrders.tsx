import { useState, useEffect, useMemo } from "react";
import { Eye, ChevronLeft, ChevronRight, Truck, Package } from "lucide-react";
import { getAdminMasterOrders } from "../../../services/api";
import type { MasterOrder } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { OrderFilters } from "./OrderFilters";
import { OrderDetailModal } from "./OrderDetailModal";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;

export default function Orders() {
  const [orders, setOrders] = useState<MasterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast, showToast } = useToast();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch orders
  const fetchOrders = async (page: number, search: string, status: string) => {
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
        page_size: ITEMS_PER_PAGE,
        search: search || undefined,
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
      fetchOrders(currentPage, debouncedSearch, statusFilter);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  const totalPages = useMemo(
    () => Math.ceil(totalCount / ITEMS_PER_PAGE),
    [totalCount],
  );
  const goToPage = (page: number) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
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
    if (s === "completed") return "bg-green-100 text-green-800";
    if (s === "paid") return "bg-blue-100 text-blue-800";
    if (s === "pending") return "bg-yellow-100 text-yellow-800";
    if (s === "cancelled") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-200 rounded w-20" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <Toast toast={toast} />
      <OrderFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onClear={clearFilters}
        showMobile={showFilters}
        onToggleMobile={() => setShowFilters(!showFilters)}
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                Fulfillment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="text-red-600 mb-4">{error}</div>
                  <button
                    onClick={() =>
                      fetchOrders(currentPage, debouncedSearch, statusFilter)
                    }
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.recipient_name || (
                      <span className="text-gray-400 italic">Pickup</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {Number(order.total_amount).toLocaleString()} ETB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t mt-4">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}{" "}
            orders
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md border disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
