import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Package, Building2, Settings } from "lucide-react";
import { Pagination } from "../../ui/Pagination";

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
import { VendorOrderDetailModal } from "./VendorOrderDetailModal";
import { VendorOrderFilters } from "./VendorOrderFilters";
import { useReadOnly } from "../AdminDashboard";

const DEFAULT_PAGE_SIZE = 10;

/* ---------- Reusable sub‑components ---------- */
const StatusBadge = ({ status }: { status: string }) => {
  // Backend -> Frontend display mapping
  const statusLabels: Record<string, string> = {
    // Order status
    processing: "Prepared",
    shipped: "In Transit",
    fulfilled: "Delivered",
    contacted: "Confirmed",

    // Delivery status
    pending: "Assigned",
    out_for_delivery: "In Transit",
    delivered: "Completed",
  };

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

  const normalizedStatus = status?.toLowerCase?.() || "";

  const displayLabel =
    statusLabels[normalizedStatus] || normalizedStatus.replace(/_/g, " ");

  const color = colors[normalizedStatus] || "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {displayLabel}
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
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
    ))}
  </tr>
);

const EmptyState = () => (
  <tr>
    <td colSpan={6} className="text-center py-16">
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
    <td colSpan={6} className="text-center py-12">
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

/* ---------- Main Component ---------- */
export default function CompanyOrders() {
  const { user } = useAuth();
  const { company } = useCurrentCompany();
  const { companies } = useCompaniesList();
  const readOnly = useReadOnly();

  const isSuperAdmin = !user?.memberships?.length;
  const isAdminLike = isSuperAdmin || readOnly;

  const shouldFetchAll = isAdminLike;

  const companySlug = company?.slug ?? null;
  const effectiveSlug = useMemo(() => {
    if (!isAdminLike && user?.memberships?.length) {
      return companySlug || user.memberships[0]?.company_slug || null;
    }
    return null;
  }, [isAdminLike, companySlug, user]);

  const companyName = company?.name ?? "";

  const companyLogo = useMemo(() => {
    if (!effectiveSlug || !companies.length) return null;
    const foundCompany = companies.find((c: any) => c.slug === effectiveSlug);
    return foundCompany?.logo || null;
  }, [effectiveSlug, companies]);

  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [allOrders, setAllOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast, showToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

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
  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const clearFilters = () => {
    setSearchTerm("");
    setOrderStatusFilter("");
    setDeliveryStatusFilter("");
    setPaymentMethodFilter("");
    setSelectedCompanyId("");
    setCurrentPage(1);
  };

  const goToPage = (page: number) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));

  const handleModalUpdate = useCallback(async () => {
    const freshOrders = await fetchAllOrders();
    if (selectedOrder) {
      const updated = freshOrders.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [fetchAllOrders, selectedOrder]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-3">
          {!isAdminLike && effectiveSlug ? (
            <>
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <h2 className="text-2xl font-extrabold text-secondary tracking-tight">
                  {companyName}
                </h2>
                <p className="text-sm font-medium text-secondary">Orders</p>
              </div>
              {readOnly && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  View Only
                </span>
              )}
            </>
          ) : (
            <div>
              <h2 className="text-2xl font-extrabold text-secondary tracking-tight">
                All Orders
              </h2>
              <p className="text-sm font-medium text-secondary">
                {isAdminLike
                  ? "Viewing all company orders"
                  : "No company selected"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <VendorOrderFilters
        searchTerm={searchTerm}
        onSearchChange={(v) => setSearchTerm(v)}
        orderStatusFilter={orderStatusFilter}
        pageSize={pageSize}
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
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        // onRefresh={fetchAllOrders}
      />

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
                {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Delivery Person
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th> */}
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
                    {/* <td className="px-6 py-4">
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
                          {isChangeAllowed(order) && isAssignAllowed(order) ? (
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
                    </td> */}
                    <td className="px-2 py-2 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[#6750A4] hover:text-[#6750A4] hover:bg-[#6750A4]/10 text-xs font-medium transition"
                      >
                        <Settings className="h-4 w-4" /> <span>Manage</span>
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
          <div className="text-sm text-gray-500"></div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            pageSize={pageSize}
            enableUrlSync={true}
            className="rounded-2xl border border-gray-100"
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
