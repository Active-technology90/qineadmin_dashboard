import { useMemo, useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Clock, Repeat, CalendarOff, AlertTriangle } from "lucide-react";
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
import type { AvailabilitySlot } from "../../../types";

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

export default function AvailabilityManagement() {
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

  const { slots, loading, create, remove } = useAvailability(
    isServiceCompany ? companySlug : null,
  );

  const [form, setForm] = useState({
    day_of_week: 0,
    start_time: "09:00",
    end_time: "17:00",
    max_bookings: 1,
  });

  const [blackouts, setBlackouts] = useState<any[]>([]);
  const [blackoutLoading, setBlackoutLoading] = useState(false);
  const [blackoutForm, setBlackoutForm] = useState({
    title: "Public Holiday",
    date: "",
    is_full_day: true,
    start_time: "09:00",
    end_time: "17:00",
  });

  const [deleteTarget, setDeleteTarget] = useState<AvailabilitySlot | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBlackouts = useCallback(async () => {
    if (!companySlug || !isServiceCompany) return;
    try {
      setBlackoutLoading(true);
      const res = await getManageBlackouts(companySlug);
      setBlackouts(res.data || []);
    } catch {
      // ignore
    } finally {
      setBlackoutLoading(false);
    }
  }, [companySlug, isServiceCompany]);

  useEffect(() => {
    fetchBlackouts();
  }, [fetchBlackouts]);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({ ...form, is_active: true });
      showToast("success", "Availability slot added");
    } catch (err: any) {
      showToast("error", extractErrorMessage(err, "Failed to add slot"));
    }
  };

  const handleCreateBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySlug || !blackoutForm.date) return;
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
      showToast("success", "Blackout / Holiday exception added");
      setBlackoutForm({
        title: "Public Holiday",
        date: "",
        is_full_day: true,
        start_time: "09:00",
        end_time: "17:00",
      });
      fetchBlackouts();
    } catch (err: any) {
      showToast("error", extractErrorMessage(err, "Failed to add blackout exception"));
    }
  };

  const handleDeleteBlackout = async (id: number) => {
    if (!companySlug) return;
    try {
      await deleteBlackoutDate(companySlug, id);
      showToast("success", "Blackout exception removed");
      fetchBlackouts();
    } catch (err: any) {
      showToast("error", extractErrorMessage(err, "Failed to remove blackout exception"));
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <>
      <Toast toast={toast} />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={`${DAYS.find((d) => d.value === deleteTarget?.day_of_week)?.label || "Slot"}`}
        onConfirm={async () => {
          if (deleteTarget) {
            await remove(deleteTarget.id);
            showToast("success", "Slot removed");
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="space-y-6">
        {/* Working Hours Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Working Hours</h1>
              <p className="text-sm text-gray-500 mt-1">
                Set weekly hours and maximum concurrent bookings for {company?.name}
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={clearCompany}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <Repeat className="h-4 w-4" />
                Switch
              </button>
            )}
          </div>

          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="text-xs text-gray-500">Day</label>
              <select
                value={form.day_of_week}
                onChange={(e) =>
                  setForm({ ...form, day_of_week: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Open</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Close</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Max / slot</label>
              <input
                type="number"
                min={1}
                value={form.max_bookings}
                onChange={(e) =>
                  setForm({ ...form, max_bookings: Number(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-700 text-white text-sm font-medium rounded-xl hover:bg-purple-800 h-[42px]"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading availability...</div>
          ) : slots.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No working hours set yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Max Bookings</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {slot.day_name ||
                          DAYS.find((d) => d.value === slot.day_of_week)?.label}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{slot.max_bookings}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteTarget(slot)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Blackout Dates / Holiday Closures Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <CalendarOff className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Holiday & Blackout Closures</h2>
              <p className="text-xs text-gray-500">
                Block out specific dates or time windows for holidays, staff meetings, or maintenance
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCreateBlackout}
            className="rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="text-xs text-gray-500">Reason / Title</label>
              <input
                type="text"
                placeholder="e.g. Ethiopian New Year"
                value={blackoutForm.title}
                onChange={(e) => setBlackoutForm({ ...blackoutForm, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Date</label>
              <input
                type="date"
                value={blackoutForm.date}
                onChange={(e) => setBlackoutForm({ ...blackoutForm, date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <select
                value={blackoutForm.is_full_day ? "full" : "partial"}
                onChange={(e) =>
                  setBlackoutForm({ ...blackoutForm, is_full_day: e.target.value === "full" })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="full">Full Day Closed</option>
                <option value="partial">Partial Hours</option>
              </select>
            </div>
            {!blackoutForm.is_full_day && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">From</label>
                  <input
                    type="time"
                    value={blackoutForm.start_time}
                    onChange={(e) => setBlackoutForm({ ...blackoutForm, start_time: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-xs"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">To</label>
                  <input
                    type="time"
                    value={blackoutForm.end_time}
                    onChange={(e) => setBlackoutForm({ ...blackoutForm, end_time: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-xs"
                  />
                </div>
              </div>
            )}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 h-[42px]"
            >
              <Plus className="h-4 w-4" />
              Add Closure
            </button>
          </form>

          {blackoutLoading ? (
            <div className="py-8 text-center text-gray-400">Loading blackout closures...</div>
          ) : blackouts.length === 0 ? (
            <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-500">No holiday or blackout closures configured.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {blackouts.map((b: any) => (
                    <tr key={b.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{b.title}</td>
                      <td className="px-4 py-3 text-gray-700">{b.date}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {b.is_full_day
                          ? "Full Day Closed"
                          : `${formatTime(b.start_time)} - ${formatTime(b.end_time)}`}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteBlackout(b.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
