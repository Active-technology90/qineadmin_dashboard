// src/components/admin/service-management/BookingDetailModal.tsx
import React, { useState, useEffect } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  
  MapPin,
  
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  FileText,
  Tag,
  User,
  Building,
  Scissors,

  CheckCircle,
  XCircle,

  Download,
  Printer,
  MessageSquare,
} from "lucide-react";
import type { Booking } from "../../../mock/serviceApi";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { getBookingById, updateBookingStatus } from "../../../mock/serviceApi";

// ─── Helper sub‑components ─────────────────

const StatusBadge = ({
  status,
  paymentStatus,
}: {
  status: Booking["bookingStatus"];
  paymentStatus: Booking["paymentStatus"];
}) => {
  const bookingColors = {
    pending: "bg-yellow-50 text-yellow-700",
    confirmed: "bg-blue-50 text-blue-700",
    in_progress: "bg-purple-50 text-purple-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
    no_show: "bg-gray-50 text-gray-700",
  };

  const paymentColors = {
    pending: "bg-yellow-50 text-yellow-700",
    paid: "bg-emerald-50 text-emerald-700",
    refunded: "bg-red-50 text-red-700",
    partial_refund: "bg-orange-50 text-orange-700",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bookingColors[status]}`}
      >
        {status === "completed" ? <CheckCircle size={14} /> : status === "cancelled" ? <XCircle size={14} /> : null}
        {status.replace("_", " ")}
      </span>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${paymentColors[paymentStatus]}`}
      >
        {paymentStatus.replace("_", " ")}
      </span>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
      {icon}
      {label}
    </div>
    <p className="text-lg font-bold text-gray-800">{value}</p>
  </div>
);

