import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  ChevronLeft,
  CheckCircle,
  Wrench,
  FileText,
  DollarSign,
  Calendar,
  Settings,
  ClipboardList,
} from "lucide-react";
import { IntakeFormBuilder } from "./IntakeFormBuilder";
import { ServiceOfferingImageGallery } from "./ServiceOfferingImageGallery";
import { CustomSelect } from "../../ui/CustomSelect";
import type { IntakeFormField, ServiceOffering } from "../../../types";

// ----- Types & Props (unchanged) -----
interface ServiceOfferingModalProps {
  isOpen: boolean;
  offering: ServiceOffering | null;
  companySlug: string;
  onClose: () => void;
  onSave: (
    data: Partial<ServiceOffering>,
    existingId?: number,
  ) => Promise<ServiceOffering>;
  onSaved?: () => void;
  onShowToast?: (type: "success" | "error", message: string) => void;
}

// ----- Default form (unchanged) -----
const defaultForm = {
  title: "",
  title_am: "",
  description: "",
  description_am: "",
  pricing_type: "fixed" as const,
  price: "",
  currency: "ETB",
  duration_minutes: 30,
  booking_mode: "inquiry" as const,
  payment_policy: "upfront" as const,
  deposit_percentage: "0",
  service_category: "",
  is_active: true,
  is_featured: false,
  order: 0,
  intake_form_schema: [] as IntakeFormField[],
};

// ----- Dropdown options -----
const pricingOptions = [
  { value: "fixed", label: "Fixed" },
  { value: "starting_at", label: "Starting At" },
  { value: "hourly", label: "Hourly" },
  { value: "custom", label: "Quote Based" },
];

const bookingOptions = [
  { value: "direct", label: "Direct Booking" },
  { value: "inquiry", label: "Inquiry / Lead" },
];

const paymentOptions = [
  { value: "upfront", label: "Pay Upfront" },
  { value: "post_service", label: "Pay After Service" },
  // { value: "deposit", label: "Deposit Required" },
];

