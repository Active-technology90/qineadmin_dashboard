import React, { useState, useEffect } from "react";
import { DragDropImageUpload } from "../../ui/DragDropImageUpload";
import type { Category, SubCategory } from "../../../types";
import LocationPickerModal from "./LocationPickerModal";
import { 
  MapPin, Building2, Shield, Users, Truck, Car, FileText, 
  Award, IdCard, FileCheck, Store, Check, Camera, XCircle 
} from "lucide-react";

export interface CompanyFormData {
  name: string;
  name_am: string;
  slug: string;
  head_company: number | null;
  category: number;
  sub_category: number;
  business_type: string;
  address: string;
  address_am: string;
  description: string;
  description_am: string;
  minimum_order_total: string;
  latitude: string;
  longitude: string;
  delivery_fee_per_km: string;
  is_active: boolean;
  is_featured: boolean;
  supports_table_service: boolean;
  logo: File | null;
  cover_image: File | null;
  registration_type?: "vendor" | "service_provider" | "delivery_partner";
  full_name?: string;
  national_id?: string;
  skills?: string;
  experience_years?: number;
  driver_license?: string;
  vehicle_registration?: string;
  vehicle_type?: string;
  insurance_document?: string;
  license_number?: string;
  tin_number?: string;
  license_document?: File | null;
  tin_document?: File | null;
  national_id_document?: File | null;
  certificate_document?: File | null;
  driver_license_document?: File | null;
  vehicle_document?: File | null;
  insurance_document_file?: File | null;
  phone?: string;
  email?: string;
}

interface CompanyFormProps {
  formData: CompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>;
  formErrors: Record<string, string>;
  categories: Category[];
  subcategories: SubCategory[];
  logoPreview: string | null;
  coverPreview: string | null;
  isEditingActive: boolean;
  submitting: boolean;
  editingSlug: string | null;
  headCompanyName?: string | null;
  currentStep?: number;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function CompanyForm({
  formData,
  setFormData,
  formErrors,
  categories,
  subcategories,
  logoPreview,
  coverPreview,
  isEditingActive,
  headCompanyName,
  submitting,
  editingSlug,
  currentStep = 0,
  onSubmit,
  onClose,
}: CompanyFormProps) {
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.category === formData.category,
  );

  const [showMapPicker, setShowMapPicker] = useState(false);

  useEffect(() => {
    if (!formData.registration_type) {
      const bizType = formData.business_type;
      let regType: "vendor" | "service_provider" | "delivery_partner" = "vendor";
      if (bizType === "brand" || bizType === "store") {
        regType = "vendor";
      } else if (bizType === "service") {
        regType = "service_provider";
      } else if (bizType === "delivery") {
        regType = "delivery_partner";
      }
      setFormData(prev => ({ ...prev, registration_type: regType }));
    }
  }, [formData.business_type, formData.registration_type, setFormData]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // ==================== STEP 1: BASIC INFORMATION ====================
  const renderStep1 = () => (
    <div className="space-y-4">
{/* Registration Type Selector - Compact Horizontal */}
<div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200">
  <div className="flex items-center gap-2 mb-3">
    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/40" />
    <label className="block text-sm font-semibold text-gray-700">
      Registration Type <span className="text-red-500">*</span>
    </label>
  </div>
  
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
    {/* Vendor Option - Compact */}
    <button
      type="button"
      onClick={() => setFormData(prev => ({ ...prev, registration_type: "vendor" }))}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
        formData.registration_type === "vendor"
          ? "border-secondary bg-secondary/5 shadow-sm"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
        formData.registration_type === "vendor"
          ? "bg-secondary text-white"
          : "bg-gray-100 text-gray-500"
      }`}>
        <Store className="w-3.5 h-3.5" />
      </div>
      <span className={`text-xs font-medium ${
        formData.registration_type === "vendor" ? "text-secondary" : "text-gray-700"
      }`}>Vendor</span>
      <div className="flex gap-0.5 ml-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
      </div>
      {formData.registration_type === "vendor" && (
        <Check className="w-3.5 h-3.5 text-secondary ml-1" />
      )}
    </button>

    {/* Service Provider Option - Compact */}
    <button
      type="button"
      onClick={() => setFormData(prev => ({ ...prev, registration_type: "service_provider" }))}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
        formData.registration_type === "service_provider"
          ? "border-secondary bg-secondary/5 shadow-sm"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
        formData.registration_type === "service_provider"
          ? "bg-secondary text-white"
          : "bg-gray-100 text-gray-500"
      }`}>
        <Users className="w-3.5 h-3.5" />
      </div>
      <span className={`text-xs font-medium ${
        formData.registration_type === "service_provider" ? "text-secondary" : "text-gray-700"
      }`}>Service</span>
      <div className="flex gap-0.5 ml-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
      </div>
      {formData.registration_type === "service_provider" && (
        <Check className="w-3.5 h-3.5 text-secondary ml-1" />
      )}
    </button>

