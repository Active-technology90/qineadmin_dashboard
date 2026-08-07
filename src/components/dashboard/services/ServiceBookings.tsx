import { useMemo, useState, useEffect } from "react";
import { Calendar, Repeat, Settings, X } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useServiceBookings } from "../../../hooks/useServiceBookings";
import { CompanySelector } from "../company-products/CompanySelector";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import { ServiceBookingAdvancedFilters } from "./ServiceBookingFilters";
import { ServiceBookingManageModal } from "./ServiceBookingManageModal";
import { extractErrorMessage } from "../../../utils/extractErrorMessage";
import type { ServiceBooking } from "../../../types";

/* -------------------- constants -------------------- */
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-purple-50 text-purple-700 border-purple-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-gray-100 text-gray-600 border-gray-200",
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = status?.toLowerCase();
  const color = STATUS_COLORS[normalized] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {normalized.replace(/_/g, " ")}
    </span>
  );
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

const PAGE_SIZE_OPTIONS: SelectOption[] = [
  { value: "10", label: "10 / page" },
  { value: "15", label: "15 / page" },
  { value: "20", label: "20 / page" },
  { value: "30", label: "30 / page" },
  { value: "50", label: "50 / page" },
];

export default function ServiceBookings() {
  /* -------------------- context & hooks -------------------- */
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const serviceCompanies = useMemo(
    () => companies.filter((c) => c.business_type === "service"),
    [companies]
  );
  const selectedCompany = companies.find((c) => c.slug === companySlug);
  const isServiceCompany = selectedCompany?.business_type === "service";

  /* -------------------- filter states -------------------- */
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
  const [companyNotes, setCompanyNotes] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // refresh trigger – pass to hook if it supports a third parameter (or use a key)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /* -------------------- data fetching -------------------- */
  const filters = {
    status: statusFilter === "all" ? undefined : statusFilter,
    date: dateFilter || undefined,
  };

  const { bookings, loading, updateStatus, getBookingDetail } = useServiceBookings(
    isServiceCompany ? companySlug : null,
    filters,
    refreshTrigger // if the hook accepts an extra refetch key
  );

  /* -------------------- derived data & pagination -------------------- */
  const searchedBookings = useMemo(() => {
    if (!search.trim()) return bookings;
    const term = search.toLowerCase();
    return bookings.filter(
      (b) =>
        String(b.id).includes(term) ||
        b.customer_name?.toLowerCase().includes(term) ||
        b.offering?.title?.toLowerCase().includes(term) ||
        (b.customer_phone && b.customer_phone.includes(term))
    );
  }, [bookings, search]);

  // apply payment & any other local filters
  const filteredBookings = useMemo(() => {
    let result = searchedBookings;
    if (paymentStatusFilter) {
      result = result.filter((b) => b.payment_status === paymentStatusFilter);
    }
    if (paymentMethodFilter) {
      result = result.filter((b) => b.payment_method === paymentMethodFilter);
    }
    return result;
  }, [searchedBookings, paymentStatusFilter, paymentMethodFilter]);

  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter, search, paymentStatusFilter, paymentMethodFilter, pageSize]);

  /* -------------------- helpers -------------------- */
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenBooking = async (bookingId: number) => {
    try {
      const fullBooking = await getBookingDetail(bookingId);
      setSelectedBooking(fullBooking);
      setCompanyNotes(fullBooking.company_notes || "");
      setFinalPrice(fullBooking.final_price || fullBooking.quoted_price || "");
    } catch {
      showToast("error", "Could not load booking details");
    }
  };

  const handleRefreshBooking = async () => {
    if (!selectedBooking) return;
    try {
      const updated = await getBookingDetail(selectedBooking.id);
      setSelectedBooking(updated);
      setCompanyNotes(updated.company_notes || "");
      setFinalPrice(updated.final_price || updated.quoted_price || "");
    } catch {
      showToast("error", "Could not refresh booking");
    }
  };

