// src/components/admin/category-management/CategoryFormModal.tsx
import React from "react";
import { FormModal } from "../../ui/FormModal";

interface CategoryFormData {
  name: string;
  name_am: string;
  slug: string;
  code: string;
  description: string;
  icon: File | null;
  iconPreview: string;
  order: number;
  is_active: boolean;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  formData: CategoryFormData;
  setFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>;
  formErrors: Record<string, string>;
  editingId: number | null;
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  title,
  onSubmit,
  submitting,
  formData,
  setFormData,
  formErrors,
  editingId,
}: CategoryFormModalProps) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onSubmit={onSubmit}
      submitting={submitting}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Row 1: Name and Name Amharic - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name (English) */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Agro"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20 min-h-[44px] ${
                formErrors.name
                  ? "border-red-500 bg-red-50 focus:border-red-500"
                  : "border-gray-200 bg-gray-50/80 focus:border-[#6750A4] focus:bg-white"
              }`}
              required
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                {formErrors.name}
              </p>
            )}
          </div>

          {/* Name (Amharic) */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Name (Amharic)
            </label>
            <input
              type="text"
              value={formData.name_am}
              placeholder="e.g. አግሮ"
              onChange={(e) =>
                setFormData({ ...formData, name_am: e.target.value })
              }
              className="w-full border-2 border-gray-200 bg-gray-50/80 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 min-h-[44px]"
            />
          </div>
        </div>

        {/* Row 2: Slug and Item Code - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Slug */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. agro"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              disabled={!!editingId}
              className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20 min-h-[44px] ${
                formErrors.slug
                  ? "border-red-500 bg-red-50 focus:border-red-500"
                  : "border-gray-200 bg-gray-50/80 focus:border-[#6750A4] focus:bg-white"
              } ${editingId ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
            />
            {formErrors.slug && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                {formErrors.slug}
              </p>
            )}
          </div>

          {/* Item Code */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Item Code
            </label>
            <input
              type="text"
              placeholder="e.g. 01"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full border-2 border-gray-200 bg-gray-50/80 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 min-h-[44px]"
            />
          </div>
        </div>

        {/* Row 3: Priority Order - FULL WIDTH (spans both columns) */}
        <div className="group">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Priority Order
          </label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) =>
              setFormData({
                ...formData,
                order: parseInt(e.target.value) || 0,
              })
            }
            className="w-full border-2 border-gray-200 bg-gray-50/80 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 min-h-[44px]"
          />
          {formErrors.order && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
              {formErrors.order}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Lower number = higher priority
          </p>
        </div>

        {/* Row 4: Icon and Description - 2 columns (side by side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category Icon */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Category Icon
            </label>
            <div
              className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 p-2 flex flex-col items-center justify-center transition-all duration-300 hover:border-[#6750A4] hover:bg-gray-50/80"
              style={{ height: "130px" }}
            >
              <input
                type="file"
                id="category-icon-upload"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      alert("File must be smaller than 5MB");
                      return;
                    }
                    setFormData({
                      ...formData,
                      icon: file,
                      iconPreview: URL.createObjectURL(file),
                    });
                  }
                }}
              />
              {formData.iconPreview ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <div className="relative group/preview">
                    <img
                      src={formData.iconPreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover shadow-lg ring-2 ring-[#6750A4]/20"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-medium">
                        Preview
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        icon: null,
                        iconPreview: "",
                      });
                      const fileInput = document.getElementById(
                        "category-icon-upload",
                      ) as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="mt-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                    title="Remove image"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="category-icon-upload"
                  className="flex flex-col items-center justify-center cursor-pointer w-full h-full transition-all duration-200 hover:scale-102"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6750A4]/10 to-[#6750A4]/5 flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:shadow-md">
                    <svg
                      className="w-5 h-5 text-[#6750A4]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600">
                    Upload Icon
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    PNG, JPG up to 5MB
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Describe this category..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border-2 border-gray-200 bg-gray-50/80 rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:border-[#6750A4] focus:bg-white focus:ring-2 focus:ring-[#6750A4]/20 resize-none min-h-[44px]"
              style={{ height: "130px" }}
            />
          </div>
        </div>

        {/* Row 5: Active Category - FULL WIDTH */}
        <div className="p-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_active: e.target.checked,
                    })
                  }
                  className="h-5 w-5 text-[#6750A4] focus:ring-[#6750A4] focus:ring-2 border-gray-300 rounded cursor-pointer transition-all"
                />
              </div>
              <label
                htmlFor="is_active"
                className="text-sm font-semibold text-gray-700 cursor-pointer"
              >
                Active Category
              </label>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  formData.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    formData.is_active
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                ></span>
                {formData.is_active ? "Visible" : "Hidden"}
              </span>
              <span className="text-xs text-gray-400">
                Visible to all companies
              </span>
            </div>
          </div>
        </div>
      </div>
    </FormModal>
  );
}