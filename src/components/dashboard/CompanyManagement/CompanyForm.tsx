// src/components/admin/CompanyManagement/CompanyForm.tsx
import { DragDropImageUpload } from "../../ui/DragDropImageUpload";
import type { Category, SubCategory } from "../../../types";

export interface CompanyFormData {
  name: string;
  name_am: string;
  slug: string;
  category: number;
  sub_category: number;
  business_type: string;
  description: string;
  minimum_order_total: string;
  is_active: boolean;
  is_featured: boolean;
  logo: File | null;
  cover_image: File | null;
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
  submitting,
  editingSlug,
  onSubmit,
  onClose,
}: CompanyFormProps) {
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.category === formData.category,
  );

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-row divide-x divide-gray-100"
    >
      {/* LEFT COLUMN */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto  scrollbar-thin  max-h-[calc(100vh-160px)]">
        {/* Company Name */}
        <div>
          <label className="block text-[14px] font-medium text-gray-600 mb-0.5">
            Company Name *
          </label>
          <input
            type="text"
            placeholder="Company Name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={!isEditingActive}
            className={`w-full border rounded-md p-1.5 text-xs transition-all ${
              !isEditingActive
                ? "bg-gray-50 border-gray-200"
                : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"
            }`}
          />
          {formErrors.name && (
            <p className="text-red-500 text-[10px] mt-0.5">{formErrors.name}</p>
          )}
        </div>

        {/* Name Amharic */}
        <div>
          <label className="block text-[14px] font-medium text-gray-600 mb-0.5">
            Company Name (Amharic)
          </label>
          <input
            type="text"
            placeholder="አማርኛ ስም"
            value={formData.name_am}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name_am: e.target.value }))
            }
            disabled={!isEditingActive}
            className={`w-full border rounded-md p-1.5 text-xs ${
              !isEditingActive
                ? "bg-gray-50 border-gray-200"
                : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"
            }`}
          />
        </div>

        {/* Slug (disabled) */}
        <div>
          <label className="block text-[14px] font-medium text-gray-600 mb-0.5">
            Slug
          </label>
          <input
            type="text"
            placeholder="company-slug"
            value={formData.slug}
            disabled
            className={`w-full border rounded-md p-1.5 text-xs font-mono bg-gray-50 border-gray-200 ${
              formErrors.slug ? "border-red-500" : ""
            }`}
          />
          {formErrors.slug && (
            <p className="text-red-500 text-[10px] mt-0.5">{formErrors.slug}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-[14px] font-medium text-gray-600 mb-0.5">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => {
              const catId = Number(e.target.value);
              setFormData((prev) => ({
                ...prev,
                category: catId,
                sub_category: 0,
              }));
            }}
            disabled={!isEditingActive}
            className={`w-full border rounded-md p-1.5 text-xs ${
              !isEditingActive
                ? "bg-gray-50 border-gray-200"
                : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"
            } ${formErrors.category ? "border-red-500" : ""}`}
          >
            <option value={0}>Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {formErrors.category && (
            <p className="text-red-500 text-[10px] mt-0.5">
              {formErrors.category}
            </p>
          )}
        </div>

        {/* Subcategory */}
        <div>
          <label className="block text-[14px] font-medium text-gray-600 mb-0.5">
            Subcategory *
          </label>
          <select
            value={formData.sub_category}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                sub_category: Number(e.target.value),
              }))
            }
            disabled={!isEditingActive || !formData.category}
            className={`w-full border rounded-md p-1.5 text-xs ${
              !isEditingActive
                ? "bg-gray-50 border-gray-200"
                : !formData.category
                ? "bg-gray-100 text-gray-500 border-gray-200"
                : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"
            } ${formErrors.sub_category ? "border-red-500" : ""} ${
              !formData.category ? "cursor-not-allowed" : ""
            }`}
          >
            <option value={0}>Select Subcategory</option>
            {filteredSubcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          {formErrors.sub_category && (
            <p className="text-red-500 text-[10px] mt-0.5">
              {formErrors.sub_category}
            </p>
          )}
        </div>

        {/* Logo Upload */}
        <div className="relative w-full">
          <div className={!isEditingActive ? "opacity-70" : ""}>
            <DragDropImageUpload
              label="Logo (Square)"
              size="sm"
              value={formData.logo}
              onChange={(file) =>
                setFormData((prev) => ({ ...prev, logo: file }))
              }
              previewUrl={logoPreview}
              required={false}
              disabled={!isEditingActive}
            />
          </div>
          {!isEditingActive && (
            <div className="absolute inset-0 cursor-not-allowed z-10"></div>
          )}
          <p className="text-[8px] text-gray-400 text-left mt-1">
            Square image (1:1 ratio)
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin  max-h-[calc(100vh-160px)]">
        {/* Business Type */}
        <div>
          <label className="block text-[14px] font-medium text-gray-600 mb-0.5">
            Business Type *
          </label>
          <select
            value={formData.business_type}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                business_type: e.target.value,
              }))
            }
            disabled={!isEditingActive}
            className={`w-full border rounded-md p-1.5 text-xs ${
              !isEditingActive
                ? "bg-gray-50 border-gray-200"
                : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"
            } ${formErrors.business_type ? "border-red-500" : ""}`}
          >
            <option value="">Select Business Type</option>
            <option value="brand">Company</option>
            <option value="store">Store</option>
            <option value="service">Service</option>
          </select>
          {formErrors.business_type && (
            <p className="text-red-500 text-[10px] mt-0.5">
              {formErrors.business_type}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-[14px] font-medium text-gray-600 mb-0.5">
            Description
          </label>
          <textarea
            placeholder="Company description..."
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            disabled={!isEditingActive}
            rows={2}
            className={`w-full border rounded-md p-1.5 text-xs resize-none ${
              !isEditingActive
                ? "bg-gray-50 border-gray-200"
                : "bg-white border-[#6750A4]/30 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"
            }`}
          />
        </div>

        {/* Minimum Order Total */}
        <div className=" ">
          <label className="block text-[14px] font-medium text-gray-600 mb-0.5">
            Minimum Order Total (ETB)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formData.minimum_order_total}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                minimum_order_total: e.target.value,
              }))
            }
            disabled={!isEditingActive}
            className={`w-full border rounded-md p-1.5 text-xs ${
              !isEditingActive
                ? "bg-gray-50 border-gray-200"
                : "bg-white border-gray-300 focus:ring-1 focus:ring-[#6750A4]/20 focus:border-[#6750A4]"
            }`}
          />
          <p className="text-[10px] text-gray-400 mt-0.5">
            0 means no minimum for this company.
          </p>
        </div>

        {/* Status Checkboxes */}
        <div className="pt-1 space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
              disabled={!isEditingActive}
              className="h-3.5 w-3.5 text-[#6750A4] rounded border-gray-300"
            />
            <span
              className={`text-[14px] ${
                !isEditingActive ? "text-gray-500" : "text-gray-700"
              }`}
            >
              Active
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_featured: e.target.checked,
                }))
              }
              disabled={!isEditingActive}
              className="h-3.5 w-3.5 text-[#6750A4] rounded border-gray-300"
            />
            <span
              className={`text-[14px] ${
                !isEditingActive ? "text-gray-500" : "text-gray-700"
              }`}
            >
              Featured
            </span>
          </label>
        </div>

        {/* Cover Image Upload */}
        <div className="relative w-full">
          <div className={!isEditingActive ? "opacity-70" : ""}>
            <div className="w-full bg-gradient-to-r from-purple-100/40 to-indigo-100/40 rounded-xl p-2 border-2 border-[#6750A4]/30 shadow-sm">
              <DragDropImageUpload
                label="🎬 COVER IMAGE (Wide Banner)"
                value={formData.cover_image}
                onChange={(file) =>
                  setFormData((prev) => ({ ...prev, cover_image: file }))
                }
                previewUrl={coverPreview}
                disabled={!isEditingActive}
              />
            </div>
          </div>
          {!isEditingActive && (
            <div className="absolute inset-0 cursor-not-allowed z-10"></div>
          )}
          <p className="text-[8px] text-gray-400 text-center mt-1">
            16:9 banner ratio - fits full width
          </p>
        </div>

        {/* Action Buttons */}
        {isEditingActive && (
          <div className="flex flex-row gap-4 items-center justify-center pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="w-full cursor-pointer bg-gradient-to-r from-[#6750A4] to-[#7c63b8] text-white px-2 py-1.5 rounded-md text-xs font-semibold hover:from-[#5b4694] hover:to-[#6b55a8] transition-all duration-300 disabled:opacity-50 shadow-sm"
            >
              {submitting ? "Saving..." : editingSlug ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full cursor-pointer border border-gray-300 rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        )}

        {/* View only message */}
        {!isEditingActive && (
          <div className="text-center py-2 text-gray-500 text-[10px] bg-gray-50 rounded-md border border-gray-100 mt-2">
            🔒 View only
          </div>
        )}
      </div>
    </form>
  );
}
