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
  getCompanyReceipts,
} from "../../../services/api";
import type { VendorOrder, CompanyListItem } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { useAuth } from "../../../hooks/useAuth";
import { Toast } from "../../ui/Toast";
import { VendorOrderFilters } from "./VendorOrderFilters";
import { VendorOrderDetailModal } from "./VendorOrderDetailModal";
import { DeliveryManager } from "./DeliveryManager";
import { TableControls } from "../../ui/TableControls";
import { Pagination } from "../../ui/Pagination";

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

// ---------- Payment Receipt Type ----------
interface PaymentReceipt {
  id: number;
  master_order: number;
  customer_name: string;
  order_total: number;
  bank_info: string | null;
  bank_name: string;
  receipt_image: string;
  amount: string;
  status: string;
  admin_notes: string;
  uploaded_at: string;
}

// ---------- main component ----------
export default function CompanyOrders() {
  const DEFAULT_PAGE_SIZE = 10;
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { user } = useAuth();
  const isCompanyAdmin = user?.memberships?.length === 1;
  const userCompanySlug = isCompanyAdmin
    ? user.memberships?.[0]?.company_slug
    : null;

  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast, showToast } = useToast();

  // Refs for abort and debounce
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch companies for super admin
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

  // Core fetch function with abort support
  const fetchOrders = useCallback(
    async (
      page: number,
      search: string,
      status: string,
      companyId: string,
      _deliveryStatus?: string,
    ) => {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Please log in to view orders");
        setLoading(false);
        return;
      }

      // Cancel previous in‑flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        let res;
        const params = {
          page,
          page_size: pageSize,
          search: search || undefined,
          status: status || undefined,
          ordering: "-created_at" as const,
        };

        if (isCompanyAdmin && userCompanySlug) {
          res = await getCompanyVendorOrders(userCompanySlug, {
            ...params,
            signal: controller.signal,
          });
        } else {
          res = await getAdminVendorOrders({
            ...params,
            company: companyId || undefined,
            signal: controller.signal,
          });
        }

        // If request was cancelled, ignore result
        if (controller.signal.aborted) return;

        setOrders(res.data.results);
        setTotalCount(res.data.count);
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        const message =
          err.message === "SESSION_EXPIRED"
            ? "Your session has expired. Please log in again."
            : err.response?.data?.detail ||
              err.message ||
              "Failed to load orders";
        setError(message);
        showToast("error", message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [showToast, isCompanyAdmin, userCompanySlug, pageSize],
  );

  // Debounced search trigger
  const debouncedFetch = useCallback(
    (page: number, search: string, status: string, companyId: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchOrders(page, search, status, companyId);
      }, 300);
    },
    [fetchOrders],
  );

  // When filter/page changes, fetch (with debounce for search)
  useEffect(() => {
    if (!localStorage.getItem("access")) {
      setError("Please log in to view orders");
      setLoading(false);
      return;
    }
    debouncedFetch(currentPage, searchTerm, statusFilter, selectedCompanyId);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    selectedCompanyId,
    pageSize,
    debouncedFetch,
  ]);

  // Fetch payment receipt when selected order changes
  useEffect(() => {
    if (!selectedOrder) {
      setReceipt(null);
      return;
    }
    const companySlug = selectedOrder.company?.slug;
    if (!companySlug) return;

    const fetchReceipt = async () => {
      setReceiptLoading(true);
      try {
        const res = await getCompanyReceipts(companySlug);
        const firstReceipt: PaymentReceipt | undefined = res.data.results?.[0];
        setReceipt(firstReceipt || null);
      } catch (err) {
        console.error("Failed to load payment receipt", err);
        setReceipt(null);
      } finally {
        setReceiptLoading(false);
      }
    };
    fetchReceipt();
  }, [selectedOrder]);

  // Client‑side delivery status filter (if API doesn't support it)
  const filteredOrders = useMemo(() => {
    if (!deliveryStatusFilter) return orders;
    return orders.filter(
      (order) =>
        order.delivery_status?.toLowerCase() ===
        deliveryStatusFilter.toLowerCase(),
    );
  }, [orders, deliveryStatusFilter]);

  // ✅ NEW: enforce page size on frontend
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(0, pageSize);
  }, [filteredOrders, pageSize]);

  // Pagination calculation using server totalCount
  const totalPages = Math.ceil(totalCount / pageSize);
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const showingTo = Math.min(currentPage * pageSize, totalCount);
  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDeliveryStatusFilter("");
    setSelectedCompanyId("");
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <Toast toast={toast} />
      <div className="mb-3">
        <h2 className="text-2xl font-bold text-[#6750A4]">Vendor Orders</h2>
      </div>
      <div className="w-full flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-3 mb-4">
        {/* LEFT SIDE: Filters */}
        <div className="flex-shrink-0 flex items-start h-full">
          <VendorOrderFilters
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            statusFilter={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            deliveryStatusFilter={deliveryStatusFilter}
            onDeliveryStatusChange={(value) => {
              setDeliveryStatusFilter(value);
              setCurrentPage(1);
            }}
            selectedCompanyId={selectedCompanyId}
            onCompanyChange={(value) => {
              setSelectedCompanyId(value);
              setCurrentPage(1);
            }}
            companies={companies}
            onClear={clearFilters}
            showMobile={showFilters}
            onToggleMobile={() => setShowFilters(!showFilters)}
            hideCompanyFilter={isCompanyAdmin}
          />
        </div>

        {/* RIGHT SIDE: Table Controls */}
        <div className="flex-shrink-0 self-start">
          <TableControls
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);

              fetchOrders(1, searchTerm, statusFilter, selectedCompanyId);
            }}
          />
        </div>
      </div>

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
                    <div className="flex items-center gap-2 min-w-0">
                      <CompanyAvatar
                        logo={order.company?.logo}
                        name={order.company?.name || "Unknown"}
                      />
                      <span className="text-sm font-medium text-gray-700 break-words whitespace-normal">
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
                    <div className="flex flex-col gap-2">
                      {/* Delivery Person Info */}
                      {order.delivery?.delivery_person_name ? (
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">
                            {order.delivery.delivery_person_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Not assigned
                        </span>
                      )}

                      {/* Action Button */}
                      <div>
                        <button className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-[#6750A4] text-[#6750A4] hover:bg-[#6750A4]/10 transition">
                          <DeliveryManager
                            orderId={order.id}
                            currentDelivery={order.delivery || null}
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
                          {order.delivery?.delivery_person_name
                            ? "Change"
                            : "Assign"}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="View details"
                      >
                        <div className="flex items-center gap-1 text-xs font-medium">
                          <Eye className="h-4 w-4" />
                          View details
                        </div>
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
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      <VendorOrderDetailModal
        order={selectedOrder}
        receipt={receiptLoading ? null : receipt}
        onClose={() => {
          setSelectedOrder(null);
          setReceipt(null);
        }}
        onUpdate={() =>
          fetchOrders(currentPage, searchTerm, statusFilter, selectedCompanyId)
        }
      />
    </div>
  );
}
