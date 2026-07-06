import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Package, Building2, Settings, X } from "lucide-react";
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
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import { SearchInput } from "../../ui/SearchInput";

const DEFAULT_PAGE_SIZE = 10;

/* ---------- Reusable sub‑components ---------- */
const StatusBadge = ({
  status,
  type = "order",
}: {
  status: string;
  type?: "order" | "delivery";
}) => {
  const normalizedStatus = status?.toLowerCase?.() || "";

  const orderStatusLabels: Record<string, string> = {
    processing: "Prepared",
    shipped: "In Transit",
    fulfilled: "Delivered",
    contacted: "Confirmed",
    pending: "pending", // order status stays pending
  };

  const deliveryStatusLabels: Record<string, string> = {
    pending: "Assigned", // delivery status mapping
    out_for_delivery: "In Transit",
    delivered: "Completed",
  };

  const labels =
    type === "delivery" ? deliveryStatusLabels : orderStatusLabels;

  const displayLabel =
    labels[normalizedStatus] ||
    normalizedStatus.replace(/_/g, " ");

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
    failed: "bg-red-50 text-red-700 border border-red-200",
    rejected: "bg-rose-50 text-rose-700 border border-rose-200",
    contacted: "bg-teal-50 text-teal-700 border border-teal-200",
    fulfilled: "bg-green-100 text-green-800 border border-green-200",
    payment_rejected: "bg-red-50 text-red-700 border border-red-200",
    self_pickup: "bg-blue-50 text-blue-700 border border-blue-200",
  };

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



