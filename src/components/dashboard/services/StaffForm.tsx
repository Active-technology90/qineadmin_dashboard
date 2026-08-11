import { useState, useRef, useEffect } from "react";
import {
  UserCheck,
  Star,
  Clock,
  CheckSquare,
  ToggleRight,
  Loader2,
  X,
  Upload,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createStaff, updateStaff } from "../../../services/api";
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

/* ─── Reusable Input Component ─────────────────────────── */
const InputWithIcon = ({
  icon: Icon,
  id,
  ...props
}: { icon: React.ElementType; id?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <input
      {...props}
      id={id}
      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20 focus:border-[#6750A4] transition-all"
    />
  </div>
);



const AvatarUpload = ({
  currentImage,
  onFileSelect,
  onError,
}: {
  currentImage?: string | null;
  onFileSelect: (file: File | null) => void;
  onError?: (msg: string) => void;
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [currentImage]);

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      onError?.("Please upload a JPG, PNG, or WEBP image.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError?.("Image must be under 5 MB.");
      return false;
    }

    return true;
  };

  const createPreview = (file: File) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleFile = (file: File | null) => {
    if (!file) return;

    if (!validateFile(file)) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    onFileSelect(file);
    createPreview(file);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);

    const file = e.dataTransfer.files?.[0] || null;

    handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    // VERY IMPORTANT:
    // Prevent the click from triggering the upload area
    e.preventDefault();
    e.stopPropagation();

    setPreview(null);
    onFileSelect(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const imageSrc = preview || currentImage || null;
  const hasImage = Boolean(imageSrc);

  return (
    <div className="flex flex-col items-center">
      {/* Upload Area */}
      <div
        onClick={triggerFileInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          group relative h-28 w-28 cursor-pointer
          overflow-visible rounded-full
          border-2 border-dashed
          transition-all duration-200
          focus-within:ring-4 focus-within:ring-[#6750A4]/20
          ${
            isDragging
              ? "scale-105 border-[#6750A4] bg-purple-50"
              : hasImage
              ? "border-gray-200 bg-gray-100 hover:border-[#6750A4]"
              : "border-gray-300 bg-gray-50 hover:border-[#6750A4] hover:bg-purple-50"
          }
        `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerFileInput();
          }
        }}
        aria-label={
          hasImage
            ? "Change profile photo"
            : "Upload profile photo"
        }
      >
        {/* Image Container */}
        <div className="relative h-full w-full overflow-hidden rounded-full">
          {imageSrc ? (
            <>
              <img
                src={imageSrc}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />

              {/* Hover Overlay */}
              <div
                className="
                  absolute inset-0
                  flex flex-col items-center justify-center
                  bg-black/50
                  opacity-0
                  transition-opacity
                  duration-200
                  group-hover:opacity-100
                "
              >
                <Upload className="h-5 w-5 text-white" />

                <span className="mt-1 text-[10px] font-medium text-white">
                  Change photo
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <div
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-full bg-[#6750A4]/10
                "
              >
                <Upload
                  className="h-5 w-5"
                  style={{ color: PRIMARY_COLOR }}
                />
              </div>

              <span className="mt-1.5 text-[10px] font-medium text-gray-500">
                Upload photo
              </span>
            </div>
          )}
        </div>

        {/* Remove Button */}
        {hasImage && (
          <button
            type="button"
            onClick={handleRemove}
            className="
              absolute
              -right-1
              -top-1
              z-30
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-full
              border-2
              border-white
              bg-white
              text-gray-500
              shadow-md
              transition-all
              duration-150
              hover:scale-110
              hover:bg-red-50
              hover:text-red-600
              focus:outline-none
              focus:ring-2
              focus:ring-red-500/30
            "
            aria-label="Remove profile photo"
            title="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Helper Text */}
      <div className="mt-3 text-center">
        <p className="text-xs font-medium text-gray-700">
          {hasImage
            ? "Profile photo"
            : "Add profile photo"}
        </p>

        <p className="mt-0.5 text-[10px] text-gray-400">
          JPG, PNG or WEBP · Max 5 MB
        </p>

        {!hasImage && (
          <p className="mt-1 text-[10px] text-gray-400">
            Click or drag & drop
          </p>
        )}
      </div>
    </div>
  );
};


/* ─── Working Days Picker ─────────────────────────────── */
const WorkingDaysPicker = ({
  selected,
  onChange,
  error,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
  error?: string;
}) => {
  const toggle = (day: number) => {
    onChange(selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day]);
  };

  const selectAll = () => onChange([0, 1, 2, 3, 4, 5, 6]);
  const selectWeekdays = () => onChange([0, 1, 2, 3, 4]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((day) => {
          const active = selected.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              aria-label={day.label}
              onClick={() => toggle(day.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#6750A4]/50 ${
                active
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              style={active ? { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR } : {}}
            >
              {day.label}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={selectWeekdays} className="text-xs text-[#6750A4] hover:underline">
          Weekdays
        </button>
        <button type="button" onClick={selectAll} className="text-xs text-[#6750A4] hover:underline">
          All days
        </button>
        {selected.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-red-500 hover:underline">
            Clear
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

/* ─── Service Multi‑Select ────────────────────────────── */
const ServiceMultiSelect = ({
  services,
  selectedIds,
  onChange,
  error,
}: {
  services: ServiceOffering[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  error?: string;
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = services.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );
  const selectedItems = services.filter((s) => selectedIds.includes(s.id));

  const toggle = (id: number) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    );
  };

  const clearAll = () => onChange([]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-full flex items-center justify-between px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20 focus:border-[#6750A4] transition-all"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedIds.length > 0 ? "" : "text-gray-400"}>
          {selectedIds.length > 0
            ? `${selectedIds.length} service${selectedIds.length > 1 ? "s" : ""} selected`
            : "Select services..."}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {/* Dropdown */}
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
                aria-label="Search services"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-400 px-4 py-2">No services found.</p>
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
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span>{service.title}</span>
                      {isSelected && <CheckSquare className="h-4 w-4" style={{ color: PRIMARY_COLOR }} />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedItems.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#6750A4]/10 text-[#6750A4] rounded-full"
            >
              {s.title}
              <button
                type="button"
                onClick={() => toggle(s.id)}
                className="ml-0.5 hover:text-[#6750A4] focus:outline-none"
                aria-label={`Remove ${s.title}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedItems.length > 1 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-500 hover:text-red-700 ml-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

/* ─── Toggle Switch ───────────────────────────────────── */
const ToggleSwitch = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6750A4]/50 focus:ring-offset-2"
    style={{ backgroundColor: checked ? PRIMARY_COLOR : "#D1D5DB" }}
  >
    <span className="sr-only">{label}</span>
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

/* ─── StaffForm (Export) ───────────────────────────────── */
export function StaffForm({
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
}) {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [nameAm, setNameAm] = useState(initialData?.name_am || "");
  const [roleTitle, setRoleTitle] = useState(initialData?.role_title || "");
  const [assignedServiceIds, setAssignedServiceIds] = useState<number[]>(
    initialData?.assigned_service_ids || []
  );
  const [workingDays, setWorkingDays] = useState<number[]>(
    initialData?.working_days
      ? Array.isArray(initialData.working_days)
        ? initialData.working_days
        : [initialData.working_days]
      : [0, 1, 2, 3, 4]
  );
  const [startTime, setStartTime] = useState(initialData?.start_time?.slice(0, 5) || "09:00");
  const [endTime, setEndTime] = useState(initialData?.end_time?.slice(0, 5) || "17:00");
  const [isOnline, setIsOnline] = useState(initialData?.is_online ?? true);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Track previous staff ID to detect when editing a different member
  const prevStaffId = useRef<number | null>(null);

  // Sync form when initialData changes (i.e., different staff selected)
  useEffect(() => {
    const staffId = initialData?.id ?? null;
    if (staffId !== prevStaffId.current) {
      prevStaffId.current = staffId;
      // Reset form to new staff's data
      setName(initialData?.name || "");
      setNameAm(initialData?.name_am || "");
      setRoleTitle(initialData?.role_title || "");
      setAssignedServiceIds(initialData?.assigned_service_ids || []);
      setWorkingDays(
        initialData?.working_days
          ? Array.isArray(initialData.working_days)
            ? initialData.working_days
            : [initialData.working_days]
          : [0, 1, 2, 3, 4]
      );
      setStartTime(initialData?.start_time?.slice(0, 5) || "09:00");
      setEndTime(initialData?.end_time?.slice(0, 5) || "17:00");
      setIsOnline(initialData?.is_online ?? true);
      setIsActive(initialData?.is_active ?? true);
      setAvatarFile(null); // reset file input
      setFieldErrors({});
      setToast(null);
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Full name is required.";
    if (workingDays.length === 0) errors.workingDays = "Select at least one working day.";
    if (startTime >= endTime) errors.time = "Start time must be before end time.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const el = document.getElementById(firstErrorField);
      el?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("name_am", nameAm.trim());
      formData.append("role_title", roleTitle.trim());
      assignedServiceIds.forEach((id) => formData.append("assigned_service_ids", String(id)));
     formData.append("working_days", JSON.stringify(workingDays));
      formData.append("start_time", startTime ? `${startTime}:00` : "09:00:00");
      formData.append("end_time", endTime ? `${endTime}:00` : "17:00:00");
      formData.append("is_online", isOnline ? "true" : "false");
      formData.append("is_active", isActive ? "true" : "false");
      if (avatarFile) formData.append("avatar", avatarFile);

      if (isEditing && initialData) {
        await updateStaff(companySlug, initialData.id, formData);
        setToast({ type: "success", message: "Specialist updated successfully." });
      } else {
        await createStaff(companySlug, formData);
        setToast({ type: "success", message: "Specialist added successfully." });
        // Reset form after creation (except toast)
        setName("");
        setNameAm("");
        setRoleTitle("");
        setAssignedServiceIds([]);
        setWorkingDays([0, 1, 2, 3, 4]);
        setIsOnline(true);
        setIsActive(true);
        setAvatarFile(null);
        prevStaffId.current = null;
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

  const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4" style={{ color: PRIMARY_COLOR }} />
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
  );

  return (
    <div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="mb-4">
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditing
              ? "Update specialist profile, availability, and booking settings."
              : "Create a specialist profile, availability, and service assignments."}
          </p>
        </div>

        {/* Avatar Upload */}
        <div className="flex justify-center">
          <AvatarUpload
            currentImage={initialData?.avatar || null}
            onFileSelect={setAvatarFile}
            onError={(msg) => setToast({ type: "error", message: msg })}
          />
        </div>

        {/* Profile Information */}
        <section>
          <SectionTitle icon={UserCheck} title="Profile Information" />
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                Full Name (English) <span className="text-red-500">*</span>
              </label>
              <InputWithIcon
                icon={UserCheck}
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Robel Alemu"
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
              />
              {fieldErrors.name && (
                <p id="name-error" className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="name_am" className="block text-xs font-medium text-gray-700 mb-1">
                Name (Amharic)
              </label>
              <input
                id="name_am"
                type="text"
                value={nameAm}
                onChange={(e) => setNameAm(e.target.value)}
                placeholder="e.g. ሮቤል ዓለሙ"
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20 focus:border-[#6750A4] transition-all"
              />
            </div>
            <div>
              <label htmlFor="role_title" className="block text-xs font-medium text-gray-700 mb-1">
                Role / Title
              </label>
              <InputWithIcon
                icon={Star}
                id="role_title"
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Barber, Master Stylist"
              />
            </div>
          </div>
        </section>

        {/* Availability Schedule */}
        <section>
          <SectionTitle icon={Clock} title="Availability Schedule" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block text-xs font-medium text-gray-700 mb-1">
                Shift Start
              </label>
              <InputWithIcon
                icon={Clock}
                id="start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                aria-invalid={!!fieldErrors.time}
                aria-describedby={fieldErrors.time ? "time-error" : undefined}
              />
            </div>
            <div>
              <label htmlFor="end_time" className="block text-xs font-medium text-gray-700 mb-1">
                Shift End
              </label>
              <InputWithIcon
                icon={Clock}
                id="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          {fieldErrors.time && (
            <p id="time-error" className="text-xs text-red-500 mt-1">{fieldErrors.time}</p>
          )}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Working Days <span className="text-red-500">*</span>
            </label>
            <WorkingDaysPicker
              selected={workingDays}
              onChange={setWorkingDays}
              error={fieldErrors.workingDays}
            />
          </div>
        </section>

        {/* Assigned Services */}
        <section>
          <SectionTitle icon={CheckSquare} title="Assigned Services" />
          <ServiceMultiSelect
            services={offerings}
            selectedIds={assignedServiceIds}
            onChange={setAssignedServiceIds}
            error={fieldErrors.services}
          />
          <p className="text-xs text-gray-400 mt-1">Leave empty to assign all services.</p>
        </section>

        {/* Booking Status */}
        <section>
          <SectionTitle icon={ToggleRight} title="Booking Status" />
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Online & Booking</span>
                <p className="text-xs text-gray-400 mt-0.5">Customers can book this specialist</p>
              </div>
              <ToggleSwitch checked={isOnline} onChange={setIsOnline} label="Online & Booking" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Active</span>
                <p className="text-xs text-gray-400 mt-0.5">Visible to customers</p>
              </div>
              <ToggleSwitch checked={isActive} onChange={setIsActive} label="Active" />
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-[#6750A4] text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors hover:bg-[#5B46A0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Saving..." : isEditing ? "Update Staff" : "Create Staff"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}