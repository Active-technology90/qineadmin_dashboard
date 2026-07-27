// src/components/dashboard/HeadCompanyManagement/HeadCompanyManagement.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Plus, Building2, Pencil, Trash2, ImageIcon } from "lucide-react";
import {
  getHeadCompanies,
  createHeadCompany,
  updateHeadCompany,
  deleteHeadCompany,
} from "../../../services/api";
import type { HeadCompany } from "../../../types";
import { FormModal } from "../../ui/FormModal";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { ErrorView } from "../../ui/ErrorView";
import { Toast } from "../../ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { DragDropImageUpload } from "../../ui/DragDropImageUpload";

interface HeadCompanyFormData {
  name: string;
  name_am: string;
  logo: File | null;
  logoPreview: string | null;
  cover_image: File | null;
  coverPreview: string | null;
  is_active: boolean;
}

const emptyForm: HeadCompanyFormData = {
  name: "",
  name_am: "",
  logo: null,
  logoPreview: null,
  cover_image: null,
  coverPreview: null,
  is_active: true,
};

export default function HeadCompanyManagement() {
  const [headCompanies, setHeadCompanies] = useState<HeadCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearchTerm(value), 200);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState<HeadCompanyFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HeadCompany | null>(null);
  const { toast, showToast } = useToast();

  const fetchHeadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getHeadCompanies();
      const data = res.data;
      setHeadCompanies(Array.isArray(data) ? data : data.results ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load head companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeadCompanies();
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return headCompanies;
    const term = searchTerm.toLowerCase();
    return headCompanies.filter(
      (h) =>
        h.name.toLowerCase().includes(term) ||
        h.name_am?.toLowerCase().includes(term) ||
        h.slug.toLowerCase().includes(term),
    );
  }, [headCompanies, searchTerm]);

  const resetForm = () => {
    setEditingSlug(null);
    setFormData(emptyForm);
    setFormErrors({});
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (head: HeadCompany) => {
    setEditingSlug(head.slug);
    setFormData({
      name: head.name,
      name_am: head.name_am || "",
      logo: null,
      logoPreview: head.logo || null,
      cover_image: null,
      coverPreview: head.cover_image || null,
      is_active: head.is_active,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      if (formData.name_am) fd.append("name_am", formData.name_am);
      fd.append("is_active", String(formData.is_active));
      if (formData.logo instanceof File) fd.append("logo", formData.logo);
      if (formData.cover_image instanceof File)
        fd.append("cover_image", formData.cover_image);

      if (editingSlug) {
        await updateHeadCompany(editingSlug, fd);
        showToast("success", "Head company updated");
      } else {
        await createHeadCompany(fd);
        showToast("success", "Head company created");
      }
      setModalOpen(false);
      resetForm();
      fetchHeadCompanies();
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail ||
          err.response?.data?.name?.[0] ||
          "Operation failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHeadCompany(deleteTarget.slug);
      // Backend deactivates instead of deleting when branches still exist.
      showToast("success", "Head company removed");
      setDeleteTarget(null);
      fetchHeadCompanies();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Delete failed");
    }
  };

  if (error) return <ErrorView error={error} onRetry={fetchHeadCompanies} />;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4">
      <Toast toast={toast} />

      {/* Header - Responsive */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="hidden xs:block h-6 sm:h-8 md:h-10 w-0.5 sm:w-1 rounded-full bg-gradient-to-b from-secondary to-[#8B5CF6] shrink-0" />
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-secondary truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
            Head Companies
          </h2>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] sm:text-xs font-medium">
            {filtered.length}
          </span>
        </div>
        <button
          onClick={openCreate}
          className="shrink-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 rounded-full bg-secondary hover:bg-[#5b4694] active:scale-[0.98] transition-all shadow-sm hover:shadow-md text-white font-semibold text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-2"
        >
          <Plus size={14} className="xs:h-[15px] xs:w-[15px] sm:h-4 sm:w-4" />
          <span className="truncate hidden xs:inline">Create Head Company</span>
          <span className="truncate xs:hidden">New</span>
        </button>
      </div>

      {/* Search - Responsive */}
      <div className="mb-3 sm:mb-4">
        <div className="relative w-full sm:max-w-xs md:max-w-sm">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search head companies..."
            className="w-full border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-gray-50/80 focus:bg-white transition"
          />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue("");
                setSearchTerm("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table - Responsive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-[10px] xs:text-xs uppercase tracking-wider">
                <th className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-semibold">No.</th>
                <th className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-semibold">Logo</th>
                <th className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-semibold">Name</th>
                <th className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-semibold hidden sm:table-cell">Slug</th>
                <th className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-semibold">Branches</th>
                <th className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-semibold hidden xs:table-cell">Active</th>
                <th className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-2 xs:px-3 sm:px-4 py-8 xs:py-10 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-7 sm:w-7 border-b-2 border-secondary mx-auto mb-2 sm:mb-3" />
                    <span className="text-xs sm:text-sm">Loading...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 xs:px-3 sm:px-4 py-8 xs:py-10 text-center text-gray-400 text-xs sm:text-sm">
                    No head companies found
                  </td>
                </tr>
              ) : (
                filtered.map((head, idx) => (
                  <tr key={head.id} className="hover:bg-gray-50/60">
                    <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-500 text-[10px] xs:text-xs sm:text-sm">
                      {idx + 1}
                    </td>
                    <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3">
                      {head.logo ? (
                        <img
                          src={head.logo}
                          alt={head.name}
                          className="h-8 w-8 xs:h-9 xs:w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 xs:h-9 xs:w-9 rounded-full bg-gray-100 flex items-center justify-center">
                          <ImageIcon size={14} className="xs:h-4 xs:w-4 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium text-gray-900">
                      <span className="text-xs xs:text-sm">{head.name}</span>
                      {head.name_am ? (
                        <span className="block text-[10px] xs:text-xs text-gray-400 truncate max-w-[60px] xs:max-w-[80px] sm:max-w-none">
                          {head.name_am}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-mono text-gray-500 text-[10px] xs:text-xs sm:text-sm hidden sm:table-cell">
                      {head.slug}
                    </td>
                    <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3">
                      <span className="inline-flex items-center gap-0.5 xs:gap-1 text-gray-600 text-[10px] xs:text-xs sm:text-sm">
                        <Building2 size={12} className="xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-secondary" />
                        {head.branch_count ?? 0}
                      </span>
                    </td>
                    <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 hidden xs:table-cell">
                      <span
                        className={`px-1.5 xs:px-2 py-0.5 xs:py-1 text-[9px] xs:text-xs rounded-full ${
                          head.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {head.is_active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3">
                      <div className="flex items-center justify-end gap-1 xs:gap-1.5 sm:gap-2">
                        <button
                          onClick={() => openEdit(head)}
                          className="p-1 xs:p-1.5 rounded-lg text-gray-500 hover:bg-secondary/10 hover:text-secondary transition"
                          title="Edit"
                        >
                          <Pencil size={14} className="xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(head)}
                          className="p-1 xs:p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} className="xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSlug ? "Edit Head Company" : "New Head Company"}
        onSubmit={handleSubmit}
        submitting={submitting}
        maxWidth="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MOHA Soft Drinks"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary/20 min-h-[44px] ${formErrors.name ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"}`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1.5">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Name (Amharic)
              </label>
              <input
                type="text"
                placeholder="e.g. ሞሐ"
                value={formData.name_am}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name_am: e.target.value }))
                }
                className="w-full border-2 border-gray-200 bg-gray-50/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <DragDropImageUpload
                label="Logo (Square)"
                size="sm"
                value={formData.logo}
                onChange={(file) =>
                  setFormData((p) => ({ ...p, logo: file }))
                }
                previewUrl={formData.logoPreview}
                required={false}
              />
              <p className="text-[10px] text-gray-400 mt-1">1:1 ratio</p>
            </div>
            <div>
              <DragDropImageUpload
                label="Cover Image (Wide)"
                value={formData.cover_image}
                onChange={(file) =>
                  setFormData((p) => ({ ...p, cover_image: file }))
                }
                previewUrl={formData.coverPreview}
              />
              <p className="text-[10px] text-gray-400 mt-1">16:9 ratio</p>
            </div>
          </div>

          <div className="p-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="head_is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((p) => ({ ...p, is_active: e.target.checked }))
              }
              className="h-5 w-5 text-secondary focus:ring-secondary border-gray-300 rounded cursor-pointer"
            />
            <label
              htmlFor="head_is_active"
              className="text-sm font-semibold text-gray-700 cursor-pointer"
            >
              Active
            </label>
          </div>
        </div>
      </FormModal>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.name || ""}
        deleteTitle={"Delete Head Company"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
