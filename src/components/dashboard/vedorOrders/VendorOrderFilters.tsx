// src/components/dashboard/vendorOrders/VendorOrderFilters.tsx
import { Search, X, Filter } from "lucide-react";
import type { CompanyListItem } from "../../../types";

interface VendorOrderFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  orderStatusFilter: string; // NEW: order status filter
  onOrderStatusChange: (val: string) => void; // NEW
  selectedCompanyId: string;
  onCompanyChange: (val: string) => void;
  companies: CompanyListItem[];
  onClear: () => void;
  showMobile: boolean;
  onToggleMobile: () => void;
  deliveryStatusFilter: string;
  onDeliveryStatusChange: (val: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodChange: (val: string) => void;
  hideCompanyFilter?: boolean;
}

export function VendorOrderFilters({
  searchTerm,
  onSearchChange,
  orderStatusFilter,
  onOrderStatusChange,
  selectedCompanyId,
  onCompanyChange,
  companies,
  onClear,
  showMobile,
  onToggleMobile,
  deliveryStatusFilter,
  onDeliveryStatusChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  hideCompanyFilter = false,
}: VendorOrderFiltersProps) {
  const hasFilters = hideCompanyFilter
    ? !!searchTerm ||
      !!orderStatusFilter ||
      !!deliveryStatusFilter ||
      !!paymentMethodFilter
    : !!searchTerm ||
      !!orderStatusFilter ||
      !!selectedCompanyId ||
      !!deliveryStatusFilter ||
      !!paymentMethodFilter;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
          Vendor Orders
        </h2>

        <button
          onClick={onToggleMobile}
          className="md:hidden flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white shadow-sm"
        >
          <Filter size={16} />
          Filters
          {hasFilters && (
            <span className="bg-[#6750A4]/10 text-[#6750A4] text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Filters Card */}
      <div
        className={`${
          showMobile ? "block" : "hidden md:block"
        } bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-5 mb-6`}
      >
        <div className="flex flex-col gap-4">

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, company name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 outline-none transition"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

            {/* Order Status */}
            <select
              value={orderStatusFilter}
              onChange={(e) => onOrderStatusChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 text-sm"
            >
              <option value="">Order Status</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="processing">Processing</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="shipped">Shipped</option>
              <option value="payment_rejected">Payment Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Delivery Status */}
            <select
              value={deliveryStatusFilter}
              onChange={(e) => onDeliveryStatusChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 text-sm"
            >
              <option value="">Delivery Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="picked_up">Picked Up</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>

            {/* Payment */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 text-sm"
            >
              <option value="">Payment</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="chapa">Chapa</option>
              <option value="other">Other</option>
            </select>

            {/* Company */}
            {!hideCompanyFilter && (
              <select
                value={selectedCompanyId}
                onChange={(e) => onCompanyChange(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 text-sm"
              >
                <option value="">Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* Clear Button */}
            {hasFilters && (
              <button
                onClick={onClear}
                className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition text-sm"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}