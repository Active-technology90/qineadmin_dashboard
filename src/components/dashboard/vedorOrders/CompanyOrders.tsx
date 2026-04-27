import { useState, useEffect, useCallback, useRef } from "react";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
  Building2,
} from "lucide-react";
import { getAdminVendorOrders, getCompanies } from "../../../services/api";
import type { VendorOrder, CompanyListItem } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { VendorOrderFilters } from "./VendorOrderFilters";
import { VendorOrderDetailModal } from "./VendorOrderDetailModal";
import { Pagination } from "../../ui/Pagination";
import { TableControls } from "../../ui/TableControls";

const ITEMS_PER_PAGE = 10;

export default function CompanyOrders() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const { toast, showToast } = useToast();

  const fetchingRef = useRef(false);

  // Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await getCompanies();
        setCompanies(res.data.results);
      } catch (err) {
        console.error("Failed to load companies", err);
      }
    };
    fetchCompanies();
  }, []);

  const fetchOrders = useCallback(
    async (page: number, search: string, status: string, companyId: string) => {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Please log in to view vendor orders");
        setLoading(false);
        return;
      }
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        setLoading(true);
        setError(null);
        const res = await getAdminVendorOrders({
          page,
         page_size: pageSize,
          search: search || undefined,
          status: status || undefined,
          company: companyId || undefined,
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
              "Failed to load vendor orders";
        setError(message);
        showToast("error", message);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      setError("Please log in to view vendor orders");
      setLoading(false);
      return;
    }
    fetchOrders(currentPage, searchTerm, statusFilter, selectedCompanyId);
 }, [currentPage, searchTerm, statusFilter, selectedCompanyId, pageSize, fetchOrders]);

 const totalPages = Math.ceil(totalCount / pageSize);
  const goToPage = (page: number) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSelectedCompanyId("");
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

  const getDeliveryStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
<TableControls
  pageSize={pageSize}
  onPageSizeChange={(size) => {
    setPageSize(size);
    setCurrentPage(1);
  }}
>
  {/* LEFT SIDE: FILTERS WRAPPED IN FLEX ROW */}
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">

    <VendorOrderFilters
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      statusFilter={statusFilter}
      onStatusChange={setStatusFilter}
      selectedCompanyId={selectedCompanyId}
      onCompanyChange={setSelectedCompanyId}
      companies={companies}
      onClear={clearFilters}
      showMobile={showFilters}
      onToggleMobile={() => setShowFilters(!showFilters)}
    />

  </div>
</TableControls>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Order ID
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Company
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Amount
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                Delivery
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
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
                      fetchOrders(
                        currentPage,
                        searchTerm,
                        statusFilter,
                        selectedCompanyId,
                      )
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
                  No vendor orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {/* Company Logo with fallback */}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {order.company?.logo ? (
                          <img
                            src={order.company.logo}
                            alt={`${order.company.name} logo`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <span className="text-sm text-gray-700">
                        {order.company?.name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {Number(order.amount).toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getDeliveryStatusColor(order.delivery?.status || "pending")}`}
                    >
                      {order.delivery?.status || "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(order.created_at)}
                  </td>
<td className="px-4 py-2 whitespace-nowrap text-right">
  <button
    onClick={() => setSelectedOrder(order)}
    className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-xs font-medium transition-colors"
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
<div className="flex justify-end mt-4">
  {!loading && totalPages > 1 && (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalCount}
      itemsPerPage={ITEMS_PER_PAGE}
      onPageChange={goToPage}
    />
  )}
</div>
      <VendorOrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}