// =============================================================================
// Reusable UI primitive
// =============================================================================
const Card: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, title, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}
  >
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[#6750A4] ">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

// =============================================================================
// Input / Label helpers
// =============================================================================
const inputClass = (fieldError: string) =>
  `w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200
   focus:outline-none focus:ring-2 focus:ring-[#6750A4]  min-h-[44px]
   ${
     fieldError
       ? "border-red-500 bg-red-50 focus:border-red-500"
       : "border-gray-200 bg-gray-50/80 focus:border-[#6750A4]  focus:bg-white"
   }`;

const labelClass =
  "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

// =============================================================================
// Main Component
// =============================================================================
export function ServiceOfferingModal({
  isOpen,
  offering,
  companySlug,
  onClose,
  onSave,
  onSaved,
  onShowToast,
}: ServiceOfferingModalProps) {
  const [step, setStep] = useState<"details" | "gallery">("details");
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedOfferingId, setSavedOfferingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (offering) {
      setForm({
        title: offering.title,
        title_am: offering.title_am || "",
        description: offering.description || "",
        description_am: offering.description_am || "",
        pricing_type: offering.pricing_type,
        price: offering.price || "",
        currency: offering.currency || "ETB",
        duration_minutes: offering.duration_minutes || 30,
        booking_mode: offering.booking_mode,
        payment_policy: offering.payment_policy,
        deposit_percentage: offering.deposit_percentage || "0",
        service_category: offering.service_category || "",
        is_active: offering.is_active,
        is_featured: offering.is_featured,
        order: offering.order || 0,
        intake_form_schema: offering.intake_form_schema || [],
      });
      setSavedOfferingId(offering.id);
      setStep("details");
    } else {
      setForm(defaultForm);
      setSavedOfferingId(null);
      setStep("details");
    }
    setError("");
  }, [isOpen, offering]);

  useEffect(() => {
    if (!isOpen) {
      setStep("details");
      setSavedOfferingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ----- Handlers (unchanged) -----
  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        price: form.pricing_type === "custom" ? null : form.price || "0",
        duration_minutes: Number(form.duration_minutes) || null,
        deposit_percentage: form.deposit_percentage || "0",
        order: Number(form.order) || 0,
      };

      const existingId = savedOfferingId ?? offering?.id;
      const saved = await onSave(payload, existingId ?? undefined);
      setSavedOfferingId(saved.id);
      setStep("gallery");
      onShowToast?.("success", existingId ? "Service updated" : "Service created");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title?.[0] ||
        "Failed to save service";
      setError(typeof msg === "string" ? msg : "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    onSaved?.();
    onClose();
  };

  const offeringId = savedOfferingId ?? offering?.id;

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ── Header ── */}
        <div className="sticky top-0 bg-white z-20 px-6 py-5 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6750A4] ">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {offering || savedOfferingId ? "Edit Service" : "Add Service"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fill in the details and upload images
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Professional Stepper */}
          <div className="mt-6">
            <div className="flex items-center justify-center">
              {/* Step 1 */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all
                    ${
                      step === "details"
                        ? "bg-[#6750A4]  text-white"
                        : step === "gallery"
                        ? "bg-purple-100 text-[#6750A4] "
                        : "bg-gray-100 text-gray-500"
                    }`}
                >
                  {step === "gallery" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    1
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    step === "details" ? "text-[#6750A4] " : "text-gray-500"
                  }`}
                >
                  Service Details
                </span>
              </div>

              <div className="flex-1 mx-4 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-[#6750A4]  transition-all duration-500 ${
                    step === "gallery" ? "w-full" : "w-0"
                  }`}
                />
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all
                    ${
                      step === "gallery"
                        ? "bg-[#6750A4]  text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                >
                  2
                </div>
                <span
                  className={`text-sm font-medium ${
                    step === "gallery" ? "text-[#6750A4] " : "text-gray-500"
                  }`}
                >
                  Gallery
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 space-y-6">
          {step === "details" ? (
            <form id="service-form" onSubmit={handleSubmitDetails}>
              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-200 mb-5">
                  {error}
                </div>
              )}

              {/* Grid of cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card 1: Basic Information */}
                <Card icon={<FileText size={18} />} title="Basic Information">
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        className={inputClass(
                          error && !form.title.trim() ? error : "",
                        )}
                        placeholder="e.g. Premium Haircut"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Title (Amharic)</label>
                      <input
                        type="text"
                        value={form.title_am}
                        onChange={(e) =>
                          setForm({ ...form, title_am: e.target.value })
                        }
                        className={inputClass("")}
                        placeholder="ሙሉ ፀጉር መቁረጥ"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        rows={3}
                        className={`${inputClass("")} resize-none`}
                        placeholder="Describe the service..."
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Description (Amharic)
                      </label>
                      <textarea
                        value={form.description_am}
                        onChange={(e) =>
                          setForm({ ...form, description_am: e.target.value })
                        }
                        rows={2}
                        className={`${inputClass("")} resize-none`}
                        placeholder="የአገልግሎት መግለጫ..."
                      />
                    </div>
                  </div>
                </Card>

                {/* Card 2: Pricing */}
                <Card icon={<DollarSign size={18} />} title="Pricing">
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>Pricing Type</label>
                      <CustomSelect
                        value={form.pricing_type}
                        onChange={(val) =>
                          setForm({
                            ...form,
                            pricing_type: val as typeof form.pricing_type,
                          })
                        }
                        options={pricingOptions}
                        placeholder="Select..."
                        className="w-full"
                      />
                    </div>
                    {form.pricing_type !== "custom" && (
                      <div>
                        <label className={labelClass}>Price (ETB)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.price}
                          onChange={(e) =>
                            setForm({ ...form, price: e.target.value })
                          }
                          className={inputClass("")}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                    <div>
                      <label className={labelClass}>Duration (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        value={form.duration_minutes}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            duration_minutes: Number(e.target.value),
                          })
                        }
                        className={inputClass("")}
                        placeholder="30"
                      />
                    </div>
                    {/* Currency hidden but kept */}
                    <input type="hidden" value={form.currency} />
                  </div>
                </Card>

                {/* Card 3: Booking */}
                <Card icon={<Calendar size={18} />} title="Booking">
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Booking Mode</label>
                      <CustomSelect
                        value={form.booking_mode}
                        onChange={(val) =>
                          setForm({
                            ...form,
                            booking_mode: val as typeof form.booking_mode,
                          })
                        }
                        options={bookingOptions}
                        placeholder="Select..."
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Payment Policy</label>
                      <CustomSelect
                        value={form.payment_policy}
                        onChange={(val) =>
                          setForm({
                            ...form,
                            payment_policy:
                              val as typeof form.payment_policy,
                          })
                        }
                        options={paymentOptions}
                        placeholder="Select..."
                        className="w-full"
                      />
                    </div>
                    {form.payment_policy === "deposit" && (
                      <div>
                        <label className={labelClass}>
                          Deposit Percentage
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={form.deposit_percentage}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              deposit_percentage: e.target.value,
                            })
                          }
                          className={inputClass("")}
                          placeholder="20"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Card 4: Category & Settings */}
                <Card icon={<Settings size={18} />} title="Category & Settings">
                  <div className="space-y-4">
                    {/* <div>
                      <label className={labelClass}>Service Category</label>
                      <input
                        type="text"
                        value={form.service_category}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            service_category: e.target.value,
                          })
                        }
                        className={inputClass("")}
                        placeholder="e.g. Haircuts"
                      />
                    </div> */}
                    <div>
                      <label className={labelClass}>Display Order</label>
                      <input
                        type="number"
                        min="0"
                        value={form.order}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            order: Number(e.target.value) || 0,
                          })
                        }
                        className={inputClass("")}
                        placeholder="0"
                      />
                    </div>

                 <div className="flex flex-col gap-3">
  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={form.is_active}
      onChange={(e) =>
        setForm({ ...form, is_active: e.target.checked })
      }
      className="h-4 w-4 rounded border-gray-300 text-[#6750A4]  focus:ring-[#6750A4] "
    />
    <span className="text-sm font-medium text-gray-700">
      Active Service
    </span>
  </label>

  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={form.is_featured}
      onChange={(e) =>
        setForm({ ...form, is_featured: e.target.checked })
      }
      className="h-4 w-4 rounded border-gray-300 text-[#6750A4]  focus:ring-[#6750A4] "
    />
    <span className="text-sm font-medium text-gray-700">
      Featured Service
    </span>
  </label>
</div>
                  </div>
                </Card>
              </div>

              {/* Card 5: Intake Form (full width) */}
              <div className="mt-6">
                <Card
                  icon={<ClipboardList size={18} />}
                  title="Custom Intake Form"
                >
                  <IntakeFormBuilder
                    fields={form.intake_form_schema}
                    onChange={(fields) =>
                      setForm({ ...form, intake_form_schema: fields })
                    }
                  />
                </Card>
              </div>
            </form>
          ) : (
            /* Gallery step */
            <Card
              icon={<FileText size={18} />}
              title="Service Images"
              className="h-full"
            >
              {offeringId ? (
                <ServiceOfferingImageGallery
                  companySlug={companySlug}
                  offeringId={offeringId}
                  onShowToast={onShowToast}
                />
              ) : (
                <div className="py-12 text-center text-gray-400">
                  Service must be saved first to manage images.
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ── Sticky Footer ── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          {step === "details" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="service-form"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6750A4] text-white text-sm font-medium rounded-xl hover:bg-[#6750A4] disabled:opacity-50 transition shadow-sm"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue to Images
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("details")}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Details
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2.5 bg-[#6750A4] text-white text-sm font-medium rounded-xl hover:bg-[#6750A4] transition shadow-sm"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}