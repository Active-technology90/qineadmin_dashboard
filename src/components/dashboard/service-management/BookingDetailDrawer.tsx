import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  X,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  CalendarDays,
  Clock,
  Receipt,
  History,
  StickyNote,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertCircle,
  Printer,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  Mail,
  Phone,
  Home,
} from "lucide-react";
import { getBookingById, updateBookingStatus, type Booking } from "../../../mock/serviceApi";
import { useToast } from "../../../hooks/useToast";

// ─── Status config ───────────────────────────────
const STATUS_MAP: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: AlertCircle, className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  confirmed: { label: "Confirmed", icon: CheckCircle, className: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  in_progress: { label: "In Progress", icon: Clock, className: "bg-purple-50 text-purple-700 ring-purple-600/20" },
  completed: { label: "Completed", icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-red-50 text-red-700 ring-red-600/20" },
  no_show: { label: "No Show", icon: XCircle, className: "bg-gray-100 text-gray-700 ring-gray-300" },
  paid: { label: "Paid", icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  refunded: { label: "Refunded", icon: XCircle, className: "bg-red-50 text-red-700 ring-red-600/20" },
  partial_refund: { label: "Partial Refund", icon: AlertCircle, className: "bg-orange-50 text-orange-700 ring-orange-600/20" },
  failed: { label: "Failed", icon: XCircle, className: "bg-rose-50 text-rose-700 ring-rose-600/20" },
};

const getStatusChip = (status: string) => STATUS_MAP[status] || STATUS_MAP.pending;

// All possible booking statuses (for admin dropdown)
const ALL_BOOKING_STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"] as const;

// ─── Reusable components ─────────────────────────
const StatusChip = memo(({ status }: { status: string }) => {
  const chip = getStatusChip(status);
  const Icon = chip.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${chip.className}`}>
      <Icon size={12} />
      {chip.label}
    </span>
  );
});
StatusChip.displayName = "StatusChip";

const InfoRow = memo(
  ({ label, value, icon, copyable }: { label: string; value: string | React.ReactNode; icon?: React.ReactNode; copyable?: boolean }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = useCallback(() => {
      if (typeof value === "string" && value) {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }, [value]);

    return (
      <div className="flex items-center justify-between py-1.5 text-sm">
        <span className="text-gray-500 flex items-center gap-1.5 whitespace-nowrap">
          {icon && <span className="text-gray-400 w-4 flex justify-center">{icon}</span>}
          {label}
        </span>
        <span className="font-medium text-gray-800 text-right flex items-center gap-1.5">
          {value || "—"}
          {copyable && typeof value === "string" && value.length > 0 && (
            <button onClick={handleCopy} className="p-0.5 hover:bg-gray-100 rounded transition-colors" aria-label="Copy to clipboard">
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-gray-400" />}
            </button>
          )}
        </span>
      </div>
    );
  }
);
InfoRow.displayName = "InfoRow";

const SectionHeader = memo(
  ({ title, icon: Icon, count, isOpen, onClick }: { title: string; icon: React.ElementType; count?: number; isOpen: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-gray-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#6750A4]"
      aria-expanded={isOpen}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Icon size={16} className="text-gray-400" />
        {title}
      </span>
      <span className="flex items-center gap-2 text-gray-400">
        {count !== undefined && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">{count}</span>}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </span>
    </button>
  )
);
SectionHeader.displayName = "SectionHeader";

// ─── Main Drawer ─────────────────────────────────
export default function BookingDetailDrawer({ bookingId, onClose }: { bookingId: number; onClose: () => void }) {
  const { showToast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showConfirmCancel, setShowConfirmCancel] = useState(false); // for destructive actions
  const [showPaymentBreakdown, setShowPaymentBreakdown] = useState(false);
  const [openSections, setOpenSections] = useState({
    customer: true,
    payment: true,
    timeline: false,
    notes: false,
    attachments: false,
  });
  const drawerRef = useRef<HTMLDivElement>(null);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBookingById(bookingId);
      setBooking(res.data);
      setSelectedStatus(res.data.bookingStatus);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId, showToast]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  useEffect(() => {
    if (!loading && booking) {
      const focusable = drawerRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      focusable?.focus();
    }
  }, [loading, booking]);

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!booking || actionLoading || newStatus === booking.bookingStatus) return;

      // Destructive actions need explicit confirmation
      if ((newStatus === "cancelled" || newStatus === "no_show") && !showConfirmCancel) {
        setSelectedStatus(newStatus);
        setShowConfirmCancel(true);
        return;
      }

      setActionLoading(true);
      try {
        await updateBookingStatus(booking.id, newStatus);
        showToast("success", `Booking ${newStatus.replace(/_/g, " ")}`);
        await loadBooking(); // refreshes the whole booking
        setShowConfirmCancel(false);
      } catch (err: any) {
        showToast("error", err.message);
      } finally {
        setActionLoading(false);
      }
    },
    [booking, actionLoading, loadBooking, showToast, showConfirmCancel]
  );

  const toggleSection = useCallback((key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const formattedDate = useMemo(() => {
    if (!booking) return "";
    return new Date(booking.scheduledDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }, [booking]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col">
          <div className="p-4 space-y-4 flex-1">
            <div className="animate-pulse space-y-3">
              <div className="h-7 w-3/4 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-100 rounded-lg" />
              <div className="h-32 bg-gray-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />

      <div
        ref={drawerRef}
        className="relative w-full md:max-w-xl bg-white shadow-2xl h-full flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* ─── Header ───────────────────────────── */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#6750A4]/10 text-[#6750A4] flex items-center justify-center font-bold text-sm flex-shrink-0">
              {booking.customer.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="drawer-title" className="text-base font-semibold text-gray-900 truncate">
                  {booking.customer}
                </h2>
                <StatusChip status={booking.bookingStatus} />
                <StatusChip status={booking.paymentStatus} />
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{booking.bookingNumber}</span>
                <span className="flex items-center gap-1"><CalendarDays size={13} />{formattedDate}</span>
                <span className="flex items-center gap-1"><Clock size={13} />{booking.startTime}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
              aria-label="Close drawer"
              data-autofocus
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-center bg-gray-50 rounded-lg p-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Service</span>
              <span className="text-sm font-semibold text-gray-800 truncate">{booking.serviceCategory}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Provider</span>
              <span className="text-sm font-semibold text-gray-800 truncate">{booking.provider}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Duration</span>
              <span className="text-sm font-semibold text-gray-800">{booking.duration}m</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Total</span>
              <span className="text-sm font-bold text-[#6750A4]">ETB {booking.total}</span>
            </div>
          </div>
        </header>

        {/* ─── Scrollable content ────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {/* Customer section */}
          <section className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader title="Customer Information" icon={User} isOpen={openSections.customer} onClick={() => toggleSection("customer")} />
            {openSections.customer && (
              <div className="px-4 pb-3 pt-1 border-t border-gray-100">
                <div className="flex items-center gap-3 py-2">
                  <div className="h-10 w-10 rounded-full bg-[#6750A4]/10 text-[#6750A4] flex items-center justify-center font-bold text-sm">
                    {booking.customer.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{booking.customer}</p>
                    <p className="text-xs text-gray-500">ID: #{booking.customerId}</p>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <InfoRow label="Email" value={booking.customerEmail} icon={<Mail size={14} />} copyable />
                  <InfoRow label="Phone" value={booking.customerPhone} icon={<Phone size={14} />} copyable />
                  <InfoRow label="Address" value={booking.customerAddress} icon={<Home size={14} />} />
                  <InfoRow label="City" value={booking.customerCity} icon={<MapPin size={14} />} />
                </div>
                {booking.customerLatitude && (
                  <a
                    href={`https://maps.google.com/?q=${booking.customerLatitude},${booking.customerLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#6750A4] hover:underline mt-1"
                  >
                    <MapPin size={14} /> View on map <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}
          </section>

          {/* Payment section */}
          <section className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader title="Payment" icon={Receipt} isOpen={openSections.payment} onClick={() => toggleSection("payment")} />
            {openSections.payment && (
              <div className="px-4 pb-3 pt-1 border-t border-gray-100">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-[#6750A4]">ETB {booking.total}</span>
                </div>
                <div className="flex items-center gap-4 text-sm mb-2">
                  <StatusChip status={booking.paymentStatus} />
                  <span className="text-gray-500">{booking.paymentMethod}</span>
                </div>
                <button
                  onClick={() => setShowPaymentBreakdown(!showPaymentBreakdown)}
                  className="text-xs text-[#6750A4] hover:underline flex items-center gap-1"
                >
                  {showPaymentBreakdown ? "Hide" : "Show"} breakdown
                  {showPaymentBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showPaymentBreakdown && (
                  <div className="mt-2 space-y-0.5 bg-gray-50 rounded p-2">
                    <InfoRow label="Subtotal" value={`ETB ${booking.subtotal}`} />
                    <InfoRow label="Discount" value={`-ETB ${booking.discount}`} />
                    <InfoRow label="Tax" value={`ETB ${booking.tax}`} />
                    <InfoRow label="Platform Fee" value={`ETB ${booking.platformFee}`} />
                    <InfoRow label="Provider Earning" value={`ETB ${booking.providerEarning}`} />
                    <InfoRow label="Transaction ID" value={booking.transactionId} copyable />
                    <InfoRow label="Reference" value={booking.paymentReference} copyable />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Timeline (collapsed) */}
          <section className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              title="Timeline"
              icon={History}
              count={booking.timeline.length}
              isOpen={openSections.timeline}
              onClick={() => toggleSection("timeline")}
            />
            {openSections.timeline && (
              <div className="px-4 pb-3 pt-1 border-t border-gray-100">
                <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-gray-200">
                  {booking.timeline.map((event, idx) => {
                    const icon =
                      event.status === "completed" ? <CheckCircle size={12} className="text-emerald-500" /> :
                      event.status === "cancelled" ? <XCircle size={12} className="text-red-500" /> :
                      <div className="w-2 h-2 rounded-full bg-[#6750A4]" />;
                    return (
                      <div key={idx} className="relative flex gap-3">
                        <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize text-gray-800">{event.status.replace(/_/g, " ")}</p>
                          <p className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString()}</p>
                          {event.note && <p className="text-xs text-gray-600 mt-0.5 bg-gray-50 p-1.5 rounded">{event.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Notes (collapsed) */}
          <section className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader title="Notes" icon={StickyNote} isOpen={openSections.notes} onClick={() => toggleSection("notes")} />
            {openSections.notes && (
              <div className="px-4 pb-3 pt-1 border-t border-gray-100 grid grid-cols-1 gap-2">
                <div className="bg-amber-50 p-2 rounded border border-amber-100">
                  <p className="text-xs font-medium text-amber-800">Customer Note</p>
                  <p className="text-sm text-amber-900 mt-0.5">{booking.customerNotes || "None"}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                  <p className="text-xs font-medium text-blue-800">Provider Note</p>
                  <p className="text-sm text-blue-900 mt-0.5">{booking.providerNotes || "None"}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                  <p className="text-xs font-medium text-gray-800">Admin Note</p>
                  <p className="text-sm text-gray-900 mt-0.5">{booking.adminNotes || "None"}</p>
                </div>
              </div>
            )}
          </section>

          {/* Attachments (collapsed) */}
          <section className="border border-gray-200 rounded-lg overflow-hidden">
            <SectionHeader
              title="Attachments"
              icon={Paperclip}
              count={booking.attachments.length}
              isOpen={openSections.attachments}
              onClick={() => toggleSection("attachments")}
            />
            {openSections.attachments && (
              <div className="px-4 pb-3 pt-1 border-t border-gray-100">
                {booking.attachments.length === 0 ? (
                  <p className="text-sm text-gray-400">No attachments</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {booking.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors text-sm"
                      >
                        <FileText size={14} className="text-gray-500" />
                        File {idx + 1}
                        <ExternalLink size={12} className="text-gray-400" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="h-14" />
        </div>

        {/* ─── Footer with dropdown status change ──── */}
        <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Left side: Status dropdown */}
          <div className="flex-1 flex items-center gap-2">
            <label htmlFor="status-select" className="text-xs text-gray-500 font-medium whitespace-nowrap">
              Update status:
            </label>
            <div className="relative flex-1 min-w-[140px]">
              <select
                id="status-select"
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={actionLoading}
                className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent disabled:opacity-50 appearance-none"
              >
                {ALL_BOOKING_STATUSES.map(status => (
                  <option key={status} value={status} disabled={status === booking.bookingStatus}>
                    {status.replace(/_/g, " ")} {status === booking.bookingStatus ? "(current)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {actionLoading && <Loader2 size={16} className="animate-spin text-[#6750A4]" />}
          </div>

          {/* Right side: Print + optional cancel confirmation */}
          <div className="flex items-center gap-2">
            {showConfirmCancel && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-red-600 font-medium">Confirm cancellation?</span>
                <button
                  onClick={() => handleStatusChange(selectedStatus)}
                  disabled={actionLoading}
                  className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowConfirmCancel(false)}
                  className="px-2 py-1 rounded border border-gray-200 text-gray-700 text-xs hover:bg-gray-50 transition-colors"
                >
                  No
                </button>
              </div>
            )}
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Print booking"
              aria-label="Print"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}