import { useEffect, useState } from "react";
import { X, Loader2, ChevronLeft, CheckCircle } from "lucide-react";
import { IntakeFormBuilder } from "./IntakeFormBuilder";
import { ServiceOfferingImageGallery } from "./ServiceOfferingImageGallery";
import type { IntakeFormField, ServiceOffering } from "../../../types";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {offering || savedOfferingId ? "Edit Service" : "Add Service"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {step === "details" ? "Step 1: Service details" : "Step 2: Upload images"}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                step === "details" ? "bg-purple-700 text-white" : "bg-purple-100 text-purple-700"
              }`}
            >
              {step === "gallery" ? <CheckCircle className="h-4 w-4" /> : "1"}
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-700 transition-all"
                style={{ width: step === "details" ? "50%" : "100%" }}
              />
            </div>
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                step === "gallery" ? "bg-purple-700 text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {step === "details" ? (
          <form onSubmit={handleSubmitDetails} className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Title (Amharic)</label>
                <input
                  value={form.title_am}
                  onChange={(e) => setForm({ ...form, title_am: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Pricing</label>
                <select
                  value={form.pricing_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pricing_type: e.target.value as typeof form.pricing_type,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="fixed">Fixed</option>
                  <option value="starting_at">Starting At</option>
                  <option value="hourly">Hourly</option>
                  <option value="custom">Quote Based</option>
                </select>
              </div>
              {form.pricing_type !== "custom" && (
                <div>
                  <label className="text-xs font-medium text-gray-600">Price (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-600">Duration (min)</label>
                <input
                  type="number"
                  min="1"
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({ ...form, duration_minutes: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Category</label>
                <input
                  value={form.service_category}
                  onChange={(e) =>
                    setForm({ ...form, service_category: e.target.value })
                  }
                  placeholder="e.g. Haircuts"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Booking Mode</label>
                <select
                  value={form.booking_mode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      booking_mode: e.target.value as typeof form.booking_mode,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="direct">Direct Booking</option>
                  <option value="inquiry">Inquiry / Lead</option>
                  {/* <option value="contact">Contact Only</option> */}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Payment Policy</label>
                <select
                  value={form.payment_policy}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payment_policy: e.target.value as typeof form.payment_policy,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="upfront">Pay Upfront</option>
                  {/* <option value="deposit">Deposit Required</option> */}
                  <option value="post_service">Pay After Service</option>
                </select>
              </div>
              {form.payment_policy === "deposit" && (
                <div>
                  <label className="text-xs font-medium text-gray-600">Deposit %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.deposit_percentage}
                    onChange={(e) =>
                      setForm({ ...form, deposit_percentage: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>

            <IntakeFormBuilder
              fields={form.intake_form_schema}
              onChange={(fields) => setForm({ ...form, intake_form_schema: fields })}
            />

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                />
                Featured
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-purple-700 text-white text-sm font-medium rounded-xl hover:bg-purple-800 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue to Images
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            {offeringId ? (
              <ServiceOfferingImageGallery
                companySlug={companySlug}
                offeringId={offeringId}
                onShowToast={onShowToast}
              />
            ) : (
              <p className="text-sm text-red-600">Could not load image gallery.</p>
            )}

            <div className="flex justify-between gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Details
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 bg-purple-700 text-white text-sm font-medium rounded-xl hover:bg-purple-800"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
