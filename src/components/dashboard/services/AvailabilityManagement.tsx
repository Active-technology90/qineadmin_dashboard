import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Repeat,
  CalendarOff,
  Calendar,
  Users,
  X,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useAvailability } from "../../../hooks/useAvailability";
import {
  getManageBlackouts,
  createBlackoutDate,
  deleteBlackoutDate,
} from "../../../services/api";
import { CompanySelector } from "../company-products/CompanySelector";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { Toast } from "../../ui/Toast";
import { extractErrorMessage } from "../../../utils/extractErrorMessage";

// import { validateBlackout } from "../../../validators/blackoutValidator";
// import type { ValidationResult } from "../../../validators/types";
import type { AvailabilitySlot } from "../../../types";
import { validateAvailabilitySlot } from "../../../utils/availabilityValidator";
import { validateBlackout } from "../../../utils/blackoutValidator";
import type { ValidationResult } from "../../../types/validation";


// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------
const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

// ---------------------------------------------------------------------------
//  Local Types
// ---------------------------------------------------------------------------
interface Blackout {
  id: number;
  title: string;
  date: string;
  is_full_day: boolean;
  start_time?: string;
  end_time?: string;
}

// ---------------------------------------------------------------------------
//  Sub‑components
// ---------------------------------------------------------------------------
const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 transition-shadow hover:shadow-md"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </motion.div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-3 bg-gray-200 rounded w-20 mt-2"></div>
  </div>
);

