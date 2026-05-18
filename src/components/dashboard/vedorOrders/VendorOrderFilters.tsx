import { Search, X, Filter, ChevronDown, RefreshCw } from "lucide-react";
import type { CompanyListItem } from "../../../types";

interface VendorOrderFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;

  orderStatusFilter: string;
  onOrderStatusChange: (val: string) => void;

  deliveryStatusFilter: string;
  onDeliveryStatusChange: (val: string) => void;

  paymentMethodFilter: string;
  onPaymentMethodChange: (val: string) => void;

  selectedCompanyId: string;
  onCompanyChange: (val: string) => void;

  companies: CompanyListItem[];

  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  onRefresh?: () => void;

  onClear: () => void;

  showMobile: boolean;
  onToggleMobile: () => void;

  hideCompanyFilter?: boolean;
}

export function VendorOrderFilters({
  searchTerm,
  onSearchChange,
  orderStatusFilter,
  onOrderStatusChange,
  deliveryStatusFilter,
  onDeliveryStatusChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  selectedCompanyId,
  onCompanyChange,
  companies,
  pageSize,
  onPageSizeChange,
  onClear,
  onRefresh,
  showMobile,
  onToggleMobile,
  hideCompanyFilter = false,
}: VendorOrderFiltersProps) {
  const hasFilters =
    !!searchTerm ||
    !!orderStatusFilter ||
    !!deliveryStatusFilter ||
    !!paymentMethodFilter ||
    (!!selectedCompanyId && !hideCompanyFilter);

  const ORDER_STATUS_LABELS: Record<string, string> = {
    contacted: "Confirmed",

    processing: "Prepared",
    shipped: "In Transit",
    fulfilled: "Delivered",

    pending: "Assigned",
    out_for_delivery: "In Transit",
    delivered: "Completed",
  };
  return (
    <div
      className={`${
        showMobile ? "block" : "hidden md:block"
      } w-full bg-white rounded-2xl border border-gray-100 shadow-sm transition-all`}
    >
      {/* Header – only title & utility buttons */}
      <div className="flex items-center justify-between px-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* <h2 className="text-lg font-semibold text-gray-800">Filters</h2> */}
          {/* {hasFilters && (
            <span className="text-xs bg-[#6750A4]/10 text-[#6750A4] px-2 py-0.5 rounded-full font-medium">
              Active
            </span>
          )} */}
        </div>

        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium
                         border border-red-200 text-red-600 hover:bg-red-50 transition"
            >
              <X size={14} />
              Clear
            </button>
          )}
          <button
            onClick={onToggleMobile}
            className="md:hidden inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium
                       border border-gray-200 rounded-xl bg-white shadow-sm"
          >
            <Filter size={14} />
            Filters
          </button>
        </div>
      </div>

      {/* Body – search + filters + page size inline */}
      <div className="p-5 space-y-5">
        {/* Search with Refresh Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or company..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                       focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20
                       outline-none transition text-sm"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-gray-50
                         hover:bg-white hover:border-[#6750A4] transition-all duration-200 group flex-shrink-0"
              title="Refresh orders"
            >
              <RefreshCw className="h-4 w-4 text-gray-500 group-hover:text-[#6750A4] group-hover:rotate-180 transition-all duration-300" />
            </button>
          )}
        </div>

        {/* Filters + Page Size – all in one grid row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Order Status */}
          <div className="relative">
            <select
              value={orderStatusFilter}
              onChange={(e) => onOrderStatusChange(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20
                         text-sm pr-8 outline-none transition"
            >
              <option value="">All Order Status</option>

              <option value="pending">Pending</option>
              <option value="contacted">{ORDER_STATUS_LABELS.contacted}</option>
              <option value="processing">
                {ORDER_STATUS_LABELS.processing}
              </option>
              <option value="fulfilled">{ORDER_STATUS_LABELS.fulfilled}</option>
              <option value="shipped">{ORDER_STATUS_LABELS.shipped}</option>

              <option value="payment_rejected">Payment Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Delivery Status */}
          <div className="relative">
            <select
              value={deliveryStatusFilter}
              onChange={(e) => onDeliveryStatusChange(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20
                         text-sm pr-8 outline-none transition"
            >
              <option value="">All Delivery Status</option>

              <option value="pending">{ORDER_STATUS_LABELS.pending}</option>
              <option value="accepted">Accepted</option>
              <option value="picked_up">Picked Up</option>

              <option value="out_for_delivery">
                {ORDER_STATUS_LABELS.out_for_delivery}
              </option>

              <option value="delivered">{ORDER_STATUS_LABELS.delivered}</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Payment Method */}
          <div className="relative">
            <select
              value={paymentMethodFilter}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20
                         text-sm pr-8 outline-none transition"
            >
              <option value="">All Payment Method</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="chapa">Chapa</option>
              <option value="cod">COD</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Company (conditional) */}
          {!hideCompanyFilter && (
            <div className="relative">
              <select
                value={selectedCompanyId}
                onChange={(e) => onCompanyChange(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                           focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20
                           text-sm pr-8 outline-none transition"
              >
                <option value=""> All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Page Size – now in the same row! */}
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20
                         text-sm pr-8 outline-none transition"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
              <option value={60}>60 / page</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