const CollapsibleSection = ({
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 overflow-hidden">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full p-4 bg-white hover:bg-gray-50 transition"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        {icon}
        {title}
      </div>
      {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
    </button>
    {open && <div className="p-4 border-t bg-white">{children}</div>}
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-800 text-right">{value || "—"}</span>
  </div>
);

// ─── Main Component ───────────────

export default function BookingDetailModal({
  bookingId,
  onClose,
}: {
  bookingId: number;
  onClose: () => void;
}) {
  const { toast, showToast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState({
    customer: true,
    provider: true,
    service: true,
    timeline: true,
    notes: true,
    attachments: true,
  });

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    setLoading(true);
    try {
      const res = await getBookingById(bookingId);
      setBooking(res.data);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!booking) return;
    try {
      await updateBookingStatus(booking.id, status);
      showToast("success", `Booking ${status}`);
      loadBooking();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="animate-spin h-8 w-8 border-4 border-secondary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <Toast toast={toast} />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-secondary/5 to-white shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {booking.bookingNumber}
            </h2>
            <p className="text-sm text-gray-500">
              Invoice #{booking.invoiceNumber} • {new Date(booking.scheduledDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.bookingStatus} paymentStatus={booking.paymentStatus} />
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total" value={`ETB ${booking.total}`} icon={<DollarSign size={18} />} />
            <StatCard label="Duration" value={`${booking.duration} min`} icon={<Clock size={18} />} />
            <StatCard label="Payment" value={booking.paymentStatus.replace("_", " ")} icon={<CreditCard size={18} />} />
            <StatCard label="Source" value={booking.bookingSource} icon={<Tag size={18} />} />
          </div>

          {/* Customer Section */}
          <CollapsibleSection
            title="Customer Information"
            icon={<User size={18} />}
            open={sections.customer}
            onToggle={() => setSections((prev) => ({ ...prev, customer: !prev.customer }))}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={booking.customerAvatar}
                  className="h-14 w-14 rounded-2xl object-cover shadow-inner"
                  alt=""
                />
                <div>
                  <p className="font-semibold text-gray-800">{booking.customer}</p>
                  <p className="text-sm text-gray-500">ID: #{booking.customerId}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <InfoRow label="Email" value={booking.customerEmail} />
                <InfoRow label="Phone" value={booking.customerPhone} />
                <InfoRow label="Address" value={booking.customerAddress} />
                <InfoRow label="City" value={booking.customerCity} />
              </div>
              {booking.customerLatitude && (
                <a
                  href={`https://maps.google.com/?q=${booking.customerLatitude},${booking.customerLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <MapPin size={14} /> View on map
                </a>
              )}
            </div>
          </CollapsibleSection>

          {/* Provider Section */}
          <CollapsibleSection
            title="Provider Information"
            icon={<Building size={18} />}
            open={sections.provider}
            onToggle={() => setSections((prev) => ({ ...prev, provider: !prev.provider }))}
          >
            <div className="space-y-2">
              <InfoRow label="Business Name" value={booking.provider} />
              <InfoRow label="Provider ID" value={`#${booking.providerId}`} />
            </div>
          </CollapsibleSection>

          {/* Service Section */}
          <CollapsibleSection
            title="Service Details"
            icon={<Scissors size={18} />}
            open={sections.service}
            onToggle={() => setSections((prev) => ({ ...prev, service: !prev.service }))}
          >
            <div className="space-y-2">
              <InfoRow label="Category" value={booking.serviceCategory} />
              <InfoRow label="Group" value={booking.serviceGroup} />
              <InfoRow label="Service" value={booking.serviceCategory} />
              <InfoRow label="Duration" value={`${booking.duration} min`} />
              <InfoRow label="Start Time" value={booking.startTime} />
              <InfoRow label="End Time" value={booking.endTime} />
              <div className="pt-2 border-t">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm font-medium">ETB {booking.subtotal}</span>
                </div>
                {booking.discount > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-500">Discount</span>
                    <span className="text-sm font-medium text-red-500">-ETB {booking.discount}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-500">Tax</span>
                  <span className="text-sm font-medium">ETB {booking.tax}</span>
                </div>
                <div className="flex justify-between py-1 font-semibold">
                  <span className="text-sm">Total</span>
                  <span className="text-sm">ETB {booking.total}</span>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Timeline */}
          <CollapsibleSection
            title="Timeline"
            icon={<Calendar size={18} />}
            open={sections.timeline}
            onToggle={() => setSections((prev) => ({ ...prev, timeline: !prev.timeline }))}
          >
            <div className="space-y-3">
              {booking.timeline.map((event, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <div className="text-gray-400 w-24 text-right">{new Date(event.timestamp).toLocaleString()}</div>
                  <div className="flex-1">{event.status.replace(/_/g, " ")}</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Notes */}
          <CollapsibleSection
            title="Notes"
            icon={<MessageSquare size={18} />}
            open={sections.notes}
            onToggle={() => setSections((prev) => ({ ...prev, notes: !prev.notes }))}
          >
            <div className="space-y-3">
              <div className="bg-yellow-50 p-3 rounded-xl">
                <p className="text-xs font-medium text-yellow-800">Customer Notes</p>
                <p className="text-sm text-yellow-900">{booking.customerNotes || "—"}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <p className="text-xs font-medium text-blue-800">Provider Notes</p>
                <p className="text-sm text-blue-900">{booking.providerNotes || "—"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs font-medium text-gray-800">Admin Notes</p>
                <p className="text-sm text-gray-900">{booking.adminNotes || "—"}</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Attachments */}
          <CollapsibleSection
            title="Attachments"
            icon={<FileText size={18} />}
            open={sections.attachments}
            onToggle={() => setSections((prev) => ({ ...prev, attachments: !prev.attachments }))}
          >
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
                    className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
                  >
                    <Download size={14} /> File {idx + 1}
                  </a>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </div>

        {/* Footer Actions */}
        <div className="border-t p-4 flex flex-wrap gap-2 justify-end shrink-0">
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <Printer size={16} /> Print
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <Download size={16} /> Export
          </button>
          {booking.bookingStatus !== "completed" && booking.bookingStatus !== "cancelled" && (
            <button
              onClick={() => handleStatusChange("completed")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition"
            >
              <CheckCircle size={16} /> Mark Completed
            </button>
          )}
          {booking.bookingStatus !== "cancelled" && (
            <button
              onClick={() => handleStatusChange("cancelled")}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
            >
              <XCircle size={16} /> Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}