// Helper component for formatted date display
const OrderDate = ({ dateString }: { dateString?: string }) => {
  if (!dateString) return <span className="text-gray-400 text-xs">—</span>;
  
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
  
  const formatTime = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  const formatDate = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-gray-900">
        {isToday ? 'Today' : isYesterday ? 'Yesterday' : formatDate}
      </span>
      <span className="text-xs text-gray-500 font-mono">
        {formatTime}
      </span>
    </div>
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

const SkeletonRow = ({ isAdminLike }: { isAdminLike: boolean }) => (
  <tr className="animate-pulse">
    {/* Order ID */}
    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2">
      <div className="h-4 bg-gray-200 rounded w-16" />
    </td>
    {/* Company column (only for admin) */}
    {isAdminLike && (
      <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      </td>
    )}
    {/* Amount */}
    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2">
      <div className="h-4 bg-gray-200 rounded w-20" />
    </td>
    {/* Payment Method */}
    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2">
      <div className="h-4 bg-gray-200 rounded w-24" />
    </td>
    {/* Order Status */}
    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2">
      <div className="h-6 bg-gray-200 rounded-full w-20" />
    </td>
    {/* Delivery Status */}
    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2">
      <div className="h-6 bg-gray-200 rounded-full w-24" />
    </td>
    {/* Date & Time */}
    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2">
      <div className="space-y-1">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-2 bg-gray-200 rounded w-16" />
      </div>
    </td>
    {/* Actions */}
    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2 whitespace-nowrap text-right">
      <div className="h-7 w-16 bg-gray-200 rounded-lg ml-auto" />
    </td>
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

  // Superadmin: global admin API. Viewer: scoped admin API (backend filters by company).
  // Admin/staff: company-scoped API only.
  const shouldFetchAll = isSuperAdmin || readOnly;

  const companySlug = company?.slug ?? null;
  const effectiveSlug = useMemo(() => {
    if (shouldFetchAll) return null;
    if (user?.memberships?.length) {
      return companySlug || user.memberships[0]?.company_slug || null;
    }
    return null;
  }, [shouldFetchAll, companySlug, user]);

  // const companyName = company?.name ?? "";

  // const companyLogo = useMemo(() => {
  //   if (!effectiveSlug || !companies.length) return null;
  //   const foundCompany = companies.find((c: any) => c.slug === effectiveSlug);
  //   return foundCompany?.logo || null;
  // }, [effectiveSlug, companies]);

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
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const { toast, showToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
    // Active filter count for mobile filter badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (orderStatusFilter) count++;
    if (deliveryStatusFilter) count++;
    if (paymentMethodFilter) count++;
    if (selectedCompanyId) count++;
    return count;
  }, [searchTerm, orderStatusFilter, deliveryStatusFilter, paymentMethodFilter, selectedCompanyId]);

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
        // Try with a larger page size, but backend may override
        const params = {
          page,
          page_size: 500,
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
        const actualPageSize = allData.length || 20;
        const remainingPages = Math.ceil((total - allData.length) / actualPageSize);
        const promises = [];
        for (let i = 0; i < remainingPages; i++) {
          promises.push(fetchPage(i + 2));
        }
        const results = await Promise.all(promises);
        results.forEach((res) => {
          allData = allData.concat(res.data.results);
        });
        console.log(' Total orders after fetching all:', allData.length);
      }

      if (!controller.signal.aborted) {
        console.log(' Setting allOrders with:', allData.length, 'orders');
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
    // Options for Order Status dropdown (matches existing options)
  const orderStatusOptions: SelectOption[] = [
    { value: "", label: "All Order Status" },
    { value: "pending", label: "Pending" },
    { value: "contacted", label: "Confirmed" },
    { value: "processing", label: "Prepared" },
    { value: "fulfilled", label: "Delivered" },
    { value: "shipped", label: "In Transit" },
    { value: "payment_rejected", label: "Payment Rejected" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // Options for Delivery Status dropdown
  const deliveryStatusOptions: SelectOption[] = [
    { value: "", label: "All Delivery Status" },
    { value: "pending", label: "Assigned" },
    { value: "accepted", label: "Accepted" },
    { value: "picked_up", label: "Picked Up" },
    { value: "out_for_delivery", label: "In Transit" },
    { value: "delivered", label: "Completed" },
    { value: "failed", label: "Failed" },
  ];

  // Options for Payment Method dropdown
  const paymentMethodOptions: SelectOption[] = [
    { value: "", label: "All Payment Method" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "chapa", label: "Chapa" },
    { value: "cod", label: "COD" },
  ];

    // Options for Page Size dropdown
  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: "5 / page" },
    { value: "10", label: "10 / page" },
    { value: "15", label: "15 / page" },
    { value: "30", label: "30 / page" },
    { value: "60", label: "60 / page" },
  ];

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {!isAdminLike && effectiveSlug ? (
            <>
              {/* {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )} */}
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-secondary tracking-tight break-words">
                  {/* {companyName} */} All Orders
                </h2>
                {/* <p className="text-sm font-medium text-secondary">Orders</p> */}
              </div>
              {readOnly && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] sm:text-xs px-2 py-1 rounded-full">
                  View Only
                </span>
              )}
            </>
          ) : (
            <div>
              <h2 className="text-base sm:text-2xl font-extrabold text-secondary tracking-tight break-words">
                All Orders
              </h2>
              <p className="text-[10px] sm:text-sm font-medium text-secondary">
                {isAdminLike
                  ? "Viewing all company orders"
                  : "No company selected"}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Search Bar with Mobile Filter Button Inside - HIDDEN ON DESKTOP, VISIBLE ON MOBILE */}
      <div className="mb-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by order ID, customer name, or company..."
              loading={loading}
              showMobileFilter={true}
              onMobileFilterClick={() => setShowMobileFilterModal(true)}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <div className="w-24 flex-shrink-0">
            <CustomSelect
              value={String(pageSize)}
              onChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
              options={pageSizeOptions}
              placeholder="5"
            />
          </div>
        </div>
      </div>

      {/* Filters */}

      {/* Filters */}
      <VendorOrderFilters
        searchTerm={searchTerm}
        onSearchChange={(v) => setSearchTerm(v)}
        orderStatusFilter={orderStatusFilter}
        onOrderStatusChange={(v) => setOrderStatusFilter(v)}
        deliveryStatusFilter={deliveryStatusFilter}
        onDeliveryStatusChange={(v) => setDeliveryStatusFilter(v)}
        paymentMethodFilter={paymentMethodFilter}
        onPaymentMethodChange={(v) => setPaymentMethodFilter(v)}
        selectedCompanyId={selectedCompanyId}
        onCompanyChange={(v) => setSelectedCompanyId(v)}
        companies={isAdminLike ? companies : []}
        onClear={clearFilters}
        hideCompanyFilter={!isAdminLike}
        pageSize={pageSize}
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
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm mt-3 -mx-3 sm:mx-0 px-3 sm:px-0">
<table className="min-w-[600px] lg:min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm z-10 shadow-sm">
              <tr>
<th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-right text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Order ID
                  </span>
                </th>
                {isAdminLike && (
                  <th className="px-1.5 sm:px-4 lg:px-6 py-2 sm:py-4 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      Company
                    </span>
                  </th>
                )}
                <th className="px-1.5 sm:px-4 lg:px-6 py-2 sm:py-4 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Amount
                  </span>
                </th>
                <th className="px-1.5 sm:px-2 lg:px-3 py-2 sm:py-2 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Payment Method
                  </span>
                </th>
                <th className="px-1.5 sm:px-4 lg:px-6 py-2 sm:py-4 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Order Status
                  </span>
                </th>
                <th className="px-1.5 sm:px-4 lg:px-6 py-2 sm:py-4 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Delivery Status
                  </span>
                </th>
                <th className="px-1.5 sm:px-4 lg:px-6 py-2 sm:py-4 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-secondary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Date & Time</span>
                  </div>
                </th>
                <th className="px-1.5 sm:px-4 lg:px-6 py-2 sm:py-4 text-right text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} isAdminLike={isAdminLike} />)
              ) : paginatedOrders.length === 0 ? (
                <EmptyState />
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
<td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2 text-xs sm:text-sm font-semibold text-secondary truncate max-w-[80px] sm:max-w-none">
                      #{order.id}
                    </td>
                    {isAdminLike && (
                      <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <CompanyAvatar
                            logo={order.company?.logo}
                            name={order.company?.name || "Unknown"}
                          />
<span className="text-[10px] sm:text-sm font-medium text-gray-700 truncate max-w-[80px] lg:max-w-[100px]">
                            {order.company?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {Number(order.amount).toLocaleString()}{" "}
                      <span className="text-[9px] sm:text-xs text-gray-500 whitespace-nowrap">ETB</span>
                    </td>
                     <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2 text-[10px] sm:text-sm text-gray-700">
                      {order.payment_method
                        ? order.payment_method.replace(/_/g, " ")
                        : "—"}
                    </td>
                    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2">
                     <StatusBadge status={order.status} type="order" />
                    </td>
                    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2">
                      <StatusBadge 
                        status={
                          // Pickup orders have no shipping address
                          !order.shipping_address_text
                            ? "self_pickup" 
                            : (order.delivery?.status || "no assigned")
                        } 
                        type="delivery" 
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
                            <button className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-secondary text-secondary hover:bg-secondary/10">
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
                    */}
                   
                    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2 whitespace-nowrap">
                      <OrderDate dateString={order.created_at} />
                    </td>
                    <td className="px-2 sm:px-2 lg:px-3 py-2 sm:py-2 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-secondary hover:text-secondary hover:bg-secondary/10 text-[10px] sm:text-sm font-medium transition-all duration-200 group"
                      >
                        <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:rotate-90" /> 
                        <span>Manage</span>
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
        <div className="mt-4 sm:mt-6">
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


              {/* Order Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Order Status
                </label>
                <CustomSelect
                  value={orderStatusFilter}

                  onChange={setOrderStatusFilter}
                  options={orderStatusOptions}
                  placeholder="All Order Status"
                />
              </div>

              {/* Delivery Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Delivery Status
                </label>
                <CustomSelect
                  value={deliveryStatusFilter}
                  onChange={setDeliveryStatusFilter}
                  options={deliveryStatusOptions}
                  placeholder="All Delivery Status"
                />
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Payment Method
                </label>
                <CustomSelect
                  value={paymentMethodFilter}

                  onChange={setPaymentMethodFilter}
                  options={paymentMethodOptions}
                  placeholder="All Payment Method"
                />
              </div>

              {/* Company Filter (if admin) */}
              {!isAdminLike && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Company
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-secondary focus:shadow-sm transition-all"
                  >
                    <option value="">All Companies</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons - Equal width, side by side */}
              <div className="flex items-center gap-3 pt-2">
                {(searchTerm || orderStatusFilter || deliveryStatusFilter || paymentMethodFilter || selectedCompanyId) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setOrderStatusFilter("");
                      setDeliveryStatusFilter("");
                      setPaymentMethodFilter("");
                      setSelectedCompanyId("");
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