const handleStatusUpdate = async (
  booking: ServiceBooking,
  status: ServiceBooking["status"]
) => {
  try {
    await updateStatus(booking.id, {
      status,
      company_notes: companyNotes || undefined,
      final_price: finalPrice || undefined,
    });
    showToast("success", `Booking marked as ${status.replace("_", " ")}`);

    // ✅ Refresh the booking data – modal stays open
    await handleRefreshBooking();   // <-- re‑fetches the booking & updates state
  } catch (err: any) {
    showToast("error", extractErrorMessage(err, "Failed to update booking"));
  }
};

  const clearAllFilters = () => {
    setStatusFilter("all");
    setDateFilter("");
    setSearch("");
    setPaymentStatusFilter("");
    setPaymentMethodFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    !!dateFilter ||
    !!search ||
    !!paymentStatusFilter ||
    !!paymentMethodFilter;

  /* -------------------- early returns -------------------- */
  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies.length ? serviceCompanies : companies}
        isLoading={isLoadingCompanies}
        title="Service Bookings"
        searchPlaceholder="Search service companies..."
        onSelect={(slug, name) => {
          const membership = user?.memberships?.find((m: any) => m.company_slug === slug);
          const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");
          switchCompany({ slug, name, role });
        }}
        onBack={clearCompany}
      />
    );
  }

  if (!isServiceCompany) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        Select a service company to view bookings.
      </div>
    );
  }

  /* -------------------- main view -------------------- */
  return (
    <>
      <Toast toast={toast} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-secondary">Bookings</h1>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm md:text-lg text-gray-500">Incoming appointments for</p>
              <span className="text-sm md:text-lg text-secondary font-bold">{companyName}</span>
            </div>
          </div>
          {isSuperAdmin && (
            <button
              onClick={clearCompany}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-secondary border border-secondary rounded-xl hover:bg-purple-50 transition"
            >
              <Repeat className="h-4 w-4" /> Switch Company
            </button>
          )}
        </div>

        {/* Mobile trigger (only shows on smaller screens) */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilter(true)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700"
          >
            <span className="font-medium">Filters & Search</span>
            {hasActiveFilters && (
              <span className="bg-secondary/10 text-secondary text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Desktop filters */}
        <div className="hidden lg:block mb-6">
          <ServiceBookingAdvancedFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            paymentStatusFilter={paymentStatusFilter}
            onPaymentStatusChange={setPaymentStatusFilter}
            paymentMethodFilter={paymentMethodFilter}
            onPaymentMethodChange={setPaymentMethodFilter}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            hasActiveFilters={hasActiveFilters}
            onClear={clearAllFilters}
            onRefresh={() => setRefreshTrigger((t) => t + 1)}
            statusOptions={STATUS_OPTIONS}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>

        {/* Table / empty states */}
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading bookings...</div>
        ) : paginatedBookings.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {bookings.length === 0 ? "No bookings found." : "No matching bookings."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5">
                  <tr className="text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    <th className="px-4 py-3">Booking Id</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date / Time</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-gray-900">#{b.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 font-medium">
                          {b.customer_name || `#${b.customer}`}
                        </p>
                        {b.customer_phone && (
                          <p className="text-xs text-gray-400">{b.customer_phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {b.offering?.title || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {Number(b.quoted_price).toLocaleString()} {b.currency}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-gray-900">{b.scheduled_date}</p>
                        <p className="text-xs text-gray-500">
                          {String(b.scheduled_time).slice(0, 5)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenBooking(b.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-secondary hover:text-secondary hover:bg-secondary/10 text-sm font-medium transition-all"
                        >
                          <Settings className="h-4 w-4" /> Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {/* Booking detail modal */}
        {selectedBooking && (
          <ServiceBookingManageModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onStatusUpdate={handleStatusUpdate}
            companyNotes={companyNotes}
            setCompanyNotes={setCompanyNotes}
            finalPrice={finalPrice}
            setFinalPrice={setFinalPrice}
            allBookings={bookings}
            onRefresh={handleRefreshBooking}
          />
        )}

        {/* Mobile filter bottom sheet */}
        {showMobileFilter && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setShowMobileFilter(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-secondary">Filters</h3>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                {/* Use the same advanced filters, stacked vertically */}
                <ServiceBookingAdvancedFilters
                  search={search}
                  onSearchChange={setSearch}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  paymentStatusFilter={paymentStatusFilter}
                  onPaymentStatusChange={setPaymentStatusFilter}
                  paymentMethodFilter={paymentMethodFilter}
                  onPaymentMethodChange={setPaymentMethodFilter}
                  pageSize={pageSize}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  hasActiveFilters={hasActiveFilters}
                  onClear={() => {
                    clearAllFilters();
                    setShowMobileFilter(false);
                  }}
                  onRefresh={() => setRefreshTrigger((t) => t + 1)}
                  statusOptions={STATUS_OPTIONS}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  // optional: add className to override flex direction
                  // but the component itself is already responsive, so we may not need extra styling.
                />
                <div className="flex gap-3 pt-4">
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        clearAllFilters();
                        setShowMobileFilter(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowMobileFilter(false)}
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
    </>
  );
}