import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  X, User, Calendar, Clock, Briefcase, FileText, CheckCircle,
  XCircle, AlertCircle, Loader2, PhoneCall, Building, Copy,
  Tag, CreditCard, History, RefreshCw, ShieldCheck, Banknote,
  Eye, Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ServiceBooking, BookingAction } from "../../../types";

// ─── Props (extended) ─────────────────────────────
interface ServiceBookingManageModalProps {
  booking: ServiceBooking;
  onClose: () => void;
  onStatusUpdate: (
    booking: ServiceBooking,
    status: ServiceBooking["status"]
  ) => Promise<void>;
  companyNotes: string;
  setCompanyNotes: (val: string) => void;
  finalPrice: string;
  setFinalPrice: (val: string) => void;
  allBookings?: ServiceBooking[];
  onRefresh?: () => Promise<void>;
  // Optional receipt data (for bank transfer reviews)
  receipt?: {
    id: number;
    receipt_image?: string;
    bank_name?: string;
    status: string;
    admin_notes?: string;
  } | null;
  // Callback to review a receipt (approve/reject)
  onReceiptReview?: (
    receiptId: number,
    data: { status: "approved" | "rejected"; admin_notes?: string }
  ) => Promise<void>;
}

// ─── Status config ────────────────────────────────
const STATUS_CONFIG: Record<
  ServiceBooking["status"],
  { label: string; icon: React.ReactNode; color: string; desc: string }