const DayCard = ({
  day,
  slots,
  onAddClick,
  onEditSlot,
  onDeleteSlot,
  formatTime,
}: {
  day: number;
  slots: AvailabilitySlot[];
  onAddClick: (day: number) => void;
  onEditSlot: (slot: AvailabilitySlot) => void;
  onDeleteSlot: (slot: AvailabilitySlot) => void;
  formatTime: (time: string) => string;
}) => {
  const dayInfo = DAYS.find((d) => d.value === day) ?? { value: day, label: "Unknown" };
  const hasSlots = slots.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md flex flex-col ${
        hasSlots ? "border-gray-100" : "border-gray-200 opacity-70"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm">
            {dayInfo.label.slice(0, 2)}
          </div>
          <h4 className="text-lg font-semibold text-gray-900">{dayInfo.label}</h4>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            hasSlots
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-gray-50 text-gray-500 border-gray-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              hasSlots ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          {hasSlots ? "Open" : "Closed"}
        </span>
      </div>

      {hasSlots ? (
        <div className="space-y-3 flex-1">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-start justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {formatTime(slot.start_time)} → {formatTime(slot.end_time)}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    Max {slot.max_bookings} booking{slot.max_bookings !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditSlot(slot)}
                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg p-1 transition"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteSlot(slot)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mt-2 italic">No availability</p>
      )}

      <button
        onClick={() => onAddClick(day)}
        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
      >
        <Plus className="h-4 w-4" />
        {hasSlots ? "Add time slot" : "Add Availability"}
      </button>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
//  Slot Form Modal (Add / Edit) – with field‑level validation
// ---------------------------------------------------------------------------
const SlotFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingSlots,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    max_bookings: number;
    id?: number;
  }) => Promise<void>;
  initialData?: AvailabilitySlot;
  existingSlots: AvailabilitySlot[];
}) => {
  const [form, setForm] = useState({
    day_of_week: initialData?.day_of_week ?? 0,
    start_time: initialData?.start_time ?? "09:00",
    end_time: initialData?.end_time ?? "17:00",
    max_bookings: initialData?.max_bookings ?? 1,
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isEdit = !!initialData;

  useEffect(() => {
    if (isOpen) {
      setForm({
        day_of_week: initialData?.day_of_week ?? 0,
        start_time: initialData?.start_time ?? "09:00",
        end_time: initialData?.end_time ?? "17:00",
        max_bookings: initialData?.max_bookings ?? 1,
      });
      setFieldErrors({});
      setLoading(false);
    }
  }, [isOpen, initialData]);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

 const validate = (): boolean => {
  const result: ValidationResult = validateAvailabilitySlot(
    { ...form, id: initialData?.id },
    existingSlots.map((s) => ({
      id: s.id,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
    }))
  );
  setFieldErrors(result.errors);
  return result.isValid;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ ...form, id: initialData?.id });
      onClose();
    } catch (err: any) {
      const msg = extractErrorMessage(err, "Failed to save slot");
      setFieldErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-secondary">
            {isEdit ? "Edit Availability Slot" : "Add Availability Slot"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {fieldErrors.general && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
            <AlertTriangle className="h-4 w-4" />
            {fieldErrors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select
              value={form.day_of_week}
              onChange={(e) => handleChange("day_of_week", Number(e.target.value))}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-secondary/20 ${
                fieldErrors.day_of_week
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-secondary"
              }`}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            {fieldErrors.day_of_week && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.day_of_week}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => handleChange("start_time", e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-secondary/20 ${
                  fieldErrors.start_time
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-secondary"
                }`}
              />
              {fieldErrors.start_time && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.start_time}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => handleChange("end_time", e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-secondary/20 ${
                  fieldErrors.end_time
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-secondary"
                }`}
              />
              {fieldErrors.end_time && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.end_time}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Bookings</label>
            <input
              type="number"
              min={1}
              value={form.max_bookings}
              onChange={(e) => handleChange("max_bookings", Number(e.target.value))}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-secondary/20 ${
                fieldErrors.max_bookings
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-secondary"
              }`}
            />
            {fieldErrors.max_bookings && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.max_bookings}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-purple-800 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {isEdit ? "Update Slot" : "Save Slot"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ---------------------------------------------------------------------------
//  Main Component
// ---------------------------------------------------------------------------
export default function AvailabilityManagement() {
  // ---------- Hooks ----------
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

  const { slots, loading: slotsLoading, create, update, remove } = useAvailability(
    isServiceCompany ? companySlug : null,
  );

  // Blackouts state
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [blackoutLoading, setBlackoutLoading] = useState(false);
  const [blackoutSubmitting, setBlackoutSubmitting] = useState(false);
  const [blackoutErrors, setBlackoutErrors] = useState<Record<string, string>>({});

  const [blackoutForm, setBlackoutForm] = useState({
    title: "Public Holiday",
    date: "",
    is_full_day: true,
    start_time: "09:00",
    end_time: "17:00",
  });

  const [blackoutDeleteTarget, setBlackoutDeleteTarget] = useState<number | null>(null);

  // Slot modal (add/edit) state
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | undefined>(undefined);
  const [slotModalDay, setSlotModalDay] = useState<number | undefined>(undefined);

  // Delete target & toast
  const [deleteTarget, setDeleteTarget] = useState<AvailabilitySlot | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Fetch blackouts
  const fetchBlackouts = useCallback(async () => {
    if (!companySlug || !isServiceCompany) return;
    try {
      setBlackoutLoading(true);
      const res = await getManageBlackouts(companySlug);
      setBlackouts((res.data || []) as Blackout[]);
    } catch {
      // ignore
    } finally {
      setBlackoutLoading(false);
    }
  }, [companySlug, isServiceCompany]);

  useEffect(() => {
    fetchBlackouts();
  }, [fetchBlackouts]);

  // Group slots
  const groupedSlots = useMemo(() => {
    return slots.reduce(
      (acc, slot) => {
        acc[slot.day_of_week] = [...(acc[slot.day_of_week] || []), slot].sort(
          (a, b) => a.start_time.localeCompare(b.start_time),
        );
        return acc;
      },
      {} as Record<number, AvailabilitySlot[]>,
    );
  }, [slots]);

  // Summary stats
  const summary = useMemo(() => {
    const workingDays = Object.keys(groupedSlots).length;
    const totalSlots = slots.length;
    const weeklyHours = slots.reduce((sum, slot) => {
      const [sh, sm] = slot.start_time.split(":").map(Number);
      const [eh, em] = slot.end_time.split(":").map(Number);
      const hours = eh - sh + (em - sm) / 60;
      return sum + hours;
    }, 0).toFixed(1);
    const maxDaily = Math.max(...slots.map((s) => s.max_bookings), 0);
    const blockedDates = blackouts.length;
    return { workingDays, totalSlots, weeklyHours, maxDaily, blockedDates };
  }, [groupedSlots, slots, blackouts]);

  const formatTime = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  // ---------- Early returns ----------
  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies.length ? serviceCompanies : companies}
        isLoading={isLoadingCompanies}
        title="Availability"
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
        Select a service company to manage availability.
      </div>
    );
  }

  // ---------- Handlers ----------
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSlot = async (data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    max_bookings: number;
    id?: number;
  }) => {
    if (data.id) {
      await update(data.id, { ...data, is_active: true });
      showToast("success", "Slot updated");
    } else {
      await create({ ...data, is_active: true });
      showToast("success", "Slot added");
    }
  };

  const openAddModalForDay = (day: number) => {
    setEditingSlot(undefined);
    setSlotModalDay(day);
    setIsSlotModalOpen(true);
  };

  const openEditModal = (slot: AvailabilitySlot) => {
    setEditingSlot(slot);
    setSlotModalDay(undefined);
    setIsSlotModalOpen(true);
  };

  const closeSlotModal = () => {
    setIsSlotModalOpen(false);
    setEditingSlot(undefined);
    setSlotModalDay(undefined);
  };

  const handleDeleteSlot = (slot: AvailabilitySlot) => {
    setDeleteTarget(slot);
  };

  const confirmDeleteSlot = async () => {
    if (deleteTarget) {
      try {
        await remove(deleteTarget.id);
        showToast("success", "Slot removed");
      } catch (err: any) {
        showToast("error", extractErrorMessage(err, "Failed to remove slot"));
      } finally {
        setDeleteTarget(null);
      }
    }
  };

  const handleBlackoutFormChange = (field: string, value: string | boolean) => {
    setBlackoutForm((prev) => ({ ...prev, [field]: value }));
    if (blackoutErrors[field]) {
      setBlackoutErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCreateBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySlug) return;

    // Validate with our reusable function
    const result = validateBlackout(
      { ...blackoutForm },
      blackouts.map((b) => ({
        id: b.id,
        date: b.date,
        is_full_day: b.is_full_day,
        start_time: b.start_time,
        end_time: b.end_time,
      }))
    );
    setBlackoutErrors(result.errors);
    if (!result.isValid) return;

    setBlackoutSubmitting(true);
    try {
      const payload: any = {
        title: blackoutForm.title,
        date: blackoutForm.date,
        is_full_day: blackoutForm.is_full_day,
      };
      if (!blackoutForm.is_full_day) {
        payload.start_time = blackoutForm.start_time;
        payload.end_time = blackoutForm.end_time;
      }
      await createBlackoutDate(companySlug, payload);
      showToast("success", "Blackout added");
      setBlackoutForm({
        title: "Public Holiday",
        date: "",
        is_full_day: true,
        start_time: "09:00",
        end_time: "17:00",
      });
      setBlackoutErrors({});
      fetchBlackouts();
    } catch (err: any) {
      showToast("error", extractErrorMessage(err, "Failed to add blackout"));
    } finally {
      setBlackoutSubmitting(false);
    }
  };

  const handleDeleteBlackout = async (id: number) => {
    if (!companySlug) return;
    try {
      await deleteBlackoutDate(companySlug, id);
      showToast("success", "Blackout removed");
      fetchBlackouts();
    } catch (err: any) {
      showToast("error", extractErrorMessage(err, "Failed to remove blackout"));
    }
  };

  // ---------- Render ----------
  return (
    <>
      <Toast toast={toast} />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${DAYS.find((d) => d.value === deleteTarget?.day_of_week)?.label || ""} slot?`}
        onConfirm={confirmDeleteSlot}
        onCancel={() => setDeleteTarget(null)}
      />

      <DeleteConfirmModal
        isOpen={blackoutDeleteTarget !== null}
        title="Delete blackout date?"
        onConfirm={() => {
          if (blackoutDeleteTarget !== null) {
            handleDeleteBlackout(blackoutDeleteTarget);
            setBlackoutDeleteTarget(null);
          }
        }}
        onCancel={() => setBlackoutDeleteTarget(null)}
      />

      <SlotFormModal
        isOpen={isSlotModalOpen}
        onClose={closeSlotModal}
        onSubmit={handleSaveSlot}
        initialData={editingSlot}
        existingSlots={slots}
      />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary">
              Availability Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure booking schedules for {company?.name}
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={clearCompany}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-secondary border border-secondary rounded-xl hover:bg-purple-50 transition"
            >
              <Repeat className="h-4 w-4" />
              Switch Company
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Calendar} label="Working Days" value={summary.workingDays} color="bg-purple-600" />
          <StatCard icon={Clock} label="Total Slots" value={summary.totalSlots} color="bg-blue-600" />
          <StatCard icon={Users} label="Max Bookings / Slot" value={summary.maxDaily} color="bg-emerald-600" />
          <StatCard icon={Calendar} label="Weekly Hours" value={`${summary.weeklyHours}h`} color="bg-indigo-600" />
          <StatCard icon={CalendarOff} label="Blocked Dates" value={summary.blockedDates} color="bg-amber-600" />
        </div>

        {/* Weekly Schedule */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
              <p className="text-sm text-gray-500">Manage your weekly availability</p>
            </div>
            <button
              onClick={() => {
                setEditingSlot(undefined);
                setSlotModalDay(undefined);
                setIsSlotModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-purple-800 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Availability
            </button>
          </div>

          {slotsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DAYS.map((day) => (
                <DayCard
                  key={day.value}
                  day={day.value}
                  slots={groupedSlots[day.value] || []}
                  onAddClick={openAddModalForDay}
                  onEditSlot={openEditModal}
                  onDeleteSlot={handleDeleteSlot}
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}
        </section>

        {/* Blackout / Holiday Closures */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Holiday Closures</h2>
              <p className="text-sm text-gray-500">Block specific dates for holidays or events</p>
            </div>
          </div>

          <form
            onSubmit={handleCreateBlackout}
            className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
              <input
                type="text"
                placeholder="e.g. Ethiopian New Year"
                value={blackoutForm.title}
                onChange={(e) => handleBlackoutFormChange("title", e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20 ${
                  blackoutErrors.title
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-amber-500"
                }`}
              />
              {blackoutErrors.title && (
                <p className="text-red-600 text-xs mt-1">{blackoutErrors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={blackoutForm.date}
                onChange={(e) => handleBlackoutFormChange("date", e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20 ${
                  blackoutErrors.date
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-amber-500"
                }`}
              />
              {blackoutErrors.date && (
                <p className="text-red-600 text-xs mt-1">{blackoutErrors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={blackoutForm.is_full_day ? "full" : "partial"}
                onChange={(e) => handleBlackoutFormChange("is_full_day", e.target.value === "full")}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20 ${
                  blackoutErrors.is_full_day
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-amber-500"
                }`}
              >
                <option value="full">Full day</option>
                <option value="partial">Partial hours</option>
              </select>
            </div>
            {!blackoutForm.is_full_day && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                  <input
                    type="time"
                    value={blackoutForm.start_time}
                    onChange={(e) => handleBlackoutFormChange("start_time", e.target.value)}
                    className={`w-full rounded-xl border px-2 py-2 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20 ${
                      blackoutErrors.start_time
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-amber-500"
                    }`}
                  />
                  {blackoutErrors.start_time && (
                    <p className="text-red-600 text-xs mt-1">{blackoutErrors.start_time}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                  <input
                    type="time"
                    value={blackoutForm.end_time}
                    onChange={(e) => handleBlackoutFormChange("end_time", e.target.value)}
                    className={`w-full rounded-xl border px-2 py-2 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20 ${
                      blackoutErrors.end_time
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-amber-500"
                    }`}
                  />
                  {blackoutErrors.end_time && (
                    <p className="text-red-600 text-xs mt-1">{blackoutErrors.end_time}</p>
                  )}
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={blackoutSubmitting}
              className="w-full py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {blackoutSubmitting && (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Add Closure
            </button>
          </form>

          {blackoutLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : blackouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CalendarOff className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">No blackout closures</h3>
              <p className="text-sm text-gray-500 mt-1">
                You haven't added any holiday or closure dates yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blackouts.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200"
                >
                  <div className="flex items-center gap-3">
                    <CalendarOff className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{b.title}</p>
                      <p className="text-sm text-gray-600">
                        {b.date}{" "}
                        {b.is_full_day
                          ? "– Full day"
                          : `– ${formatTime(b.start_time || "")} to ${formatTime(b.end_time || "")}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBlackoutDeleteTarget(b.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}