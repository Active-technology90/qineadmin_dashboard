import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2, Users, UserCheck, Star, Clock, Calendar, CheckSquare } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { getManageStaff, createStaff, deleteStaff, getManageServiceOfferings } from "../../../services/api";
import { CompanySelector } from "../company-products/CompanySelector";
import { Toast } from "../../ui/Toast";
import { extractErrorMessage } from "../../../utils/extractErrorMessage";
import type { ServiceStaff, ServiceOffering } from "../../../types";

const WEEKDAYS = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

export default function StaffManagement() {
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

  const [staff, setStaff] = useState<ServiceStaff[]>([]);
  const [offerings, setOfferings] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [nameAm, setNameAm] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [assignedServiceIds, setAssignedServiceIds] = useState<number[]>([]);
  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4]); // Default Mon-Fri
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!companySlug) return;
    try {
      setLoading(true);
      const [staffRes, offeringsRes] = await Promise.allSettled([
        getManageStaff(companySlug),
        getManageServiceOfferings(companySlug),
      ]);
      if (staffRes.status === "fulfilled") setStaff(staffRes.value.data || []);
      if (offeringsRes.status === "fulfilled") setOfferings(offeringsRes.value.data || []);
    } catch (err: any) {
      setToast({ type: "error", message: extractErrorMessage(err, "Failed to load staff data") });
    } finally {
      setLoading(false);
    }
  }, [companySlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleWorkingDay = (dayVal: number) => {
    setWorkingDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const toggleService = (offeringId: number) => {
    setAssignedServiceIds((prev) =>
      prev.includes(offeringId) ? prev.filter((id) => id !== offeringId) : [...prev, offeringId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySlug || !name.trim()) return;

    try {
      setSubmitting(true);
      await createStaff(companySlug, {
        name: name.trim(),
        name_am: nameAm.trim(),
        role_title: roleTitle.trim(),
        assigned_service_ids: assignedServiceIds,
        working_days: workingDays,
        start_time: startTime ? `${startTime}:00` : "09:00:00",
        end_time: endTime ? `${endTime}:00` : "17:00:00",
        is_online: isOnline,
        is_active: true,
      });
      setName("");
      setNameAm("");
      setRoleTitle("");
      setAssignedServiceIds([]);
      setWorkingDays([0, 1, 2, 3, 4]);
      setToast({ type: "success", message: "Specialist added successfully!" });
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", message: extractErrorMessage(err, "Failed to add specialist") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!companySlug) return;
    try {
      await deleteStaff(companySlug, id);
      setToast({ type: "success", message: "Specialist removed." });
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", message: extractErrorMessage(err, "Failed to remove specialist") });
    }
  };

  if (showSelector) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff & Specialists</h1>
        <CompanySelector
          companies={serviceCompanies}
          isLoading={isLoadingCompanies}
          onSelectCompany={(c) => switchCompany(c.slug)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Staff & Specialists Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage specialists, schedule shifts, service qualifications, and view customer ratings for {company?.name}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={clearCompany}
            className="text-sm text-purple-600 hover:underline font-medium"
          >
            Change Company
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-4">
          <h2 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-600" /> Add New Specialist / Staff
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name (English) *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Robel Alemu"
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name (Amharic)</label>
              <input
                type="text"
                value={nameAm}
                onChange={(e) => setNameAm(e.target.value)}
                placeholder="e.g. ሮቤል ዓለሙ"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role / Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Barber, Master Stylist, Electrician"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Shift Hours */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Shift Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Shift End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Working Days Badges */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" /> Working Days
              </label>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map((day) => {
                  const active = workingDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWorkingDay(day.value)}
                      className={`px-2 py-1 text-xs rounded-md border font-medium transition-colors ${
                        active
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Qualified Services Checkboxes */}
            {offerings.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-purple-600" /> Qualified Services (Optional)
                </label>
                <p className="text-[10px] text-gray-400 mb-2">Select specific services this staff performs (leave empty for all).</p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 border border-gray-100 p-2 rounded-lg bg-gray-50">
                  {offerings.map((off) => (
                    <label key={off.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignedServiceIds.includes(off.id)}
                        onChange={() => toggleService(off.id)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="truncate">{off.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Online Status Toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-gray-700">Online & Booking Available</span>
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isOnline ? "bg-emerald-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isOnline ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 mt-4"
            >
              {submitting ? "Adding..." : "Add Specialist"}
            </button>
          </form>
        </div>

        {/* Staff Roster List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-600" /> Active Staff Roster ({staff.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading staff members...</div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No staff members registered yet. Use the form to add specialists for customer booking choice.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {staff.map((member) => (
                <div key={member.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-sm flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">
                          {member.name} {member.name_am ? `(${member.name_am})` : ""}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            member.is_online !== false
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {member.is_online !== false ? "Online" : "Offline"}
                        </span>
                        {Number(member.average_rating) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {Number(member.average_rating).toFixed(1)} ({member.review_count})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {member.role_title || "Specialist"}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-500" />
                          {String(member.start_time || "09:00").slice(0, 5)} – {String(member.end_time || "17:00").slice(0, 5)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-500" />
                          {member.working_days?.length
                            ? member.working_days.map((d) => WEEKDAYS.find((w) => w.value === d)?.label).join(", ")
                            : "All Days"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors self-end md:self-center"
                    title="Remove staff member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