> = {
  pending: { label: "Pending", icon: <AlertCircle className="h-5 w-5" />, color: "bg-amber-50 text-amber-700 border-amber-200", desc: "Awaiting confirmation" },
  confirmed: { label: "Confirmed", icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-700 border-green-200", desc: "Customer accepted booking" },
  in_progress: { label: "In Progress", icon: <Loader2 className="h-5 w-5 animate-spin" />, color: "bg-blue-50 text-blue-700 border-blue-200", desc: "Service currently running" },
  completed: { label: "Completed", icon: <CheckCircle className="h-5 w-5" />, color: "bg-purple-50 text-[#6750A4] border-purple-200", desc: "Service finished successfully" },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-5 w-5" />, color: "bg-red-50 text-red-700 border-red-200", desc: "Booking has been cancelled" },
  no_show: { label: "No Show", icon: <AlertCircle className="h-5 w-5" />, color: "bg-gray-100 text-gray-600 border-gray-200", desc: "Customer did not appear" },
};

const ALLOWED_TRANSITIONS: Record<string, ServiceBooking["status"][]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// ─── Timeline builder ──────────────────────────────
const buildBookingTimeline = (booking: ServiceBooking) => {
  const events: any[] = [];
  if (booking.created_at) {
    events.push({ id: "created", label: "Booking Created", icon: "📅", time: booking.created_at, actor: booking.customer_name || "Customer", status: "completed" });
  }
  if (booking.updated_at && booking.updated_at !== booking.created_at) {
    events.push({ id: "updated", label: `Status changed to ${booking.status.replace(/_/g, " ")}`, icon: "🔄", time: booking.updated_at, actor: "System", status: "completed" });
  }
  if (booking.status === "confirmed") {
    events.push({ id: "confirmed", label: "Booking Confirmed", icon: "✅", time: booking.updated_at || booking.created_at, actor: "Admin", status: "completed" });
  }
  if (booking.status === "in_progress") {
    events.push({ id: "in_progress", label: "Service In Progress", icon: "🔧", time: booking.updated_at || booking.created_at, actor: "Provider", status: "completed" });
  }
  if (booking.status === "completed") {
    events.push({ id: "completed", label: "Service Completed", icon: "🏁", time: booking.updated_at || booking.created_at, actor: "System", status: "completed" });
  }
  if (booking.status === "pending" && !booking.updated_at) {
    events.push({ id: "pending", label: "Awaiting Confirmation", icon: "⏳", time: booking.created_at, actor: "Waiting for admin", status: "pending" });
  }
  events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  return events;
};

// ─── Sub‑components ────────────────────────────────
const StatusBadge = ({ status, large = false }: { status: string; large?: boolean }) => {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? {
    label: status, icon: <AlertCircle className="h-5 w-5" />, color: "bg-gray-50 text-gray-700 border-gray-200", desc: "",
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color} ${large ? "text-sm font-semibold" : "text-xs font-medium"}`}>
      {config.icon} {config.label}
    </span>
  );
};

const Card = ({ children, title, icon: Icon, className = "" }: { children: React.ReactNode; title: string; icon: React.ElementType; className?: string }) => (
  <motion.div variants={itemVariants} className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100/20 p-4 md:p-5 shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}>
    <div className="flex items-center gap-2 mb-3 pb-2 relative">
      <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg shadow-inner">
        <Icon className="h-4 w-4 text-[#6750A4]" />
      </div>
      <h4 className="text-sm font-bold bg-gradient-to-r from-[#6750A4] to-[#6750A4] bg-clip-text text-transparent">{title}</h4>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6750A4] via-[#6750A4] to-transparent rounded-full" />
    </div>
    {children}
  </motion.div>
);

const CopyButton = ({ text }: { text?: string }) => {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-gray-400 hover:text-[#6750A4] transition-colors p-1">
      {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value || "—"}</span>
  </div>
);

const getInitials = (name?: string) =>
  name ? name.trim().split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase() : "?";

// ─── Payment Section (mimics vendor ReceiptReviewCard) ──
const PaymentSection = ({
  paymentMethod,
  paymentStatus,
  receipt,
  onReceiptReview,
}: {
  paymentMethod: string;
  paymentStatus: string;
  receipt?: ServiceBookingManageModalProps["receipt"];
  onReceiptReview?: ServiceBookingManageModalProps["onReceiptReview"];
}) => {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(null);

  // ── Chapa ──
  if (paymentMethod === "chapa") {
    return (
      <Card title="Payment Information" icon={CreditCard} className="ring-1 ring-indigo-100">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 bg-white px-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-2 shadow-inner">
              <ShieldCheck className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Verified by</p>
            <img src="/chapa.png" alt="Chapa" className="h-8 object-contain" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Payment automatically confirmed via Chapa</p>
        </div>
      </Card>
    );
  }

  // ── Bank Transfer ──
  if (paymentMethod === "bank_transfer" || paymentMethod === "bank") {
    const canReview = receipt && !["approved", "rejected"].includes(receipt.status) && onReceiptReview;

    const handleActionClick = (action: "approved" | "rejected") => {
      setPendingAction(action);
      setShowConfirm(true);
    };

    const handleConfirm = async () => {
      if (!pendingAction || !receipt || !onReceiptReview) return;
      setShowConfirm(false);
      setSubmitting(true);
      try {
        await onReceiptReview(receipt.id, { status: pendingAction, admin_notes: notes || undefined });
        setNotes("");
        setPendingAction(null);
      } catch {
        // error handling handled by parent
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Card title="Payment" icon={Banknote}>
        <div className="space-y-3">
          {/* Bank details */}
          <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-xl border border-purple-100">
            <p className="text-[10px] text-[#6750A4] font-bold uppercase tracking-widest mb-1">Bank Details</p>
            <p className="font-semibold text-sm text-gray-900">{receipt?.bank_name || "Not Specified"}</p>
          </div>

          {/* Receipt image */}
          {receipt?.receipt_image && (
            <div
              onClick={() => setPreviewImage(receipt.receipt_image)}
              className="relative w-full h-28 rounded-xl overflow-hidden border cursor-zoom-in group"
            >
              <img src={receipt.receipt_image} alt="Receipt" className="w-full h-full object-cover group-hover:scale-105 transition" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
          )}

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Status:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
              paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {paymentStatus === "paid" ? "Confirmed" : "Pending Verification"}
            </span>
          </div>

          {/* Review actions (only if receipt not yet reviewed) */}
          {canReview && (
            <div className="pt-2 space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add review notes..."
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#6750A4]/30 transition resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleActionClick("approved")}
                  disabled={submitting}
                  className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition disabled:opacity-50"
                >
                  {submitting && pendingAction === "approved" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                </button>
                <button
                  onClick={() => handleActionClick("rejected")}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-md hover:from-rose-600 hover:to-red-700 transition disabled:opacity-50"
                >
                  {submitting && pendingAction === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                </button>
              </div>
            </div>
          )}

          {/* Confirmation modal */}
          {showConfirm && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <p className="text-sm font-semibold mb-4">Confirm {pendingAction === "approved" ? "approval" : "rejection"}?</p>
                <p className="text-xs text-gray-500 mb-4">This will notify the customer.</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className={`px-4 py-2 text-sm text-white rounded-xl ${pendingAction === "approved" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"} disabled:opacity-50`}
                  >
                    {submitting ? "Processing..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen image preview */}
        {previewImage && (
          <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setPreviewImage(null)} className="absolute top-3 right-3 bg-white rounded-full p-2 shadow"><X className="h-5 w-5" /></button>
              <img src={previewImage} alt="Receipt" className="max-h-[90vh] rounded-xl" />
            </div>
          </div>
        )}
      </Card>
    );
  }

  // ── Cash / other ──
  return (
    <Card title="Payment" icon={CreditCard}>
      <div className="space-y-2">
        <InfoRow label="Method" value={paymentMethod} />
        <InfoRow label="Status" value={paymentStatus} />
      </div>
    </Card>
  );
};

