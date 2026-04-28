// src/components/dashboard/vedorOrders/CompanyOrders.tsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
  Building2,
  User as UserIcon,
} from "lucide-react";
import {
  getAdminVendorOrders,
  getCompanyVendorOrders,
  getCompanies,
  // getDeliveries,            // no longer needed
  // getCompanyStaffByRole,    // no longer needed
} from "../../../services/api";
import type { VendorOrder, CompanyListItem /*, Delivery */ } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { useAuth } from "../../../hooks/useAuth";
import { Toast } from "../../ui/Toast";
import { VendorOrderFilters } from "./VendorOrderFilters";
import { VendorOrderDetailModal } from "./VendorOrderDetailModal";
import { DeliveryManager } from "./DeliveryManager";

const ITEMS_PER_PAGE = 10;

// ---------- reusable subcomponents ----------
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    paid: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
    cancelled: "bg-red-100 text-red-700",
    delivered: "bg-emerald-100 text-emerald-700",
    out_for_delivery: "bg-purple-100 text-purple-700",
    shipped: "bg-indigo-100 text-indigo-700",
    accepted: "bg-cyan-100 text-cyan-700",
    processing: "bg-amber-100 text-amber-700",
  };
  const fallback = "bg-gray-100 text-gray-600";
  const color = colors[status.toLowerCase()] || fallback;
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
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
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
        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-lg text-sm transition ${
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
        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// ---------- main component ----------
export default function CompanyOrders() {
  const { user } = useAuth();
  const isCompanyAdmin = user?.memberships?.length === 1;
  const userCompanySlug = isCompanyAdmin
    ? user.memberships?.[0]?.company_slug
    : null;

  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast, showToast } = useToast();

  const fetchingRef = useRef(false);

  // Fetch companies for super admin (no page_size needed)
  useEffect(() => {
    if (!isCompanyAdmin) {
      const fetchCompanies = async () => {
        try {
          const res = await getCompanies();
          setCompanies(res.data.results);
        } catch (err) {
          console.error("Failed to load companies", err);
        }
      };
      fetchCompanies();
    }
  }, [isCompanyAdmin]);

  const fetchOrders = useCallback(
    async (page: number, search: string, status: string, companyId: string) => {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Please log in to view orders");
        setLoading(false);
        return;
      }
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        setLoading(true);
        setError(null);

        let res;
        if (isCompanyAdmin && userCompanySlug) {
          res = await getCompanyVendorOrders(userCompanySlug, {
            page,
            page_size: ITEMS_PER_PAGE,
            search: search || undefined,
            status: status || undefined,
            ordering: "-created_at",
          });
        } else {
          res = await getAdminVendorOrders({
            page,
            page_size: ITEMS_PER_PAGE,
            search: search || undefined,
            status: status || undefined,
            company: companyId || undefined,
            ordering: "-created_at",
          });
        }

        setOrders(res.data.results);
        // totalCount is not used, so we don't need to store it
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
        fetchingRef.current = false;
      }
    },
    [showToast, isCompanyAdmin, userCompanySlug],
  );

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      setError("Please log in to view orders");
      setLoading(false);
      return;
    }
    fetchOrders(currentPage, searchTerm, statusFilter, selectedCompanyId);
  }, [currentPage, searchTerm, statusFilter, selectedCompanyId, fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (!deliveryStatusFilter) return orders;
    return orders.filter(
      (order) =>
        order.delivery_status?.toLowerCase() ===
        deliveryStatusFilter.toLowerCase(),
    );
  }, [orders, deliveryStatusFilter]);

  const filteredCount = filteredOrders.length;
  const totalPages = Math.ceil(filteredCount / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const goToPage = (page: number) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDeliveryStatusFilter("");
    setSelectedCompanyId("");
    setCurrentPage(1);
  };

  // Unused; commented out to avoid TS error
  // const formatDateTime = (dateString: string) =>
  //   new Date(dateString).toLocaleString("en-US", {
  //     year: "numeric",
  //     month: "short",
  //     day: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <Toast toast={toast} />
      <VendorOrderFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        deliveryStatusFilter={deliveryStatusFilter}
        onDeliveryStatusChange={setDeliveryStatusFilter}
        selectedCompanyId={selectedCompanyId}
        onCompanyChange={setSelectedCompanyId}
        companies={companies}
        onClear={clearFilters}
        showMobile={showFilters}
        onToggleMobile={() => setShowFilters(!showFilters)}
        hideCompanyFilter={isCompanyAdmin}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {[
                "Order ID",
                "Company",
                "Amount",
                "Status",
                "Delivery",
                "Delivery Person",
                "Actions",
              ].map((head) => (
                <th
                  key={head}
                  className={`px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                    head === "Actions" ? "text-right" : ""
                  }`}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <ErrorState
                error={error}
                onRetry={() =>
                  fetchOrders(
                    currentPage,
                    searchTerm,
                    statusFilter,
                    selectedCompanyId,
                  )
                }
              />
            ) : paginatedOrders.length === 0 ? (
              <EmptyState />
            ) : (
              paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <CompanyAvatar
                        logo={order.company?.logo}
                        name={order.company?.name || "Unknown"}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {order.company?.name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {Number(order.amount).toLocaleString()}{" "}
                    <span className="text-xs text-gray-500">ETB</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={order.delivery?.status || "not assigned"}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.delivery?.delivery_person_name ? (
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {order.delivery.delivery_person_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <DeliveryManager
                        orderId={order.id}
                        currentDelivery={
                          order.delivery || null
                        }
                        companySlug={order.company?.slug || ""}
                        onUpdate={() =>
                          fetchOrders(
                            currentPage,
                            searchTerm,
                            statusFilter,
                            selectedCompanyId,
                          )
                        }
                      />
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredCount)} of{" "}
            {filteredCount} orders
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      <VendorOrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}