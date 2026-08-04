// src/components/admin/service-management/ServiceFormModal.tsx
import React, { useState, useEffect } from "react";
import {
  X, MapPin, Package, Settings, Save, ArrowLeft, ArrowRight,
  CheckCircle, ImageIcon, AlertCircle
} from "lucide-react";
import type { Service, Category } from "../../../types";
import type { ServiceGroup } from "../../../mock/serviceApi";
import LocationPickerModal from "../CompanyManagement/LocationPickerModal";
import ServiceFieldsModal from "./ServiceFieldsModal";
import { updateServiceFields, fetchServiceGroups } from "../../../mock/serviceApi";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  mode: "create" | "edit" | "view";
  categories: Category[];
  onSubmit: (data: any) => Promise<void>;
  readOnly: boolean;
  allCompanies: { id: number; name: string }[];
}

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ServiceFormModal({
  isOpen,
  onClose,
  service,
  mode,
  categories,
  onSubmit,
  readOnly,
  allCompanies,
}: ServiceFormModalProps) {
  const [formData, setFormData] = useState<any>({
    title: "",
    title_am: "",
    description: "",
    description_am: "",
    slug: "",
    pricing_type: "fixed",
    price: "0.00",
    currency: "ETB",
    duration_minutes: 30,
    booking_mode: "direct",
    payment_policy: "upfront",
    deposit_percentage: "0.00",
    service_category: "",
    tags: [],
    intake_form_schema: [],
    is_active: true,
    is_featured: false,
    address: "",
    address_am: "",
    latitude: "",
    longitude: "",
    company_ids: [],
    group_id: null as number | null,
    group_name: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [groups, setGroups] = useState<ServiceGroup[]>([]);

  // Fetch service groups
  useEffect(() => {
    fetchServiceGroups().then(setGroups);
  }, []);

  useEffect(() => {
    if (service && (mode === "edit" || mode === "view")) {
      setFormData({
        ...service,
        service_category: service.service_category || "",
        tags: service.tags || [],
        intake_form_schema: service.intake_form_schema || [],
        company_ids: service.company_ids || [],
        address: service.address || "",
        address_am: service.address_am || "",
        latitude: service.latitude || "",
        longitude: service.longitude || "",
        group_id: service.group_id ?? null,
        group_name: service.group_name || "",
      });
    } else {
      setFormData({
        title: "",
        title_am: "",
        description: "",
        description_am: "",
        slug: "",
        pricing_type: "fixed",
        price: "0.00",
        currency: "ETB",
        duration_minutes: 30,
        booking_mode: "direct",
        payment_policy: "upfront",
        deposit_percentage: "0.00",
        service_category: "",
        tags: [],
        intake_form_schema: [],
        is_active: true,
        is_featured: false,
        address: "",
        address_am: "",
        latitude: "",
        longitude: "",
        company_ids: [],
        group_id: null,
        group_name: "",
      });
    }
    setErrors({});
  }, [service, mode]);

  useEffect(() => {
    if (mode === "create" && formData.title && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [formData.title, mode]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.slug?.trim()) newErrors.slug = "Slug is required";
    if (!formData.service_category) newErrors.service_category = "Category is required";
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0)
      newErrors.price = "Price must be a positive number";
    if (formData.duration_minutes < 1) newErrors.duration_minutes = "Duration must be at least 1 minute";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price).toFixed(2),
        deposit_percentage: parseFloat(formData.deposit_percentage || "0").toFixed(2),
        duration_minutes: parseInt(formData.duration_minutes, 10),
        company_ids: formData.company_ids || [],
        intake_form_schema: formData.intake_form_schema || [],
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldsSave = async (slug: string, fields: any[]) => {
    setFormData(prev => ({ ...prev, intake_form_schema: fields }));
    if (mode === "edit" && service?.slug) {
      try {
        await updateServiceFields(slug, fields);
      } catch (error) {
        console.error("Failed to update fields:", error);
      }
    }
  };

  const steps = [
    { id: 0, label: "Basic Info", icon: Package },
    { id: 1, label: "Location", icon: MapPin },
    { id: 2, label: "Media & SEO", icon: ImageIcon },
    { id: 3, label: "Fields & Companies", icon: Settings },
  ];
  const isViewMode = mode === "view";

  // ─── BASIC INFO ─────────────────────────────────
  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
            disabled={isViewMode} className={`w-full border rounded-xl p-3 text-sm ${errors.title ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100`} />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title (Amharic)</label>
          <input type="text" value={formData.title_am} onChange={e => setFormData({...formData, title_am: e.target.value})}
            disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})}
            disabled={isViewMode || mode === "edit"} className={`w-full border rounded-xl p-3 text-sm font-mono ${errors.slug ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100`} />
          {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Category *</label>
          <input type="text" list="categories" value={formData.service_category} onChange={e => setFormData({...formData, service_category: e.target.value})}
            disabled={isViewMode} className={`w-full border rounded-xl p-3 text-sm ${errors.service_category ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100`} placeholder="Type or select category" />
          <datalist id="categories">
            {categories.map(cat => <option key={cat.id} value={cat.name} />)}
          </datalist>
          {errors.service_category && <p className="text-red-500 text-xs mt-1">{errors.service_category}</p>}
        </div>
      </div>

      {/* Service Group Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Group</label>
        <select
          value={formData.group_id || ""}
          onChange={(e) => {
            const id = Number(e.target.value) || null;
            const group = groups.find(g => g.id === id);
            setFormData({ ...formData, group_id: id, group_name: group?.name || "" });
          }}
          disabled={isViewMode}
          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100 bg-white"
        >
          <option value="">— None —</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Type</label>
          <select value={formData.pricing_type} onChange={e => setFormData({...formData, pricing_type: e.target.value})}
            disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100 bg-white">
            <option value="fixed">Fixed</option>
            <option value="variable">Variable</option>
            <option value="free">Free</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
          <input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
            disabled={isViewMode} className={`w-full border rounded-xl p-3 text-sm ${errors.price ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100`} />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <input type="text" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}
            disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
          <input type="number" min="1" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})}
            disabled={isViewMode} className={`w-full border rounded-xl p-3 text-sm ${errors.duration_minutes ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100`} />
          {errors.duration_minutes && <p className="text-red-500 text-xs mt-1">{errors.duration_minutes}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Booking Mode</label>
          <select value={formData.booking_mode} onChange={e => setFormData({...formData, booking_mode: e.target.value})}
            disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100 bg-white">
            <option value="direct">Direct</option>
            <option value="request">Request</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Policy</label>
          <select value={formData.payment_policy} onChange={e => setFormData({...formData, payment_policy: e.target.value})}
            disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100 bg-white">
            <option value="upfront">Upfront</option>
            <option value="deposit">Deposit</option>
            <option value="free">Free</option>
          </select>
        </div>
        {formData.payment_policy === "deposit" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit %</label>
            <input type="number" step="0.01" min="0" max="100" value={formData.deposit_percentage} onChange={e => setFormData({...formData, deposit_percentage: e.target.value})}
              disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100" />
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
          disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition resize-none disabled:bg-gray-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Amharic)</label>
        <textarea rows={2} value={formData.description_am} onChange={e => setFormData({...formData, description_am: e.target.value})}
          disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition resize-none disabled:bg-gray-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
        <input type="text" value={formData.tags?.join(", ") || ""} onChange={e => setFormData({...formData, tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})}
          disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100" />
      </div>
      <div className="flex items-center gap-6">
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} disabled={isViewMode} />
          <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">Active</span>
        </label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} disabled={isViewMode} />
          <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">Featured</span>
        </label>
      </div>
    </div>
  );

  // ─── LOCATION ────────────────────────────────────
  const renderLocation = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
        <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
          disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address (Amharic)</label>
        <input type="text" value={formData.address_am} onChange={e => setFormData({...formData, address_am: e.target.value})}
          disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">GPS Coordinates</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input type="number" step="any" placeholder="Latitude" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})}
              disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm pr-12 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">LAT</span>
          </div>
          <div className="relative">
            <input type="number" step="any" placeholder="Longitude" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})}
              disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm pr-12 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">LON</span>
          </div>
        </div>
        {!isViewMode && (
          <button type="button" onClick={() => setShowMapPicker(true)} className="mt-2 w-full py-3 border-2 border-dashed border-secondary/40 hover:border-secondary hover:bg-purple-50/30 text-secondary rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
            <MapPin className="h-4 w-4" /> Choose Location on Map
          </button>
        )}
      </div>
    </div>
  );

  // ─── MEDIA & SEO ─────────────────────────────────
  const renderMediaSEO = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Icon / Logo</label>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center transition-all hover:border-secondary hover:bg-gray-50/80 min-h-[140px]">
            {formData.icon ? (
              <div className="relative w-full flex flex-col items-center">
                <img src={formData.icon} alt="Icon" className="w-16 h-16 rounded-xl object-cover shadow-md" />
                {!isViewMode && <button type="button" onClick={() => setFormData({...formData, icon: ""})} className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition">Remove</button>}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center cursor-default w-full py-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2"><ImageIcon className="w-6 h-6 text-secondary" /></div>
                {!isViewMode && <><span className="text-sm font-semibold text-gray-600">Upload Icon</span><span className="text-xs text-gray-400">PNG, JPG up to 5MB</span></>}
                {isViewMode && <span className="text-xs text-gray-400">No icon</span>}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
          <input type="text" value={formData.meta_title || ""} onChange={e => setFormData({...formData, meta_title: e.target.value})} disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100" />
          <label className="block text-sm font-medium text-gray-700 mt-3">Meta Description</label>
          <textarea rows={2} value={formData.meta_description || ""} onChange={e => setFormData({...formData, meta_description: e.target.value})} disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition resize-none disabled:bg-gray-100" />
          <label className="block text-sm font-medium text-gray-700 mt-3">Keywords</label>
          <input type="text" value={formData.keywords || ""} onChange={e => setFormData({...formData, keywords: e.target.value})} disabled={isViewMode} className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition disabled:bg-gray-100" />
        </div>
      </div>
    </div>
  );

  // ─── FIELDS & COMPANIES ──────────────────────────
  const renderFieldsCompanies = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Companies</label>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
          {allCompanies.map(company => {
            const checked = (formData.company_ids || []).includes(company.id);
            return (
              <label key={company.id} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={checked} onChange={() => {
                  if (isViewMode) return;
                  const ids = formData.company_ids || [];
                  setFormData({...formData, company_ids: checked ? ids.filter(id => id !== company.id) : [...ids, company.id]});
                }} disabled={isViewMode} className="rounded border-gray-300 text-secondary focus:ring-secondary/30" />
                <span className="text-sm text-gray-700">{company.name}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Intake Form Schema</label>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          {!formData.intake_form_schema || formData.intake_form_schema.length === 0 ? (
            <p className="text-sm text-gray-500">No fields defined.</p>
          ) : (
            <div className="space-y-2">
              {formData.intake_form_schema.map((field: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm bg-white p-2 rounded-lg border border-gray-200">
                  <span className="font-medium">{field.label}</span>
                  <span className="text-xs text-gray-400">({field.type})</span>
                  {field.required && <span className="text-red-500 text-xs">*</span>}
                </div>
              ))}
            </div>
          )}
          {!isViewMode && (
            <button
              type="button"
              onClick={() => setShowFieldsModal(true)}
              className="mt-3 inline-flex items-center gap-2 text-sm text-secondary hover:text-secondary-dark"
            >
              <Settings size={16} /> Manage Fields
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800">
                {mode === "create" && "Create Service"}
                {mode === "edit" && "Edit Service"}
                {mode === "view" && "Service Details"}
              </h2>
              {mode === "view" && <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">View Only</span>}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-500" /></button>
          </div>

          {/* Step indicators */}
          {!isViewMode && (
            <div className="flex border-b border-gray-200 px-6 py-3 shrink-0 overflow-x-auto">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                return (
                  <button key={step.id} type="button" onClick={() => setCurrentStep(index)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${isActive ? "bg-secondary text-white" : isCompleted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {isCompleted ? <CheckCircle size={14} /> : <Icon size={14} />}
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 0 && renderBasicInfo()}
            {currentStep === 1 && renderLocation()}
            {currentStep === 2 && renderMediaSEO()}
            {currentStep === 3 && renderFieldsCompanies()}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 shrink-0 flex items-center justify-between bg-gray-50/80">
            <div className="flex gap-2">
              {!isViewMode && currentStep > 0 && (
                <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="inline-flex items-center gap-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <ArrowLeft size={16} /> Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {!isViewMode && currentStep < steps.length - 1 && (
                <button type="button" onClick={() => setCurrentStep(currentStep + 1)} className="inline-flex items-center gap-1 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary-dark transition">
                  Next <ArrowRight size={16} />
                </button>
              )}
              {isViewMode ? (
                <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Close</button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-secondary-dark hover:shadow-md transition disabled:opacity-70">
                  {isSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</> : <><Save size={16} /> {mode === "create" ? "Create" : "Update"}</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showMapPicker && (
        <LocationPickerModal
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onSelect={(lat, lon) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }))}
          onSelectAddress={(address) => setFormData(prev => ({ ...prev, address }))}
          initialLat={formData.latitude}
          initialLon={formData.longitude}
          initialAddress={formData.address}
        />
      )}

      {/* ── ServiceFieldsModal ── */}
      {showFieldsModal && (
        <ServiceFieldsModal
          isOpen={showFieldsModal}
          onClose={() => setShowFieldsModal(false)}
          slug={service?.slug || "new-service"}
          initialFields={formData.intake_form_schema || []}
          onSave={handleFieldsSave}
        />
      )}
    </>
  );
}