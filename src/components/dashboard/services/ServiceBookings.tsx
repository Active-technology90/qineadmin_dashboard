import { useMemo, useState } from "react";
import { Calendar, Repeat } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useServiceBookings } from "../../../hooks/useServiceBookings";
import { CompanySelector } from "../company-products/CompanySelector";
import { Toast } from "../../ui/Toast";
import { extractErrorMessage } from "../../../utils/extractErrorMessage";
import type { ServiceBooking } from "../../../types";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-green-50 text-green-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-purple-50 text-purple-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-gray-100 text-gray-600",
};

export default function ServiceBookings() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const serviceCompanies = useMemo(
    () => companies.filter((c) => c.business_type === "service"),
    [companies],
  );
  const selectedCompany = companies.find((c) => c.slug === companySlug);
  const isServiceCompany = selectedCompany?.business_type === "service";

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
  const [companyNotes, setCompanyNotes] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const filters = {
    status: statusFilter === "all" ? undefined : statusFilter,
    date: dateFilter || undefined,
  };

  const { bookings, loading, updateStatus, refetch } = useServiceBookings(
    isServiceCompany ? companySlug : null,
    filters,
  );

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

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

  const handleStatusUpdate = async (booking: ServiceBooking, status: ServiceBooking["status"]) => {
    try {
      await updateStatus(booking.id, {
        status,
        company_notes: companyNotes || undefined,
        final_price: finalPrice || undefined,
      });
      showToast("success", `Booking marked as ${status.replace("_", " ")}`);
      setSelectedBooking(null);
      setCompanyNotes("");
      setFinalPrice("");
    } catch (err: any) {
      showToast("error", extractErrorMessage(err, "Failed to update booking"));
    }
  };

  return (
    <>
      <Toast toast={toast} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Incoming appointments for {company?.name}
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={clearCompany}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <Repeat className="h-4 w-4" />
              Switch Company
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {(statusFilter !== "all" || dateFilter) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setDateFilter("");
              }}
              className="text-sm text-purple-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No bookings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                  <th className="pb-3 pr-4">Date / Time</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Service</th>
                  <th className="pb-3 pr-4">Price</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{b.scheduled_date}</p>
                      <p className="text-xs text-gray-500">
                        {String(b.scheduled_time).slice(0, 5)}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-gray-900">{b.customer_name || `#${b.customer}`}</p>
                      {b.customer_phone && (
                        <p className="text-xs text-gray-400">{b.customer_phone}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {b.offering?.title || "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {Number(b.quoted_price).toLocaleString()} {b.currency}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs capitalize ${
                          STATUS_COLORS[b.status] || "bg-gray-100"
                        }`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => {
                          setSelectedBooking(b);
                          setCompanyNotes(b.company_notes || "");
                          setFinalPrice(b.final_price || b.quoted_price);
                        }}
                        className="text-xs font-medium text-purple-700 hover:underline"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Booking #{selectedBooking.id}
            </h3>

            <div className="space-y-3 text-sm mb-4">
              <p>
                <span className="text-gray-500">Customer:</span>{" "}
                {selectedBooking.customer_name}
              </p>
              <p>
                <span className="text-gray-500">Service:</span>{" "}
                {selectedBooking.offering?.title}
              </p>
              <p>
                <span className="text-gray-500">When:</span>{" "}
                {selectedBooking.scheduled_date} at{" "}
                {String(selectedBooking.scheduled_time).slice(0, 5)}
              </p>
              {/* Location is not yet implemented */}
              {/* <p>
                <span className="text-gray-500">Location:</span>{" "}
                {selectedBooking.location_type === "customer_location" ? (
                  <span className="font-semibold text-purple-700">
                    🏠 On-Site ({selectedBooking.service_address_text || "Customer Address"})
                  </span>
                ) : (
                  <span>🏬 At Provider Studio</span>
                )}
              </p> */}
              {selectedBooking.assigned_staff && (
                <p>
                  <span className="text-gray-500">Assigned Specialist:</span>{" "}
                  <span className="font-semibold text-gray-900">
                    👤 {selectedBooking.assigned_staff.name} ({selectedBooking.assigned_staff.role_title || "Specialist"})
                  </span>
                </p>
              )}
              {selectedBooking.customer_notes && (
                <p>
                  <span className="text-gray-500">Notes:</span>{" "}
                  {selectedBooking.customer_notes}
                </p>
              )}
              {Object.keys(selectedBooking.intake_data || {}).length > 0 && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    Intake Form Responses
                  </p>
                  {Object.entries(selectedBooking.intake_data).map(([k, v]) => (
                    <p key={k}>
                      <span className="text-gray-500 capitalize">{k.replace(/_/g, " ")}:</span>{" "}
                      {String(v)}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <textarea
                value={companyNotes}
                onChange={(e) => setCompanyNotes(e.target.value)}
                placeholder="Message to customer (quote details, instructions...)"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                placeholder="Final price"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["confirmed", "in_progress", "completed", "cancelled", "no_show"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(selectedBooking, status)}
                    disabled={selectedBooking.status === status}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-40 capitalize"
                  >
                    {status.replace("_", " ")}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() => setSelectedBooking(null)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
