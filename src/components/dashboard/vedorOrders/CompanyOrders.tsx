// src/components/dashboard/vendorOrders/CompanyOrders.tsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Eye, Package, Building2, User as UserIcon } from "lucide-react";
import {
  getAdminVendorOrders,
  getCompanyVendorOrders,
  getCompanies,
} from "../../../services/api";
import type { VendorOrder, CompanyListItem } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { useAuth } from "../../../hooks/useAuth";
import { Toast } from "../../ui/Toast";
import { VendorOrderFilters } from "./VendorOrderFilters";
import { VendorOrderDetailModal } from "./VendorOrderDetailModal";
import { DeliveryManager } from "./DeliveryManager";

const ITEMS_PER_PAGE = 10;

// ---------- reusable subcomponents (same as before) ----------
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

const CompanyAvatar = ({ logo, name }: { logo?: string | null; name: string }) => (
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

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <tr>
    <td colSpan={8} className="text-center py-12">
      <div className="text-red-600 mb-4">{error}</div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-secodary text-white rounded-lg hover:bg-secondary transition"
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

// ---------- main component ----------
export default function CompanyOrders() {
  const { user } = useAuth();
const isSuperAdmin = !user?.memberships?.length;
  const isCompanyUser = !isSuperAdmin && user?.memberships && user.memberships.length > 0;
  const userCompanySlug = isCompanyUser ? user.memberships?.[0]?.company_slug : null;

  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(""); // NEW
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast, showToast } = useToast();

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch companies for super admin
  useEffect(() => {
    if (!isCompanyUser) {
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
  }, [isCompanyUser]);
console.log(totalCount)
  // Core fetch function (server‑side filters)
  const fetchOrders = useCallback(
    async (page: number, search: string, status: string, companyId: string) => {
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
        let res;
        const params = {
          page,
          page_size: ITEMS_PER_PAGE,
          search: search || undefined,
          status: status || undefined,
          ordering: "-created_at" as const,
        };
        if (isCompanyUser && userCompanySlug) {
          res = await getCompanyVendorOrders(userCompanySlug, {
            ...params,
          
          });
        } else {
          res = await getAdminVendorOrders({
            ...params,
            company: companyId || undefined,
          
          });
        }
        if (controller.signal.aborted) return;
        setOrders(res.data.results);
        setTotalCount(res.data.count);
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        const message =
          err.message === "SESSION_EXPIRED"
            ? "Your session has expired."
            : err.response?.data?.detail ||
              err.message ||
              "Failed to load orders";
        setError(message);
        showToast("error", message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [showToast, isCompanyUser, userCompanySlug]
  );

  const debouncedFetch = useCallback(
    (page: number, search: string, status: string, companyId: string) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(
        () => fetchOrders(page, search, status, companyId),
        300
      );
    },
    [fetchOrders]
  );

  // Trigger server fetch when server‑side filters change
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
  }, [currentPage, searchTerm, statusFilter, selectedCompanyId, debouncedFetch]);

  // Reset page when any client‑side filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deliveryStatusFilter, paymentMethodFilter]);

  // Client‑side filtering (delivery status + payment method)
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (deliveryStatusFilter) {
      result = result.filter(
        (order) =>
          order.delivery?.status?.toLowerCase() === deliveryStatusFilter.toLowerCase()
      );
    }
    if (paymentMethodFilter) {
      result = result.filter(
        (order) => order.payment_method?.toLowerCase() === paymentMethodFilter.toLowerCase()
      );
    }
    return result;
  }, [orders, deliveryStatusFilter, paymentMethodFilter]);

  // Pagination based on client‑side filtered results
  const totalFilteredCount = filteredOrders.length;
  const totalPages = Math.ceil(totalFilteredCount / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const showingFrom = totalFilteredCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showingTo = Math.min(currentPage * ITEMS_PER_PAGE, totalFilteredCount);
  const goToPage = (page: number) => setCurrentPage(Math.min(Math.max(1, page), totalPages));

  const refreshOrdersAndSelected = useCallback(async () => {
    await fetchOrders(currentPage, searchTerm, statusFilter, selectedCompanyId);
    if (selectedOrder) {
      const updatedOrder = orders.find((o) => o.id === selectedOrder.id);
      if (updatedOrder) setSelectedOrder(updatedOrder);
    }
  }, [fetchOrders, currentPage, searchTerm, statusFilter, selectedCompanyId, selectedOrder, orders]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDeliveryStatusFilter("");
    setPaymentMethodFilter("");
    setSelectedCompanyId("");
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <Toast toast={toast} />
      <VendorOrderFilters
        searchTerm={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setCurrentPage(1);
        }}
        deliveryStatusFilter={deliveryStatusFilter}
        onDeliveryStatusChange={(v) => {
          setDeliveryStatusFilter(v);
          // page reset handled by useEffect above
        }}
        paymentMethodFilter={paymentMethodFilter}
        onPaymentMethodChange={(v) => {
          setPaymentMethodFilter(v);
          // page reset handled by useEffect above
        }}
        selectedCompanyId={selectedCompanyId}
        onCompanyChange={(v) => {
          setSelectedCompanyId(v);
          setCurrentPage(1);
        }}
        companies={companies}
        onClear={clearFilters}
        showMobile={showFilters}
        onToggleMobile={() => setShowFilters(!showFilters)}
        hideCompanyFilter={isCompanyUser}
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
                "Payment Method", // NEW column
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
                  fetchOrders(currentPage, searchTerm, statusFilter, selectedCompanyId)
                }
              />
            ) : paginatedOrders.length === 0 ? (
              <EmptyState />
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
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
                    <StatusBadge status={order.delivery?.status || "not assigned"} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {order.delivery?.delivery_person_name ? (
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">
                            {order.delivery.delivery_person_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not assigned</span>
                      )}
                      <div>
                        <button className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-[#6750A4] text-[#6750A4] hover:bg-[#6750A4]/10">
                          <DeliveryManager
                            orderId={order.id}
                            currentDelivery={order.delivery || null}
                            companySlug={order.company?.slug || ""}
                            onUpdate={() =>
                              fetchOrders(
                                currentPage,
                                searchTerm,
                                statusFilter,
                                selectedCompanyId
                              )
                            }
                          />
                          {order.delivery?.delivery_person_name ? "Change" : "Assign"}
                        </button>
                      </div>
                    </div>
                  </td>
                  {/* NEW: Payment Method column */}
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

      <VendorOrderDetailModal
        order={selectedOrder}
        receipt={selectedOrder?.receipt || null}
        onClose={() => setSelectedOrder(null)}
        onUpdate={refreshOrdersAndSelected}
      />
    </div>
  );
}