    {/* Delivery Partner Option - Compact */}
    <button
      type="button"
      onClick={() => setFormData(prev => ({ ...prev, registration_type: "delivery_partner" }))}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
        formData.registration_type === "delivery_partner"
          ? "border-secondary bg-secondary/5 shadow-sm"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
        formData.registration_type === "delivery_partner"
          ? "bg-secondary text-white"
          : "bg-gray-100 text-gray-500"
      }`}>
        <Truck className="w-3.5 h-3.5" />
      </div>
      <span className={`text-xs font-medium ${
        formData.registration_type === "delivery_partner" ? "text-secondary" : "text-gray-700"
      }`}>Delivery</span>
      <div className="flex gap-0.5 ml-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
      </div>
      {formData.registration_type === "delivery_partner" && (
        <Check className="w-3.5 h-3.5 text-secondary ml-1" />
      )}
    </button>
  </div>
  
  {/* Compact tag display - shows selected type's tags */}
  <div className="mt-2 flex flex-wrap gap-1">
    {formData.registration_type === "vendor" && (
      <>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-medium border border-blue-200/50">
          <Shield className="w-2.5 h-2.5" /> License
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[9px] font-medium border border-purple-200/50">
          <FileText className="w-2.5 h-2.5" /> TIN
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-medium border border-emerald-200/50">
          <Building2 className="w-2.5 h-2.5" /> Business
        </span>
      </>
    )}
    {formData.registration_type === "service_provider" && (
      <>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-medium border border-rose-200/50">
          <Award className="w-2.5 h-2.5" /> Skills
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-medium border border-indigo-200/50">
          <FileCheck className="w-2.5 h-2.5" /> Credentials
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-medium border border-amber-200/50">
          <IdCard className="w-2.5 h-2.5" /> National ID
        </span>
      </>
    )}
    {formData.registration_type === "delivery_partner" && (
      <>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[9px] font-medium border border-orange-200/50">
          <Car className="w-2.5 h-2.5" /> Driver License
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded-md text-[9px] font-medium border border-cyan-200/50">
          <Car className="w-2.5 h-2.5" /> Vehicle
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[9px] font-medium border border-green-200/50">
          <FileCheck className="w-2.5 h-2.5" /> Insurance
        </span>
      </>
    )}
  </div>
</div>

      {/* Vendor Info */}
      {formData.registration_type === "vendor" && (
        <>
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Building2 className="w-4 h-4" />
              <p className="text-xs font-medium">Vendor Registration - Business Information</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter company name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full border rounded-xl p-3 text-sm ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name (Amharic)
              </label>
              <input
                type="text"
                placeholder="Enter company name in Amharic"
                value={formData.name_am}
                onChange={(e) => setFormData({ ...formData, name_am: e.target.value })}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., my-company-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                disabled={!!editingSlug}
                className={`w-full border rounded-xl p-3 text-sm font-mono ${
                  formErrors.slug ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition ${editingSlug ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
              />
              {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.business_type}
                onChange={(e) => {
                  const value = e.target.value;
                  let registrationType = formData.registration_type || "vendor";
                  if (value === "brand" || value === "store") {
                    registrationType = "vendor";
                  } else if (value === "service") {
                    registrationType = "service_provider";
                  } else if (value === "delivery") {
                    registrationType = "delivery_partner";
                  }
                  setFormData({ ...formData, business_type: value, registration_type: registrationType });
                }}
                className={`w-full border rounded-xl p-3 text-sm font-medium transition-all duration-200 ${
                  formErrors.business_type ? "border-red-500" : 
                  formData.business_type === "brand" || formData.business_type === "store" ? "border-blue-500 bg-blue-50/30 text-blue-700" :
                  formData.business_type === "service" ? "border-purple-500 bg-purple-50/30 text-purple-700" :
                  formData.business_type === "delivery" ? "border-orange-500 bg-orange-50/30 text-orange-700" :
                  "border-gray-300 bg-white"
                } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
              >
                <option value="">Select Business Type</option>
                <option value="brand" className="text-blue-600">🏢 Company</option>
                <option value="store" className="text-blue-600">🏪 Store</option>
                <option value="service" className="text-purple-600">🛠️ Service</option>
                <option value="delivery" className="text-orange-600">🚚 Delivery</option>
              </select>
              {formErrors.business_type && <p className="text-red-500 text-xs mt-1">{formErrors.business_type}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const catId = Number(e.target.value);
                  setFormData({ ...formData, category: catId, sub_category: 0 });
                }}
                className={`w-full border rounded-xl p-3 text-sm ${
                  formErrors.category ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition bg-white`}
              >
                <option value={0}>Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.sub_category}
                onChange={(e) => setFormData({ ...formData, sub_category: Number(e.target.value) })}
                disabled={!formData.category}
                className={`w-full border rounded-xl p-3 text-sm ${
                  !formData.category ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                } ${formErrors.sub_category ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
              >
                <option value={0}>Select Subcategory</option>
                {filteredSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
              {formErrors.sub_category && <p className="text-red-500 text-xs mt-1">{formErrors.sub_category}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              placeholder="Enter company description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition resize-none"
            />
          </div>
        </>
      )}

      {/* Service Provider Info */}
      {formData.registration_type === "service_provider" && (
        <>
          <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-3">
            <div className="flex items-center gap-2 text-purple-700">
              <Users className="w-4 h-4" />
              <p className="text-xs font-medium">Service Provider - Personal Information & Skills</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                value={formData.full_name || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                className={`w-full border rounded-xl p-3 text-sm ${
                  formErrors.full_name ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
              />
              {formErrors.full_name && <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                National ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter national ID number"
                value={formData.national_id || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, national_id: e.target.value }))}
                className={`w-full border rounded-xl p-3 text-sm ${
                  formErrors.national_id ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
              />
              {formErrors.national_id && <p className="text-red-500 text-xs mt-1">{formErrors.national_id}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills / Services Offered <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="List your skills, qualifications, and services"
              value={formData.skills || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, skills: e.target.value }))}
              rows={3}
              className={`w-full border rounded-xl p-3 text-sm ${
                formErrors.skills ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition resize-none`}
            />
            {formErrors.skills && <p className="text-red-500 text-xs mt-1">{formErrors.skills}</p>}
          </div>
        </>
      )}

      {/* Delivery Partner Info */}
      {formData.registration_type === "delivery_partner" && (
        <>
          <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-3">
            <div className="flex items-center gap-2 text-orange-700">
              <Truck className="w-4 h-4" />
              <p className="text-xs font-medium">Delivery Partner - Driver & Vehicle Information</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter full name"
              value={formData.full_name || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              className={`w-full border rounded-xl p-3 text-sm ${
                formErrors.full_name ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
            />
            {formErrors.full_name && <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver License <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter driver license number"
                value={formData.driver_license || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, driver_license: e.target.value }))}
                className={`w-full border rounded-xl p-3 text-sm ${
                  formErrors.driver_license ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
              />
              {formErrors.driver_license && <p className="text-red-500 text-xs mt-1">{formErrors.driver_license}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Registration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter vehicle registration number"
                value={formData.vehicle_registration || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, vehicle_registration: e.target.value }))}
                className={`w-full border rounded-xl p-3 text-sm ${
                  formErrors.vehicle_registration ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
              />
              {formErrors.vehicle_registration && <p className="text-red-500 text-xs mt-1">{formErrors.vehicle_registration}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vehicle_type || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, vehicle_type: e.target.value }))}
              className={`w-full border rounded-xl p-3 text-sm ${
                formErrors.vehicle_type ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition bg-white`}
            >
              <option value="">Select Vehicle Type</option>
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="bicycle">Bicycle</option>
              <option value="scooter">Scooter</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
            </select>
            {formErrors.vehicle_type && <p className="text-red-500 text-xs mt-1">{formErrors.vehicle_type}</p>}
          </div>
        </>
      )}
    </div>
  );

  // ==================== STEP 2: LOCATION & CONTACT ====================
  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Street, city, area..."
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className={`w-full border rounded-xl p-3 text-sm ${
            formErrors.address ? "border-red-500" : "border-gray-300"
          } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
        />
        {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="+251 911 234 567"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`w-full border rounded-xl p-3 text-sm ${
              formErrors.phone ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
          />
          {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="info@company.com"
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full border rounded-xl p-3 text-sm ${
              formErrors.email ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
          />
          {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Company Location (GPS)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm pr-12 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">LAT</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm pr-12 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">LON</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowMapPicker(true)}
          className="mt-2 w-full py-3 border-2 border-dashed border-secondary/40 hover:border-secondary hover:bg-purple-50/30 text-secondary rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          Choose Location on Map Picker
        </button>
      </div>
    </div>
  );

  // ==================== STEP 3: MEDIA & DOCUMENTS ====================
  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Logo & Cover Image Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/40" />
          <h3 className="text-sm font-bold text-secondary">Company Media</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center transition-all hover:border-secondary hover:bg-gray-50/80 min-h-[180px]">
              <input
                type="file"
                id="logo-upload"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      alert("File must be smaller than 5MB");
                      return;
                    }
                    setFormData((prev) => ({ ...prev, logo: file }));
                  }
                }}
              />
              {logoPreview ? (
                <div className="relative w-full flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg ring-2 ring-secondary/20">
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, logo: null }));
                      const fileInput = document.getElementById("logo-upload") as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label htmlFor="logo-upload" className="flex flex-col items-center justify-center cursor-pointer w-full py-4 group">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2 group-hover:bg-secondary/20 transition">
                    <Camera className="w-6 h-6 text-secondary group-hover:scale-110 transition" />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">Upload Logo</span>
                  <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                  <span className="text-xs text-gray-400 mt-1">Square image recommended (1:1)</span>
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center transition-all hover:border-secondary hover:bg-gray-50/80 min-h-[180px]">
              <input
                type="file"
                id="cover-upload"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      alert("File must be smaller than 10MB");
                      return;
                    }
                    setFormData((prev) => ({ ...prev, cover_image: file }));
                  }
                }}
              />
              {coverPreview ? (
                <div className="relative w-full flex flex-col items-center">
                  <div className="w-full max-h-32 overflow-hidden rounded-xl shadow-lg">
                    <img src={coverPreview} alt="Cover Preview" className="w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, cover_image: null }));
                      const fileInput = document.getElementById("cover-upload") as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label htmlFor="cover-upload" className="flex flex-col items-center justify-center cursor-pointer w-full py-4 group">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2 group-hover:bg-secondary/20 transition">
                    <Camera className="w-6 h-6 text-secondary group-hover:scale-110 transition" />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">Upload Cover Image</span>
                  <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                  <span className="text-xs text-gray-400 mt-1">Wide banner recommended (16:9)</span>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* License & Tax Information - Only for Vendor */}
      {formData.registration_type === "vendor" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/40" />
            <h3 className="text-sm font-bold text-secondary">License & Tax Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter business license number"
                  value={formData.license_number || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, license_number: e.target.value }))}
                  className={`w-full border rounded-xl p-3 text-sm pl-10 ${
                    formErrors.license_number ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
                />
              </div>
              {formErrors.license_number && <p className="text-red-500 text-xs mt-1">{formErrors.license_number}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TIN Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter TIN number"
                  value={formData.tin_number || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tin_number: e.target.value }))}
                  className={`w-full border rounded-xl p-3 text-sm pl-10 ${
                    formErrors.tin_number ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
                />
              </div>
              {formErrors.tin_number && <p className="text-red-500 text-xs mt-1">{formErrors.tin_number}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Verification Documents */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/40" />
          <h3 className="text-sm font-bold text-secondary">Verification Documents</h3>
        </div>

        {/* Vendor Documents */}
        {formData.registration_type === "vendor" && (
          <div className="space-y-4">
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Shield className="w-4 h-4" />
                <p className="text-xs font-medium">Vendor Verification Documents</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Document <span className="text-red-500">*</span>
                </label>
                {formData.license_document ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{formData.license_document.name}</p>
                      <p className="text-xs text-emerald-600">✓ Uploaded ({(formData.license_document.size / 1024).toFixed(1)} KB)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, license_document: null }));
                        const input = document.getElementById('vendor-license-input') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="vendor-license-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData(prev => ({ ...prev, license_document: file }));
                      }}
                      className={`w-full border rounded-xl p-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 ${
                        formErrors.license_document ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                )}
                {formErrors.license_document && <p className="text-red-500 text-xs mt-1">{formErrors.license_document}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TIN Document <span className="text-red-500">*</span>
                </label>
                {formData.tin_document ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{formData.tin_document.name}</p>
                      <p className="text-xs text-emerald-600">✓ Uploaded ({(formData.tin_document.size / 1024).toFixed(1)} KB)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, tin_document: null }));
                        const input = document.getElementById('vendor-tin-input') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="vendor-tin-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData(prev => ({ ...prev, tin_document: file }));
                      }}
                      className={`w-full border rounded-xl p-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 ${
                        formErrors.tin_document ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                )}
                {formErrors.tin_document && <p className="text-red-500 text-xs mt-1">{formErrors.tin_document}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Service Provider Documents */}
        {formData.registration_type === "service_provider" && (
          <div className="space-y-4">
            <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-purple-700">
                <IdCard className="w-4 h-4" />
                <p className="text-xs font-medium">Service Provider Verification Documents</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  National ID Document <span className="text-red-500">*</span>
                </label>
                {formData.national_id_document ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{formData.national_id_document.name}</p>
                      <p className="text-xs text-emerald-600">✓ Uploaded ({(formData.national_id_document.size / 1024).toFixed(1)} KB)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, national_id_document: null }));
                        const input = document.getElementById('service-national-id-input') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="service-national-id-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData(prev => ({ ...prev, national_id_document: file }));
                      }}
                      className={`w-full border rounded-xl p-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 ${
                        formErrors.national_id_document ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                )}
                {formErrors.national_id_document && <p className="text-red-500 text-xs mt-1">{formErrors.national_id_document}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate / Credential
                </label>
                {formData.certificate_document ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{formData.certificate_document.name}</p>
                      <p className="text-xs text-emerald-600">✓ Uploaded ({(formData.certificate_document.size / 1024).toFixed(1)} KB)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, certificate_document: null }));
                        const input = document.getElementById('service-certificate-input') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="service-certificate-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData(prev => ({ ...prev, certificate_document: file }));
                      }}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">Upload certificates or credentials (Optional)</p>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Partner Documents */}
        {formData.registration_type === "delivery_partner" && (
          <div className="space-y-4">
            <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-orange-700">
                <Car className="w-4 h-4" />
                <p className="text-xs font-medium">Delivery Partner Verification Documents</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Document <span className="text-red-500">*</span>
                </label>
                {formData.driver_license_document ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{formData.driver_license_document.name}</p>
                      <p className="text-xs text-emerald-600">✓ Uploaded ({(formData.driver_license_document.size / 1024).toFixed(1)} KB)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, driver_license_document: null }));
                        const input = document.getElementById('delivery-license-input') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="delivery-license-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData(prev => ({ ...prev, driver_license_document: file }));
                      }}
                      className={`w-full border rounded-xl p-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 ${
                        formErrors.driver_license_document ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                )}
                {formErrors.driver_license_document && <p className="text-red-500 text-xs mt-1">{formErrors.driver_license_document}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Document <span className="text-red-500">*</span>
                </label>
                {formData.vehicle_document ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{formData.vehicle_document.name}</p>
                      <p className="text-xs text-emerald-600">✓ Uploaded ({(formData.vehicle_document.size / 1024).toFixed(1)} KB)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, vehicle_document: null }));
                        const input = document.getElementById('delivery-vehicle-input') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="delivery-vehicle-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData(prev => ({ ...prev, vehicle_document: file }));
                      }}
                      className={`w-full border rounded-xl p-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 ${
                        formErrors.vehicle_document ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </div>
                )}
                {formErrors.vehicle_document && <p className="text-red-500 text-xs mt-1">{formErrors.vehicle_document}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Document
                </label>
                {formData.insurance_document_file ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{formData.insurance_document_file.name}</p>
                      <p className="text-xs text-emerald-600">✓ Uploaded ({(formData.insurance_document_file.size / 1024).toFixed(1)} KB)</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, insurance_document_file: null }));
                        const input = document.getElementById('delivery-insurance-input') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="delivery-insurance-input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData(prev => ({ ...prev, insurance_document_file: file }));
                      }}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">Insurance document (Optional)</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Status Summary */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-4 h-4 text-secondary" />
            <p className="text-xs font-medium text-gray-700">Upload Status</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className={`flex items-center gap-1 ${logoPreview ? 'text-emerald-600' : 'text-gray-400'}`}>
              {logoPreview ? '✅' : '⬜'} Logo
            </span>
            <span className={`flex items-center gap-1 ${coverPreview ? 'text-emerald-600' : 'text-gray-400'}`}>
              {coverPreview ? '✅' : '⬜'} Cover
            </span>
            {formData.registration_type === "vendor" && (
              <>
                <span className={`flex items-center gap-1 ${formData.license_document ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {formData.license_document ? '✅' : '⬜'} License
                </span>
                <span className={`flex items-center gap-1 ${formData.tin_document ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {formData.tin_document ? '✅' : '⬜'} TIN
                </span>
              </>
            )}
            {formData.registration_type === "service_provider" && (
              <>
                <span className={`flex items-center gap-1 ${formData.national_id_document ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {formData.national_id_document ? '✅' : '⬜'} National ID
                </span>
                <span className={`flex items-center gap-1 ${formData.certificate_document ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {formData.certificate_document ? '✅' : '⬜'} Certificate
                </span>
              </>
            )}
            {formData.registration_type === "delivery_partner" && (
              <>
                <span className={`flex items-center gap-1 ${formData.driver_license_document ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {formData.driver_license_document ? '✅' : '⬜'} License
                </span>
                <span className={`flex items-center gap-1 ${formData.vehicle_document ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {formData.vehicle_document ? '✅' : '⬜'} Vehicle
                </span>
                <span className={`flex items-center gap-1 ${formData.insurance_document_file ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {formData.insurance_document_file ? '✅' : '⬜'} Insurance
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== STEP 4: REVIEW & SUMMARY ====================
  const renderStep4 = () => (
    <div className="space-y-3 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="h-6 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary-light" />
        <div>
          <h2 className="text-sm font-bold text-secondary">Review Your Company Details</h2>
          <p className="text-[10px] text-secondary/60">Verify all information before registration</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="text-[11px] font-bold text-secondary-light flex items-center gap-1">
            <span className="text-sm">📋</span> Information
          </h3>
        </div>
        {formData.registration_type === "vendor" && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-[9px] text-gray-400 uppercase tracking-wider">Company Name</p><p className="text-xs font-semibold text-gray-800 truncate">{formData.name || '—'}</p></div>
            <div><p className="text-[9px] text-gray-400 uppercase tracking-wider">Slug</p><p className="text-xs font-mono text-gray-700 truncate">{formData.slug || '—'}</p></div>
            <div><p className="text-[9px] text-gray-400 uppercase tracking-wider">Business Type</p><p className="text-xs font-semibold text-gray-800 capitalize truncate">{formData.business_type || '—'}</p></div>
            <div><p className="text-[9px] text-gray-400 uppercase tracking-wider">Category</p><p className="text-xs font-semibold text-gray-800 truncate">{categories.find(c => c.id === formData.category)?.name || '—'}</p></div>
          </div>
        )}
        {formData.registration_type === "service_provider" && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-[9px] text-gray-400 uppercase tracking-wider">Full Name</p><p className="text-xs font-semibold text-gray-800 truncate">{formData.full_name || '—'}</p></div>
            <div><p className="text-[9px] text-gray-400 uppercase tracking-wider">National ID</p><p className="text-xs font-semibold text-gray-800 truncate">{formData.national_id || '—'}</p></div>
            <div className="col-span-2"><p className="text-[9px] text-gray-400 uppercase tracking-wider">Skills</p><p className="text-xs font-semibold text-gray-800 truncate">{formData.skills || '—'}</p></div>
          </div>
        )}
        {formData.registration_type === "delivery_partner" && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-[9px] text-gray-400 uppercase tracking-wider">Driver License</p><p className="text-xs font-semibold text-gray-800 truncate">{formData.driver_license || '—'}</p></div>
            <div><p className="text-[9px] text-gray-400 uppercase tracking-wider">Vehicle Type</p><p className="text-xs font-semibold text-gray-800 truncate">{formData.vehicle_type || '—'}</p></div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="text-[11px] font-bold text-secondary-light flex items-center gap-1">
            <span className="text-sm">📍</span> Location & Contact
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="col-span-2"><p className="text-[9px] text-gray-400 uppercase tracking-wider">Address</p><p className="text-xs font-semibold text-gray-800 truncate">{formData.address || '—'}</p></div>
          <div><p className="text-[9px] text-gray-400 uppercase tracking-wider">Phone</p><p className="text-xs font-semibold text-gray-800 truncate">{formData.phone || '—'}</p></div>
          <div><p className="text-[9px] text-gray-400 uppercase tracking-wider">Email</p><p className="text-xs font-semibold text-gray-800 truncate">{formData.email || '—'}</p></div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="text-[11px] font-bold text-secondary-light flex items-center gap-1">
            <span className="text-sm">🖼️</span> Media
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3 text-center border-2 border-dashed border-gray-200 min-h-[80px] flex flex-col items-center justify-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Logo</p>
            {logoPreview ? <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md"><img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /></div> : <p className="text-[10px] text-gray-400">No logo</p>}
          </div>
          <div className="bg-white rounded-lg p-3 text-center border-2 border-dashed border-gray-200 min-h-[80px] flex flex-col items-center justify-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Cover</p>
            {coverPreview ? <div className="relative w-full h-12 rounded-xl overflow-hidden shadow-md"><img src={coverPreview} alt="Cover" className="w-full h-full object-cover" /></div> : <p className="text-[10px] text-gray-400">No cover</p>}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-2.5 border border-emerald-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-emerald-700">✅ Ready</span>
          <span className="text-[10px] text-emerald-600">4/4 steps complete</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{formData.name ? '✅' : '❌'} Name</span>
          <span className="text-[10px] text-gray-500">{formData.slug ? '✅' : '❌'} Slug</span>
        </div>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col lg:flex-row lg:divide-x lg:divide-gray-100"
    >
      <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin max-h-[calc(100vh-160px)]">
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
        {currentStep === 3 && renderStep4()}
      </div>

      {/* Location Picker Modal */}
      {showMapPicker && (
        <LocationPickerModal
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onSelect={(selectedLat, selectedLon) => {
            setFormData((prev) => ({
              ...prev,
              latitude: selectedLat,
              longitude: selectedLon,
            }));
          }}
          onSelectAddress={(address) => {
            setFormData((prev) => ({
              ...prev,
              address: address,
            }));
          }}
          initialLat={formData.latitude}
          initialLon={formData.longitude}
          initialAddress={formData.address}
        />
      )}
    </form>
  );
}