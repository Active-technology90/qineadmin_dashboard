import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  Trash2,
  Users,
  UserCheck,
  Star,
  Clock,
  Calendar,
  CheckSquare,
  Search,
  RefreshCw,
  SlidersHorizontal,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Edit,
  ToggleRight,
  AlertCircle,
  ImagePlus,
  Upload,
  LayoutGrid,
  List,
  Download,
  MoreHorizontal,
  Repeat,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import {
  getManageStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getManageServiceOfferings,
} from "../../../services/api";
import { CompanySelector } from "../company-products/CompanySelector";
import { Toast } from "../../ui/Toast";
import { extractErrorMessage } from "../../../utils/extractErrorMessage";
import type { ServiceStaff, ServiceOffering } from "../../../types";

const PRIMARY_COLOR = "#6750A4";

const WEEKDAYS = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

// ─── Reusable UI Components (Upgraded) ──────────────────
const InputWithIcon = ({
  icon: Icon,
  ...props
}: { icon: any } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-4 w-4 text-gray-400" />
    </div>
    <input
      {...props}
      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20 focus:border-[#6750A4] transition-all duration-200"
    />
  </div>
);

const AnimatedCounter = ({
  value,
  duration = 0.8,
}: {
  value: number;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const incrementTime = (duration / end) * 1000;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count}</span>;
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  color = PRIMARY_COLOR,
}: {
  label: string;
  value: number | string;
  icon: any;
  trend?: number;
  color?: string;
}) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.05)" }}
    className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          <AnimatedCounter value={Number(value)} />
        </p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend > 0 ? (
              <ChevronUp className="w-3 h-3 text-emerald-500" />
            ) : (
              <ChevronDown className="w-3 h-3 text-red-500" />
            )}
            <span
              className={`text-xs font-medium ${trend > 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {trend}% vs last week
            </span>
          </div>
        )}
      </div>
      <div
        className="p-2.5 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
    </div>
    <div
      className="absolute top-0 right-0 w-24 h-24 opacity-5 -translate-y-1/2 translate-x-1/2 rounded-full blur-2xl"
      style={{ background: color }}
    />
  </motion.div>
);

const WorkingDaysPicker = ({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
}) => {
  const toggle = (day: number) => {
    onChange(
      selected.includes(day)
        ? selected.filter((d) => d !== day)
        : [...selected, day],
    );
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {WEEKDAYS.map((day) => {
        const active = selected.includes(day.value);
        return (
          <motion.button
            key={day.value}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => toggle(day.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              active
                ? "text-white border-transparent shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
            style={
              active
                ? { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }
                : {}
            }
          >
            {day.label}
          </motion.button>
        );
      })}
    </div>
  );
};

const ServiceMultiSelect = ({
  services,
  selectedIds,
  onChange,
}: {
  services: ServiceOffering[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = services.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedItems = services.filter((s) => selectedIds.includes(s.id));

  const toggle = (id: number) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 hover:bg-white focus:ring-2 focus:ring-[#6750A4]/20 focus:border-[#6750A4] transition-all"
      >
        <span className="text-gray-500">
          {selectedIds.length > 0
            ? `${selectedIds.length} service(s) selected`
            : "Select services..."}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border-0 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#6750A4]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-400 px-4 py-2">
                  No services found.
                </p>
              ) : (
                filtered.map((service) => {
                  const isSelected = selectedIds.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggle(service.id)}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-[#6750A4]/10 ${
                        isSelected
                          ? "bg-[#6750A4]/10 text-[#6750A4]"
                          : "text-gray-700"
                      }`}
                    >
                      <span>{service.title}</span>
                      {isSelected && (
                        <CheckSquare
                          className="h-4 w-4"
                          style={{ color: PRIMARY_COLOR }}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedItems.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#6750A4]/10 text-[#6750A4] rounded-full"
            >
              {s.title}
              <button
                onClick={() => toggle(s.id)}
                className="ml-1 hover:text-[#6750A4]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Avatar Upload with Drag & Drop Feel ────────────────
const AvatarUpload = ({
  currentImage,
  onFileSelect,
}: {
  currentImage?: string | null;
  onFileSelect: (file: File | null) => void;
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const imageSrc = preview || currentImage || null;

  return (
    <div className="flex flex-col items-center">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-[#6750A4] ${
          isDragging ? "border-[#6750A4] bg-purple-50" : ""
        }`}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <ImagePlus className="h-8 w-8 text-gray-400" />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Upload className="h-5 w-5 text-white" />
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 text-xs font-medium text-[#6750A4] hover:text-[#6750A4]/80"
      >
        Upload Photo
      </button>
      {imageSrc && (
        <button
          type="button"
          onClick={() => {
            setPreview(null);
            onFileSelect(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="mt-1 text-xs text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      )}
    </div>
  );
};

// ─── StaffForm (Create & Edit) – Upgraded with sections icons ──
const StaffForm = ({
  companySlug,
  offerings,
  onSuccess,
  onCancel,
  initialData = null,
}: {
  companySlug: string;
  offerings: ServiceOffering[];
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: ServiceStaff | null;
}) => {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [nameAm, setNameAm] = useState(initialData?.name_am || "");
  const [roleTitle, setRoleTitle] = useState(initialData?.role_title || "");
  const [assignedServiceIds, setAssignedServiceIds] = useState<number[]>(
    initialData?.assigned_service_ids || [],
  );
  const [workingDays, setWorkingDays] = useState<number[]>(
    initialData?.working_days
      ? Array.isArray(initialData.working_days)
        ? initialData.working_days
        : [initialData.working_days]
      : [0, 1, 2, 3, 4],
  );
  const [startTime, setStartTime] = useState(
    initialData?.start_time?.slice(0, 5) || "09:00",
  );
  const [endTime, setEndTime] = useState(
    initialData?.end_time?.slice(0, 5) || "17:00",
  );
  const [isOnline, setIsOnline] = useState(initialData?.is_online ?? true);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("name_am", nameAm.trim());
      formData.append("role_title", roleTitle.trim());
      assignedServiceIds.forEach((id) =>
        formData.append("assigned_service_ids", String(id)),
      );
      workingDays.forEach((day) =>
        formData.append("working_days", String(day)),
      );
      formData.append("start_time", startTime ? `${startTime}:00` : "09:00:00");
      formData.append("end_time", endTime ? `${endTime}:00` : "17:00:00");
      formData.append("is_online", isOnline ? "true" : "false");
      formData.append("is_active", isActive ? "true" : "false");
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      if (isEditing && initialData) {
        await updateStaff(companySlug, initialData.id, formData);
        setToast({ type: "success", message: "Specialist updated!" });
      } else {
        await createStaff(companySlug, formData);
        setToast({ type: "success", message: "Specialist added!" });
      }
      if (!isEditing) {
        setName("");
        setNameAm("");
        setRoleTitle("");
        setAssignedServiceIds([]);
        setWorkingDays([0, 1, 2, 3, 4]);
        setIsOnline(true);
        setIsActive(true);
        setAvatarFile(null);
      }
      onSuccess();
    } catch (err: any) {
      setToast({
        type: "error",
        message: extractErrorMessage(err, "Failed to save specialist"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const SectionTitle = ({
    icon: Icon,
    title,
  }: {
    icon: any;
    title: string;
  }) => (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4" style={{ color: PRIMARY_COLOR }} />
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );

  return (
    <div>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex justify-center">
          <AvatarUpload
            currentImage={initialData?.avatar || null}
            onFileSelect={setAvatarFile}
          />
        </div>

        {/* Profile Information */}
        <section>
          <SectionTitle icon={UserCheck} title="Profile Information" />
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Full Name (English) *
              </label>
              <InputWithIcon
                icon={UserCheck}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Robel Alemu"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name (Amharic)
              </label>
              <input
                type="text"
                value={nameAm}
                onChange={(e) => setNameAm(e.target.value)}
                placeholder="e.g. ሮቤል ዓለሙ"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20 focus:border-[#6750A4] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Role / Title
              </label>
              <InputWithIcon
                icon={Star}
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Barber, Master Stylist"
              />
            </div>
          </div>
        </section>

        {/* Availability */}
        <section>
          <SectionTitle icon={Clock} title="Availability Schedule" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Shift Start
              </label>
              <InputWithIcon
                icon={Clock}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Shift End
              </label>
              <InputWithIcon
                icon={Clock}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Working Days
            </label>
            <WorkingDaysPicker
              selected={workingDays}
              onChange={setWorkingDays}
            />
          </div>
        </section>

        {/* Qualifications */}
        <section>
          <SectionTitle icon={CheckSquare} title="Assigned Services" />
          <ServiceMultiSelect
            services={offerings}
            selectedIds={assignedServiceIds}
            onChange={setAssignedServiceIds}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Leave empty to assign all services.
          </p>
        </section>

        {/* Status */}
        <section>
          <SectionTitle icon={ToggleRight} title="Booking Status" />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ToggleRight className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Online & Booking</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: isOnline ? PRIMARY_COLOR : "#D1D5DB",
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isOnline ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ToggleRight className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  Active (visible to customers)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: isActive ? PRIMARY_COLOR : "#D1D5DB",
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="flex-1 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {submitting
              ? "Saving..."
              : isEditing
                ? "Update Staff"
                : "Create Staff"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

// ─── DeleteModal (Upgraded) ─────────────────────────────
const DeleteModal = ({
  staff,
  onConfirm,
  onClose,
}: {
  staff: ServiceStaff;
  onConfirm: () => void;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
    >
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          {staff.avatar ? (
            <img
              src={staff.avatar}
              alt={staff.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {staff.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          Remove {staff.name}?
        </h3>
        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
          This action cannot be undone. All associated bookings and assignments
          will be lost.
        </p>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Delete
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Staff Table (Presentational) ───────────────────────
const StaffTable = ({
  staff,
  offerings,
  onDeleteClick,
  onEdit,
  selectedIds,
  setSelectedIds,
  viewMode,
}: {
  staff: ServiceStaff[];
  offerings: ServiceOffering[];
  onDeleteClick: (staff: ServiceStaff) => void;
  onEdit: (member: ServiceStaff) => void;
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  viewMode: "table" | "card";
}) => {
  const today = new Date().getDay();
  const getServiceTitle = (id: number) =>
    offerings.find((o) => o.id === id)?.title || "";

  if (viewMode === "card") {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => {
          const isToday = member.working_days?.includes(today);
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        member.is_online !== false
                          ? "bg-emerald-500"
                          : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {member.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {member.role_title || "Specialist"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(member)}
                    className="p-1.5 text-gray-400 hover:text-[#6750A4] rounded-lg hover:bg-[#6750A4]/10 transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteClick(member)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium">
                    {Number(member.average_rating).toFixed(1)}
                  </span>
                  <span className="text-gray-400 text-xs">
                    ({member.review_count})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {String(member.start_time || "09:00").slice(0, 5)} -{" "}
                    {String(member.end_time || "17:00").slice(0, 5)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {member.assigned_service_ids?.length ? (
                    member.assigned_service_ids.slice(0, 2).map((id) => (
                      <span
                        key={id}
                        className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full"
                        style={{
                          backgroundColor: `${PRIMARY_COLOR}15`,
                          color: PRIMARY_COLOR,
                        }}
                      >
                        {getServiceTitle(id)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">All services</span>
                  )}
                  {member.assigned_service_ids?.length > 2 && (
                    <span className="text-[10px] text-gray-400">
                      +{member.assigned_service_ids.length - 2}
                    </span>
                  )}
                </div>
                <div>
                  {isToday ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                      <Calendar className="w-3 h-3" /> Working Today
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                      Off Today
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Table View
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked)
                      setSelectedIds(staff.map((s) => s.id));
                    else setSelectedIds([]);
                  }}
                  checked={
                    selectedIds.length === staff.length && staff.length > 0
                  }
                  className="rounded border-gray-300 text-[#6750A4] focus:ring-[#6750A4]"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Services
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Today
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map((member) => {
              const isToday = member.working_days?.includes(today);
              return (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-[#6750A4]/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(member.id)}
                      onChange={() =>
                        setSelectedIds((prev) =>
                          prev.includes(member.id)
                            ? prev.filter((id) => id !== member.id)
                            : [...prev, member.id],
                        )
                      }
                      className="rounded border-gray-300 text-[#6750A4] focus:ring-[#6750A4]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            member.is_online !== false
                              ? "bg-emerald-500"
                              : "bg-gray-300"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {member.name}
                        </div>
                        {member.name_am && (
                          <div className="text-xs text-gray-400">
                            {member.name_am}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {member.role_title || "Specialist"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {member.assigned_service_ids?.length ? (
                      <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
                        {member.assigned_service_ids.slice(0, 2).map((id) => {
                          const title = getServiceTitle(id);

                          return (
                            <span
                              key={id}
                              title={title}
                              className="
              inline-flex
              items-center
              max-w-[120px]
              px-2.5
              py-1
              rounded-full
              text-[11px]
              font-medium
              truncate
              border
            "
                              style={{
                                backgroundColor: `${PRIMARY_COLOR}10`,
                                color: PRIMARY_COLOR,
                                borderColor: `${PRIMARY_COLOR}25`,
                              }}
                            >
                              <span className="truncate">
                                {title || "Service"}
                              </span>
                            </span>
                          );
                        })}

                        {member.assigned_service_ids.length > 2 && (
                          <span
                            className="
            inline-flex
            items-center
            justify-center
            min-w-[32px]
            h-6
            px-2
            rounded-full
            text-[11px]
            font-semibold
            bg-gray-100
            text-gray-600
            hover:bg-gray-200
            cursor-help
            transition-colors
          "
                            title={member.assigned_service_ids
                              .slice(2)
                              .map((id) => getServiceTitle(id))
                              .join(", ")}
                          >
                            +{member.assigned_service_ids.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        className="
        inline-flex
        items-center
        gap-2
        px-3
        py-1
        rounded-full
        bg-emerald-50
        text-emerald-700
        text-[11px]
        font-semibold
        whitespace-nowrap
      "
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        All Services
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {Number(member.average_rating).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({member.review_count})
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {String(member.start_time || "09:00").slice(0, 5)} -{" "}
                    {String(member.end_time || "17:00").slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isToday ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                        <Calendar className="w-3 h-3" /> Working
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                        Off
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(member)}
                        className="p-1.5 text-gray-400 hover:text-[#6750A4] rounded-lg hover:bg-[#6750A4]/10 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClick(member)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {staff.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          No staff found matching your search.
        </div>
      )}
    </div>
  );
};

// ─── Main StaffManagement Component (Upgraded) ──────────
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
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [editingStaff, setEditingStaff] = useState<ServiceStaff | null>(null);

  // Toolbar state lifted up
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "rating">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [deleteTarget, setDeleteTarget] = useState<ServiceStaff | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    if (!companySlug) return;
    try {
      setLoading(true);
      const [staffRes, offeringsRes] = await Promise.allSettled([
        getManageStaff(companySlug),
        getManageServiceOfferings(companySlug),
      ]);
      if (staffRes.status === "fulfilled") {
        const rawStaff = staffRes.value.data || [];
        const fixedStaff = rawStaff.map((s: ServiceStaff) => ({
          ...s,
          working_days: Array.isArray(s.working_days)
            ? s.working_days
            : typeof s.working_days === "number"
              ? [s.working_days]
              : [],
        }));
        setStaff(fixedStaff);
      }
      if (offeringsRes.status === "fulfilled") {
        setOfferings(offeringsRes.value.data || []);
      }
    } catch (err: any) {
      setToast({
        type: "error",
        message: extractErrorMessage(err, "Failed to load staff data"),
      });
    } finally {
      setLoading(false);
    }
  }, [companySlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!companySlug) return;
    try {
      await deleteStaff(companySlug, id);
      setToast({ type: "success", message: "Specialist removed." });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setToast({
        type: "error",
        message: extractErrorMessage(err, "Failed to remove specialist"),
      });
    }
  };

  const handleEditStart = (member: ServiceStaff) => {
    setEditingStaff(member);
  };

  const handleEditCancel = () => {
    setEditingStaff(null);
  };

  const handleEditSuccess = () => {
    setEditingStaff(null);
    fetchData();
  };

  // Derived data
  const today = new Date().getDay();
  const availableToday = staff.filter(
    (s) => s.working_days?.includes(today) && s.is_online !== false,
  ).length;
  const offlineStaff = staff.filter((s) => s.is_online === false).length;
  const avgRating =
    staff.length > 0
      ? staff.reduce((acc, s) => acc + (Number(s.average_rating) || 0), 0) /
        staff.length
      : 0;
  const totalAssignments = staff.reduce(
    (sum, s) => sum + (s.assigned_service_ids?.length || 0),
    0,
  );
  const workingToday = staff.filter((s) =>
    s.working_days?.includes(today),
  ).length;

  // Filtered & sorted staff
  const filteredStaff = useMemo(() => {
    let list = staff.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()),
    );
    if (sortKey === "name") {
      list.sort((a, b) =>
        sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name),
      );
    } else if (sortKey === "rating") {
      list.sort((a, b) =>
        sortDir === "asc"
          ? (a.average_rating || 0) - (b.average_rating || 0)
          : (b.average_rating || 0) - (a.average_rating || 0),
      );
    }
    return list;
  }, [staff, search, sortKey, sortDir]);

  if (showSelector) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-secondary mb-6">
            Staff & Specialists
          </h1>
          <CompanySelector
            companies={serviceCompanies}
            isLoading={isLoadingCompanies}
            onSelect={(slug, name) => {
              const membership = user?.memberships?.find(
                (m: any) => m.company_slug === slug,
              );
              const role =
                membership?.role ?? (isSuperAdmin ? "admin" : "staff");
              switchCompany({ slug, name, role });
            }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-secondary">
              Staff & Specialists
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your team, schedules, and services
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 text-lg font-medium rounded-full"
              style={{
                backgroundColor: `${PRIMARY_COLOR}20`,
                color: PRIMARY_COLOR,
              }}
            >
              {company?.name}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              {staff.length} staff
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {isSuperAdmin && (
            <button
              onClick={clearCompany}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-secondary border border-secondary rounded-xl hover:bg-purple-50 transition"
            >
              <Repeat className="h-4 w-4" />
              Switch
            </button>
          )}
          <button
            onClick={() => {
              setEditingStaff(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-sm transition-all"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus className="h-4 w-4" />
            Add Specialist
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      {!loading && staff.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <StatCard
            label="Total Staff"
            value={staff.length}
            icon={Users}
            color="#3B82F6"
          />
          <StatCard
            label="Available Today"
            value={availableToday}
            icon={UserCheck}
            color="#10B981"
          />
          <StatCard
            label="Offline"
            value={offlineStaff}
            icon={X}
            color="#6B7280"
          />
          <StatCard
            label="Avg Rating"
            value={avgRating.toFixed(1)}
            icon={Star}
            color="#F59E0B"
          />
          <StatCard
            label="Assigned Services"
            value={totalAssignments}
            icon={CheckSquare}
            color="#6750A4"
          />
          <StatCard
            label="Working Today"
            value={workingToday}
            icon={Calendar}
            color="#EC4899"
          />
        </motion.div>
      )}

      {/* Main Content: Form + Toolbar & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sticky Form Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="lg:sticky lg:top-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {editingStaff ? (
                  <Edit className="h-5 w-5" style={{ color: PRIMARY_COLOR }} />
                ) : (
                  <Plus className="h-5 w-5" style={{ color: PRIMARY_COLOR }} />
                )}
                {editingStaff ? "Edit Specialist" : "Add Specialist"}
              </h2>
              <StaffForm
                key={editingStaff ? `edit-${editingStaff.id}` : "create"}
                companySlug={companySlug!}
                offerings={offerings}
                onSuccess={editingStaff ? handleEditSuccess : fetchData}
                onCancel={editingStaff ? handleEditCancel : undefined}
                initialData={editingStaff}
              />
            </div>
          </div>
        </motion.div>

        {/* Right: Toolbar + List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Toolbar */}
          {staff.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Filters"
                >
                  <Filter className="h-4 w-4" />
                </button>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as any)}
                  className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20"
                >
                  <option value="name">Sort by Name</option>
                  <option value="rating">Sort by Rating</option>
                </select>
                <button
                  onClick={() =>
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  title={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === "table"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500"
                    }`}
                    title="Table view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("card")}
                    className={`p-1.5 rounded-md transition-colors ${
                      viewMode === "card"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500"
                    }`}
                    title="Card view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 pl-3 border-l">
                    <span className="text-sm text-gray-500">
                      {selectedIds.length} selected
                    </span>
                    <button
                      className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete selected"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : staff.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-gray-100 p-12 text-center"
            >
              <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                No staff added yet
              </h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Start building your team by adding your first specialist.
                They'll appear here and can be assigned to services.
              </p>
              <button
                onClick={() => {
                  setEditingStaff(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-6 px-5 py-2.5 text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-sm transition-all"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Plus className="h-4 w-4 inline mr-1" />
                Create First Staff
              </button>
            </motion.div>
          ) : (
            <StaffTable
              staff={filteredStaff}
              offerings={offerings}
              onDeleteClick={(staff) => setDeleteTarget(staff)}
              onEdit={handleEditStart}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              viewMode={viewMode}
            />
          )}
        </motion.div>
      </div>

      {/* Delete modal (global) */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            staff={deleteTarget}
            onConfirm={() => handleDelete(deleteTarget.id)}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
