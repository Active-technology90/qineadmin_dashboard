import React, { useState } from "react";
import type { Category, SubCategory } from "../../../types";
import LocationPickerModal from "./LocationPickerModal";
import { MapPin, Building2, FileText, Camera, XCircle } from "lucide-react";

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
  chapa_sub_account_id: string;
  theme_primary: string;
  theme_dark: string;
  theme_light: string;
  tin_number: string;
  vat_registration_number: string;
  tax_type: string;
  license: File | string | null;
  contact_phone: string;
  contact_email: string;
}

interface CompanyFormProps {
  formData: CompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>;
  formErrors: Record<string, string>;
  categories: Category[];
  subcategories: SubCategory[];
  logoPreview: string | null;
  coverPreview: string | null;
  onLogoFileChange?: (file: File | null) => void;
  onCoverFileChange?: (file: File | null) => void;
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
  onLogoFileChange,
  onCoverFileChange,
  editingSlug,
  currentStep = 0,
  onSubmit,
  headCompanyName,
}: CompanyFormProps) {
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.category === formData.category,
  );

  const [showMapPicker, setShowMapPicker] = useState(false);

  // ==================== STEP 1: BASIC INFORMATION ====================
  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Business Information */}
      <div>
        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Building2 className="w-4 h-4" />
            <p className="text-xs font-medium">Business Information</p>
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full border rounded-xl p-3 text-sm ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name (Amharic)
            </label>
            <input
              type="text"
              placeholder="Enter company name in Amharic"
              value={formData.name_am}
              onChange={(e) =>
                setFormData({ ...formData, name_am: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              disabled={!!editingSlug}
              className={`w-full border rounded-xl p-3 text-sm font-mono ${
                formErrors.slug ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition ${
                editingSlug
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : ""
              }`}
            />
            {formErrors.slug && (
              <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.business_type}
              onChange={(e) =>
                setFormData({ ...formData, business_type: e.target.value })
              }
              className={`w-full border rounded-xl p-3 text-sm font-medium transition-all duration-200 ${
                formErrors.business_type ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
            >
              <option value="">Select Business Type</option>
              <option value="brand">Brand</option>
              <option value="store">Store</option>
              <option value="factory">Factory</option>
              <option value="service">Service Provider</option>
              <option value="delivery_service">Delivery Service</option>
              <option value="other">Other</option>
            </select>
            {formErrors.business_type && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.business_type}
              </p>
            )}
          </div>
        </div>

        {/* Head Company (Optional) */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Head Company (Optional)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Enter head company ID"
              value={formData.head_company ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  head_company: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
            />
            {headCompanyName && (
              <span className="text-xs text-secondary bg-secondary/10 px-3 py-2 rounded-lg whitespace-nowrap">
                {headCompanyName}
              </span>
            )}
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
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {formErrors.category && (
              <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategory <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.sub_category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sub_category: Number(e.target.value),
                })
              }
              disabled={!formData.category}
              className={`w-full border rounded-xl p-3 text-sm ${
                !formData.category
                  ? "bg-gray-100 cursor-not-allowed"
                  : "bg-white"
              } ${formErrors.sub_category ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
            >
              <option value={0}>Select Subcategory</option>
              {filteredSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            {formErrors.sub_category && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.sub_category}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            placeholder="Enter company description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition resize-none"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Amharic)
          </label>
          <textarea
            placeholder="Enter company description in Amharic"
            value={formData.description_am}
            onChange={(e) =>
              setFormData({ ...formData, description_am: e.target.value })
            }
            rows={3}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition resize-none"
          />
        </div>

        {/* Active & Featured Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Is Active
              </span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.is_featured}
                onChange={(e) =>
                  setFormData({ ...formData, is_featured: e.target.checked })
                }
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Is Featured
              </span>
            </label>
          </div>
        </div>

        {/* Supports Table Service Toggle */}
        <div className="flex items-center gap-3 mt-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.supports_table_service}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  supports_table_service: e.target.checked,
                })
              }
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              Supports Table Service
            </span>
          </label>
        </div>
      </div>
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
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          className={`w-full border rounded-xl p-3 text-sm ${
            formErrors.address ? "border-red-500" : "border-gray-300"
          } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
        />
        {formErrors.address && (
          <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address (Amharic)
        </label>
        <input
          type="text"
          placeholder="Enter address in Amharic"
          value={formData.address_am}
          onChange={(e) =>
            setFormData({ ...formData, address_am: e.target.value })
          }
          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="+251 911 234 567"
            value={formData.contact_phone}
            onChange={(e) =>
              setFormData({ ...formData, contact_phone: e.target.value })
            }
            className={`w-full border rounded-xl p-3 text-sm ${
              formErrors.contact_phone ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
          />
          {formErrors.contact_phone && (
            <p className="text-red-500 text-xs mt-1">
              {formErrors.contact_phone}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="info@company.com"
            value={formData.contact_email}
            onChange={(e) =>
              setFormData({ ...formData, contact_email: e.target.value })
            }
            className={`w-full border rounded-xl p-3 text-sm ${
              formErrors.contact_email ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
          />
          {formErrors.contact_email && (
            <p className="text-red-500 text-xs mt-1">
              {formErrors.contact_email}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Order Total
          </label>
          <input
            type="text"
            placeholder="0.00"
            value={formData.minimum_order_total}
            onChange={(e) =>
              setFormData({ ...formData, minimum_order_total: e.target.value })
            }
            className={`w-full border rounded-xl p-3 text-sm ${
              formErrors.minimum_order_total
                ? "border-red-500"
                : "border-gray-300"
            } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
          />
          {formErrors.minimum_order_total && (
            <p className="text-red-500 text-xs mt-1">
              {formErrors.minimum_order_total}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Fee Per KM
          </label>
          <input
            type="text"
            placeholder="0.00"
            value={formData.delivery_fee_per_km}
            onChange={(e) =>
              setFormData({ ...formData, delivery_fee_per_km: e.target.value })
            }
            className={`w-full border rounded-xl p-3 text-sm ${
              formErrors.delivery_fee_per_km
                ? "border-red-500"
                : "border-gray-300"
            } focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
          />
          {formErrors.delivery_fee_per_km && (
            <p className="text-red-500 text-xs mt-1">
              {formErrors.delivery_fee_per_km}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Chapa Sub-account ID
        </label>
        <input
          type="text"
          placeholder="Enter Chapa sub-account ID"
          value={formData.chapa_sub_account_id}
          onChange={(e) =>
            setFormData({ ...formData, chapa_sub_account_id: e.target.value })
          }
          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Theme Primary
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.theme_primary || "#674FA3"}
              onChange={(e) =>
                setFormData({ ...formData, theme_primary: e.target.value })
              }
              className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={formData.theme_primary}
              onChange={(e) =>
                setFormData({ ...formData, theme_primary: e.target.value })
              }
              className="flex-1 border border-gray-300 rounded-xl p-3 text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Theme Dark
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.theme_dark || "#6750A4"}
              onChange={(e) =>
                setFormData({ ...formData, theme_dark: e.target.value })
              }
              className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={formData.theme_dark}
              onChange={(e) =>
                setFormData({ ...formData, theme_dark: e.target.value })
              }
              className="flex-1 border border-gray-300 rounded-xl p-3 text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Theme Light
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.theme_light || "#8B6BB5"}
              onChange={(e) =>
                setFormData({ ...formData, theme_light: e.target.value })
              }
              className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={formData.theme_light}
              onChange={(e) =>
                setFormData({ ...formData, theme_light: e.target.value })
              }
              className="flex-1 border border-gray-300 rounded-xl p-3 text-sm font-mono"
            />
          </div>
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
              onChange={(e) =>
                setFormData({ ...formData, latitude: e.target.value })
              }
              className="w-full border border-gray-300 rounded-xl p-3 text-sm pr-12 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
              LAT
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={(e) =>
                setFormData({ ...formData, longitude: e.target.value })
              }
              className="w-full border border-gray-300 rounded-xl p-3 text-sm pr-12 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
              LON
            </span>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>
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
                    if (onLogoFileChange) onLogoFileChange(file);
                  }
                }}
              />
              {logoPreview ? (
                <div className="relative w-full flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg ring-2 ring-secondary/20">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((prev) => ({ ...prev, logo: null }));
                      onLogoFileChange?.(null);
                      const fileInput = document.getElementById(
                        "logo-upload",
                      ) as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="logo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer w-full py-4 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2 group-hover:bg-secondary/20 transition">
                    <Camera className="w-6 h-6 text-secondary group-hover:scale-110 transition" />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    Upload Logo
                  </span>
                  <span className="text-xs text-gray-400">
                    PNG, JPG up to 5MB
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Square image recommended (1:1)
                  </span>
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
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
                    if (onCoverFileChange) onCoverFileChange(file);
                  }
                }}
              />
              {coverPreview ? (
                <div className="relative w-full flex flex-col items-center">
                  <div className="w-full max-h-32 overflow-hidden rounded-xl shadow-lg">
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      className="w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((prev) => ({ ...prev, cover_image: null }));
                      onCoverFileChange?.(null);
                      const fileInput = document.getElementById(
                        "cover-upload",
                      ) as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="cover-upload"
                  className="flex flex-col items-center justify-center cursor-pointer w-full py-4 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2 group-hover:bg-secondary/20 transition">
                    <Camera className="w-6 h-6 text-secondary group-hover:scale-110 transition" />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    Upload Cover Image
                  </span>
                  <span className="text-xs text-gray-400">
                    PNG, JPG up to 10MB
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Wide banner recommended (16:9)
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* License & Tax Information */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/40" />
          <h3 className="text-sm font-bold text-secondary">
            License & Tax Information
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Document
            </label>
            {formData.license && typeof formData.license === "string" ? (
              <div className="bg-blue-50 border border-blue-300 rounded-xl px-4 py-3 flex items-center gap-3 transition-all mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    Existing license
                  </p>
                  <a
                    href={formData.license}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 underline"
                  >
                    View file
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, license: null }))
                  }
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Remove existing license"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ) : formData.license instanceof File ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3 transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {formData.license.name}
                  </p>
                  <p className="text-xs text-emerald-600">
                    ✓ Uploaded ({(formData.license.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, license: null }))
                  }
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
                  id="license-upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData((prev) => ({ ...prev, license: file }));
                  }}
                  className={`w-full border rounded-xl p-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 ${
                    formErrors.license ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
            )}
            {formErrors.license && (
              <p className="text-red-500 text-xs mt-1">{formErrors.license}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TIN Number
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Enter TIN number"
                value={formData.tin_number}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tin_number: e.target.value,
                  }))
                }
                className={`w-full border rounded-xl p-3 text-sm pl-10 ${formErrors.tin_number ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition`}
              />
            </div>
            {formErrors.tin_number && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.tin_number}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              VAT Registration Number
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Enter VAT registration number"
                value={formData.vat_registration_number}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vat_registration_number: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-xl p-3 text-sm pl-10 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax Type
          </label>
          <select
            value={formData.tax_type}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, tax_type: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition bg-white"
          >
            <option value="none">No Tax</option>
            <option value="vat">VAT (15%)</option>
            <option value="turnover_goods">Turnover Tax - Goods (2%)</option>
            <option value="turnover_services">
              Turnover Tax - Services (10%)
            </option>
          </select>
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
          <h2 className="text-sm font-bold text-secondary">
            Review Your Company Details
          </h2>
          <p className="text-[10px] text-secondary/60">
            Verify all information before registration
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="text-[11px] font-bold text-secondary-light flex items-center gap-1">
            <span className="text-sm">📋</span> Information
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              Company Name
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {formData.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              Slug
            </p>
            <p className="text-xs font-mono text-gray-700 truncate">
              {formData.slug || "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              Business Type
            </p>
            <p className="text-xs font-semibold text-gray-800 capitalize truncate">
              {formData.business_type || "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              Category
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {categories.find((c) => c.id === formData.category)?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              TIN Number
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {formData.tin_number || "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              Tax Type
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {formData.tax_type === "vat"
                ? "VAT Registered"
                : formData.tax_type === "turnover_goods"
                  ? "Turnover Tax - Goods"
                  : formData.tax_type === "turnover_services"
                    ? "Turnover Tax - Services"
                    : "No Tax"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              Chapa ID
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {formData.chapa_sub_account_id || "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              Theme Primary
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {formData.theme_primary || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="text-[11px] font-bold text-secondary-light flex items-center gap-1">
            <span className="text-sm">📍</span> Location & Contact
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="col-span-2">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              Address
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {formData.address || "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              Phone
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {formData.contact_phone || "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
              Email
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {formData.contact_email || "—"}
            </p>
          </div>
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
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">
              Logo
            </p>
            {logoPreview ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md">
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">No logo</p>
            )}
          </div>
          <div className="bg-white rounded-lg p-3 text-center border-2 border-dashed border-gray-200 min-h-[80px] flex flex-col items-center justify-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">
              Cover
            </p>
            {coverPreview ? (
              <div className="relative w-full h-12 rounded-xl overflow-hidden shadow-md">
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">No cover</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-2.5 border border-emerald-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-emerald-700">✅ Ready</span>
          <span className="text-[10px] text-emerald-600">
            4/4 steps complete
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">
            {formData.name ? "✅" : "❌"} Name
          </span>
          <span className="text-[10px] text-gray-500">
            {formData.slug ? "✅" : "❌"} Slug
          </span>
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
      <div className="flex-1 p-3 space-y-3">
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
        {currentStep === 3 && renderStep4()}
      </div>

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