// ─── Main Component ────────────────────────────────
export function ServiceBookingManageModal({
  booking: initialBooking,
  onClose,
  onStatusUpdate,
  companyNotes,
  setCompanyNotes,
  finalPrice,
  setFinalPrice,
  allBookings = [],
  onRefresh,
  receipt = null,
  onReceiptReview,
}: ServiceBookingManageModalProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BookingAction | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const allowedActions: BookingAction[] = useMemo(() => {
    const statusToAction: Record<string, BookingAction> = {
      confirmed: "confirm", in_progress: "start", completed: "complete",
      cancelled: "cancel", no_show: "no_show",
    };
    return (ALLOWED_TRANSITIONS[initialBooking.status] || [])
      .map(s => statusToAction[s]).filter(Boolean) as BookingAction[];
  }, [initialBooking.status]);

  const customer = initialBooking.customer_name || "Unknown";
  const customerPhone = initialBooking.customer_phone;
  const company = initialBooking.company;
  const offering = initialBooking.offering;
  const staff = initialBooking.assigned_staff;
  const paymentStatus = initialBooking.payment_status || "-";
  const paymentMethod = initialBooking.payment_method || "cash";
  const intakeData = initialBooking.intake_data || {};

  const timeline = buildBookingTimeline(initialBooking);

  const previousBookings = useMemo(() => {
    if (!allBookings.length || !customerPhone || !company?.id) return [];
    return allBookings
      .filter(b => b.customer_phone === customerPhone && b.company?.id === company.id && b.id !== initialBooking.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [allBookings, customerPhone, company?.id, initialBooking.id]);

  const handleAction = useCallback(async (action: BookingAction) => {
    const destructive: BookingAction[] = ["cancel", "no_show"];
    if (destructive.includes(action)) {
      setConfirmAction(action);
      return;
    }
    setActionLoading(true);
    try {
      const statusMap: Record<BookingAction, ServiceBooking["status"]> = {
        confirm: "confirmed", start: "in_progress", complete: "completed",
        cancel: "cancelled", no_show: "no_show",
      };
      await onStatusUpdate(initialBooking, statusMap[action]);
    } finally { setActionLoading(false); }
  }, [onStatusUpdate, initialBooking]);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const statusMap: Record<BookingAction, ServiceBooking["status"]> = {
        confirm: "confirmed", start: "in_progress", complete: "completed",
        cancel: "cancelled", no_show: "no_show",
      };
      await onStatusUpdate(initialBooking, statusMap[confirmAction]);
    } finally { setActionLoading(false); setConfirmAction(null); }
  }, [confirmAction, onStatusUpdate, initialBooking]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? "" : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div ref={modalRef} variants={containerVariants} initial="hidden" animate="visible" exit="hidden"
        className="relative bg-gradient-to-br from-white via-white to-gray-50/50 w-full max-w-7xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-[#6750A4]/10 backdrop-blur-md border-b border-[#6750A4]/15 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex justify-between items-start gap-2">
            <div className="mt-1.5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-base sm:text-2xl font-black bg-gradient-to-r from-[#6750A4] to-[#6750A4] bg-clip-text text-transparent tracking-tight">Booking #{initialBooking.id}</h2>
                <StatusBadge status={initialBooking.status} large />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[9px] sm:text-xs font-bold">
                <span className="flex items-center gap-1.5 sm:gap-2 bg-[#6750A4]/10 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full border border-[#6750A4]/20 shadow-sm">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#6750A4]" />
                  <span className="font-mono text-[10px] sm:text-[12px] font-semibold text-gray-700">
                    {initialBooking.scheduled_date} <span className="text-[#6750A4] mx-0.5">•</span> {String(initialBooking.scheduled_time).slice(0, 5)}
                  </span>
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5 text-gray-600">
                  <Building className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#6750A4]" /> <span className="font-medium text-[10px] sm:text-sm">{company?.name}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={async () => { setRefreshing(true); try { if (onRefresh) await onRefresh(); } finally { setRefreshing(false); } }} disabled={refreshing}
                className="group flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 transition disabled:opacity-60 shadow-sm">
                {refreshing ? <Loader2 className="h-4 w-4 text-[#6750A4] animate-spin" /> : <RefreshCw className="h-4 w-4 text-gray-500 group-hover:text-[#6750A4]" />}
              </button>
              <button onClick={onClose} className="p-2 sm:p-3 rounded-xl bg-white border shadow-sm hover:bg-rose-50 hover:border-rose-200 transition">
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card title="Customer" icon={User}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-[#6750A4] font-bold border border-purple-100 shadow-inner">{getInitials(customer)}</div>
                  <div>
                    <p className="font-bold text-gray-900">{customer}</p>
                    <div className="flex items-center gap-2 mt-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-sm">
                      <PhoneCall className="h-3.5 w-3.5" /><span>{customerPhone}</span><CopyButton text={customerPhone} />
                    </div>
                  </div>
                </div>
              </Card>
              <Card title="Company" icon={Building}>
                <div className="flex items-center gap-3">
                  {company?.logo && <img src={company.logo} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />}
                  <div>
                    <p className="font-bold text-gray-900">{company?.name}</p>
                    {company?.sub_category_name && <p className="text-xs text-gray-500">{company.sub_category_name}</p>}
                  </div>
                </div>
              </Card>
            </div>
            {offering && (
              <Card title="Service" icon={Briefcase}>
                <div className="flex gap-4">
                  {offering.primary_image && <img src={offering.primary_image} className="w-20 h-20 rounded-xl object-cover border shadow-sm" />}
                  <div>
                    <p className="font-bold text-gray-900">{offering.title}</p>
                    <p className="text-sm text-gray-500">{offering.service_category || "Uncategorized"}</p>
                    <div className="flex gap-3 mt-2 text-xs"><span className="bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1"><Clock className="h-3 w-3" /> {offering.duration_minutes} min</span></div>
                  </div>
                </div>
              </Card>
            )}
            {/* Timeline */}
            {timeline.length > 0 && (
              <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <div className="p-1.5 bg-gradient-to-br from-[#6750A4]/20 to-[#6750A4]/20 rounded-lg shadow-inner"><History className="h-4 w-4 text-[#6750A4]" /></div>
                  <h4 className="text-sm font-bold bg-gradient-to-r from-[#6750A4] to-[#6750A4] bg-clip-text text-transparent">Booking Timeline</h4>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{timeline.length} steps</span>
                </div>
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                  {timeline.map((entry, idx) => (
                    <div key={entry.id} className="relative flex items-start gap-4">
                      <div className={`absolute left-[-20px] top-1 w-4 h-4 rounded-full border-2 ${entry.status === "completed" ? "bg-emerald-500 border-emerald-500" : "bg-amber-500 border-amber-500 animate-pulse"}`} />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-gray-900">{entry.icon} {entry.label}</span></div>
                        <div className="flex flex-wrap items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400 font-mono">{new Date(entry.time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {new Date(entry.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                          {entry.actor && <span className="text-xs text-gray-500 flex items-center gap-1"><User className="h-3 w-3" />{entry.actor}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Intake */}
            {Object.keys(intakeData).length > 0 && (
              <Card title="Intake Responses" icon={FileText}>
                <div className="divide-y divide-gray-100">
                  {Object.entries(intakeData).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 text-sm"><span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</span><span className="font-medium text-gray-800">{String(value)}</span></div>
                  ))}
                </div>
              </Card>
            )}
            {/* Booking History */}
            {previousBookings.length > 0 && (
              <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <div className="p-1.5 bg-gradient-to-br from-[#6750A4]/20 to-[#6750A4]/20 rounded-lg shadow-inner"><History className="h-4 w-4 text-[#6750A4]" /></div>
                  <h4 className="text-sm font-bold bg-gradient-to-r from-[#6750A4] to-[#6750A4] bg-clip-text text-transparent">Customer Booking History</h4>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{previousBookings.length} bookings</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {previousBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-[#6750A4]/30 transition cursor-pointer group">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-[#6750A4]">#{b.id}</span>
                        {b.company?.name && <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{b.company.name}</span>}
                        <span className="text-[10px] text-gray-400 font-mono">{new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-3"><StatusBadge status={b.status} /><span className="text-xs text-[#6750A4] opacity-0 group-hover:opacity-100 transition">View →</span></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            <motion.div variants={itemVariants} className="bg-[#6750A4] rounded-[32px] p-5 text-white shadow-2xl shadow-purple-200 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md"><Tag className="h-5 w-5" /></div>
                  <div className="text-right"><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Quoted Price</p><h3 className="text-2xl font-black">{formatCurrency(initialBooking.quoted_price)} {initialBooking.currency}</h3></div>
                </div>
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="flex justify-between text-xs font-bold"><span className="opacity-60">Final Price</span><span>{finalPrice ? `${formatCurrency(finalPrice)} ${initialBooking.currency}` : "—"}</span></div>
                </div>
              </div>
            </motion.div>

            {/* Payment Section (replaces the old Card) */}
            <PaymentSection
              paymentMethod={paymentMethod}
              paymentStatus={paymentStatus}
              receipt={receipt}
              onReceiptReview={onReceiptReview}
            />

            {staff && (
              <Card title="Assigned Staff" icon={User}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-[#6750A4] font-bold border border-purple-100 shadow-inner">{getInitials(staff.full_name || staff.username)}</div>
                  <div><p className="font-semibold text-gray-800">{staff.full_name || staff.username}</p><p className="text-xs text-gray-500">{staff.specialization || "Staff"}</p></div>
                </div>
              </Card>
            )}

            <Card title="Management" icon={FileText}>
              <div className="space-y-3">
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Company Notes</label><textarea value={companyNotes} onChange={(e) => setCompanyNotes(e.target.value)} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-[#6750A4]/30 outline-none resize-none" /></div>
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Final Price ({initialBooking.currency})</label><input type="number" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-[#6750A4]/30 outline-none" /></div>
              </div>
            </Card>

            <Card title="Update Status" icon={AlertCircle}>
              <div className="flex flex-wrap gap-2">
                {allowedActions.map((action) => (
                  <motion.button key={action} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleAction(action)} disabled={actionLoading}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${["cancel", "no_show"].includes(action) ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100" : action === "complete" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-purple-50 text-[#6750A4] border border-purple-200 hover:bg-purple-100"}`}>
                    {action === "confirm" && <CheckCircle className="h-4 w-4" />}{action === "start" && <Loader2 className="h-4 w-4" />}{action === "complete" && <CheckCircle className="h-4 w-4" />}{action === "cancel" && <XCircle className="h-4 w-4" />}{action === "no_show" && <AlertCircle className="h-4 w-4" />}{action.replace(/_/g, " ")}
                  </motion.button>
                ))}
                {allowedActions.length === 0 && <p className="text-sm text-gray-400">No actions available</p>}
              </div>
              {actionLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto mt-3 text-[#6750A4]" />}
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Confirm destructive action */}
      {confirmAction && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-6"><div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><AlertCircle className="h-6 w-6 text-red-600" /></div><h3 className="text-xl font-bold">{confirmAction === "cancel" ? "Cancel Booking" : "Mark as No Show"}</h3></div>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone. The customer will be notified.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border rounded-xl hover:bg-gray-50">Keep Booking</button>
              <button onClick={handleConfirmAction} disabled={actionLoading} className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Confirm {confirmAction.replace(/_/g, " ")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}