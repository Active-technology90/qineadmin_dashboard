import { useState, useEffect, useMemo } from "react";
import { Eye, Truck, Package } from "lucide-react";
import { getAdminMasterOrders } from "../../../services/api";
import type { MasterOrder } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { TableControls } from "../../ui/TableControls";
import { OrderDetailModal } from "./OrderDetailModal";
import { Pagination } from "../../ui/Pagination";

const DEFAULT_PAGE_SIZE = 10;
const DEBOUNCE_DELAY = 500;

export default function Orders() {
  const [orders, setOrders] = useState<MasterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(null);
  const { toast, showToast } = useToast();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

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
        page_size: pageSize,
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
  }, [currentPage, debouncedSearch, statusFilter, pageSize]);

  const totalPages = useMemo(
    () => Math.ceil(totalCount / pageSize),
    [totalCount, pageSize],
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages]);

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
        <td key={i} className="px-2 py-2">
          <div className="h-4 bg-gray-200 rounded w-20" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <Toast toast={toast} />
      <TableControls pageSize={pageSize} onPageSizeChange={setPageSize}>
        {/* LEFT SIDE: SEARCH + STATUS + CLEAR */}
        <div className="flex flex-1 gap-2 w-full items-center">
          {/* SEARCH */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search orders..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </TableControls>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                Order ID
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                Customer
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                Total
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                Status
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                Fulfillment
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                Date
              </th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
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
                  <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-600">
                    {order.recipient_name || (
                      <span className="text-gray-400 italic">Pickup</span>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {Number(order.total_amount).toLocaleString()} ETB
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-0.5">
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
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs font-medium transition"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Detail</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}