// src/components/dashboard/vendorOrders/VendorOrderFilters.tsx
import { Search, X, Filter } from "lucide-react";
import type { CompanyListItem } from "../../../types";

interface VendorOrderFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  selectedCompanyId: string;
  onCompanyChange: (val: string) => void;
  companies: CompanyListItem[];
  onClear: () => void;
  showMobile: boolean;
  onToggleMobile: () => void;
  deliveryStatusFilter: string;
  onDeliveryStatusChange: (val: string) => void;
  paymentMethodFilter: string;                 // new
  onPaymentMethodChange: (val: string) => void; // new
  hideCompanyFilter?: boolean;
}

export function VendorOrderFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  selectedCompanyId,
  onCompanyChange,
  companies,
  onClear,
  showMobile,
  onToggleMobile,
  deliveryStatusFilter,
  onDeliveryStatusChange,
  paymentMethodFilter,            // new
  onPaymentMethodChange,          // new
  hideCompanyFilter = false,
}: VendorOrderFiltersProps) {
  // Include payment method in active badge check
  const hasFilters = hideCompanyFilter
    ? !!searchTerm || !!statusFilter || !!deliveryStatusFilter || !!paymentMethodFilter
    : !!searchTerm || !!statusFilter || !!selectedCompanyId || !!deliveryStatusFilter || !!paymentMethodFilter;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Vendor Orders
        </h2>
        <button
          onClick={onToggleMobile}
          className="md:hidden flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg"
        >
          <Filter size={16} /> Filters
          {hasFilters && (
            <span className="bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
      </div>
      <div className={`${showMobile ? "block" : "hidden md:block"} mb-6`}>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, company name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-[#6750A4] rounded-lg focus:ring-2 focus:ring-[#6750A4] focus:outline-none"
            />
          </div>

          <select
            value={deliveryStatusFilter}
            onChange={(e) => onDeliveryStatusChange(e.target.value)}
            className="px-3 py-2 border border-[#6750A4] rounded-lg text-sm bg-white"
          >
            <option value="">All Delivery Statuses</option>
            <option value="accepted">Accepted</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="pending">Pending</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* NEW: Payment Method dropdown */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => onPaymentMethodChange(e.target.value)}
            className="px-3 py-2 border border-[#6750A4] rounded-lg text-sm bg-white"
          >
            <option value="">All Payment Methods</option>
            {/* <option value="cash">Cash</option>
            <option value="card">Card</option> */}
            <option value="bank_transfer">Bank Transfer</option>
            <option value="chapa">Chapa</option>
            <option value="other">Other</option>
          </select>

          {!hideCompanyFilter && (
            <select
              value={selectedCompanyId}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="px-3 py-2 border border-[#6750A4] rounded-lg text-sm bg-white"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button
              onClick={onClear}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <X className="h-4 w-4 inline mr-1" /> Clear
            </button>
          )}
        </div>
      </div>
    </>
  );
}