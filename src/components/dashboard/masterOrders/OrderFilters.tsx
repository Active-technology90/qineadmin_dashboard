// src/components/dashboard/orders/OrderFilters.tsx
import { Search, X, Filter } from "lucide-react";

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  deliveryStatusFilter: string;
  onDeliveryStatusChange: (val: string) => void;
  paymentStatusFilter: string;          // NEW: payment status filter
  onPaymentStatusChange: (val: string) => void; // NEW: handler for payment status
  fulfillmentTypeFilter: string;        // NEW: fulfillment type filter
  onFulfillmentTypeChange: (val: string) => void; // NEW: handler for fulfillment type
  // pageSize: number;
  // onPageSizeChange: (size: number) => void;
  onClear: () => void;
  showMobile: boolean;
  onToggleMobile: () => void;
}

export function OrderFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  deliveryStatusFilter,
  onDeliveryStatusChange,
  paymentStatusFilter,           // NEW
  onPaymentStatusChange,
  fulfillmentTypeFilter,
  
  onFulfillmentTypeChange,
  onClear,
  showMobile,
  onToggleMobile,
}: OrderFiltersProps) {
  // Include paymentStatusFilter in "hasFilters"
  const hasFilters = !!searchTerm || !!statusFilter || !!deliveryStatusFilter || !!paymentStatusFilter || !!fulfillmentTypeFilter ;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Orders</h2>
        <button
          onClick={onToggleMobile}
          className="md:hidden flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white shadow-sm"
        >
          <Filter size={16} />
          Filters
          {hasFilters && (
            <span className="bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
      </div>

      <div className={`${showMobile ? "block" : "hidden md:block"}`}>
        <div className="bg-transparent">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, customer name..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 outline-none transition text-sm"
              />
            </div>

            {/* Order Status (main order status) */}
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 text-sm"
            >
              <option value="">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Delivery Status */}
            <select
              value={deliveryStatusFilter}
              onChange={(e) => onDeliveryStatusChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 text-sm"
            >
              <option value="">All Delivery Statuses</option>
              <option value="pending">Pending Assignment</option>
              <option value="accepted">Accepted by Driver</option>
              <option value="picked_up">Picked Up</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>

            {/* NEW: Payment Status Filter */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => onPaymentStatusChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 text-sm"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Verifying Receipt">Verifying Receipt</option>
              <option value="Pay on Delivery">Pay on Delivery</option>
              <option value="Checkout Initiated">Checkout Initiated</option>
              <option value="Awaiting Bank Transfer">Awaiting Bank Transfer</option>
            </select>

            <select
              value={fulfillmentTypeFilter}
              onChange={(e) => onFulfillmentTypeChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 text-sm"
            >
              <option value="">All Fulfillment Types</option>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>

            {/* 
              PROFESSIONAL NOTE: 
              To add another filter (e.g., "Fulfillment Type", "Vendor Name", etc.):
              1. Add new prop to OrderFiltersProps (e.g., fulfillmentFilter, onFulfillmentChange)
              2. Destructure it in the function arguments
              3. Update hasFilters condition
              4. Add a new <select> or other input element below this comment.
              All existing filters follow the same pattern.
            */}

            {/* Clear Button */}
            {hasFilters && (
              <button
                onClick={onClear}
                className="flex items-center gap-1 px-4 py-2.5 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition"
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