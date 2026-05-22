// src/components/admin/CategoryManagement.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Plus, Eye, Filter, SlidersHorizontal, X } from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/api";
import type { Category } from "../../types";
import { FormModal } from "../ui/FormModal";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { ErrorView } from "../ui/ErrorView";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { usePagination } from "../../hooks/usePagination";
import { useSorting } from "../../hooks/useSorting";
// import { DragDropImageUpload } from "../ui/DragDropImageUpload";
import { useReadOnly } from "./AdminDashboard"; // <-- import read‑only context

import CategoryTable from "./category-management/CategoryTable";
import CategoryFormModal from "./category-management/CategoryFormModal";
import { CustomSelect } from "../ui/CustomSelect";
import type { SelectOption } from "../ui/CustomSelect";

export default function CategoryManagement() {
  const readOnly = useReadOnly(); // true for viewers, false otherwise

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchTerm(value);
    }, 200);
  };

  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_am: "",
    slug: "",
    code: "",
    description: "",
    icon: null as File | null,
    iconPreview: "",
    order: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const { toast, showToast } = useToast();

  // ---- Mobile sort sheet state (SuperAdminView pattern) ----
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempSort, setTempSort] = useState("name|asc");

  // Lock body scroll when sheet is open (no dependency on sortField/sortOrder)
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [sheetOpen]);

  // Filter categories client‑side
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        cat.name_am?.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term) ||
        cat.code?.toLowerCase().includes(term),
    );
  }, [categories, searchTerm]);

  // ---- useSorting hook (defines sortField, sortOrder) ----
  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    filteredCategories,
    "name",
    "asc",
  );

  // Sync tempSort when sheet opens (now after useSorting)
  useEffect(() => {
    if (sheetOpen) {
      setTempSort(`${sortField}|${sortOrder}`);
    }
  }, [sheetOpen, sortField, sortOrder]);

  const applyMobileSort = () => {
    if (tempSort !== `${sortField}|${sortOrder}`) {
      const [field, desiredOrder] = tempSort.split("|");
      if (field === sortField) {
        if (desiredOrder !== sortOrder) handleSort(field);
      } else {
        handleSort(field);
        if (desiredOrder === "desc") handleSort(field);
      }
    }
    setSheetOpen(false);
  };

  const clearMobileSort = () => {
    setTempSort("name|asc");
    if ("name|asc" !== `${sortField}|${sortOrder}`) {
      handleSort("name");
    }
    setSheetOpen(false);
  };

  // Current sort label for mobile button
  const sortLabel = useMemo(() => {
    const val = `${sortField}|${sortOrder}`;
    const labels: Record<string, string> = {
      "name|asc": "Name A-Z",
      "name|desc": "Name Z-A",
      "order|asc": "Priority ↑",
      "order|desc": "Priority ↓",
      "company_count|desc": "Most Companies",
      "company_count|asc": "Fewest Companies",
    };
    return labels[val] || "Sort";
  }, [sortField, sortOrder]);

  // Active filter count (only search active – can be extended)
  const activeFilterCount = inputValue.trim() !== "" ? 1 : 0;

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    resetPage,
    itemsPerPage,
  } = usePagination(sortedItems, pageSize);

  const paginatedItemsWithRowNumber = useMemo(() => {
    return paginatedItems.map((item, index) => ({
      ...item,
      rowNumber: (currentPage - 1) * itemsPerPage + index + 1,
    }));
  }, [paginatedItems, currentPage, itemsPerPage]);

  useEffect(() => {
    resetPage();
  }, [searchTerm, pageSize, resetPage]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCategories();
      setCategories(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Only allow edit if not read‑only
  const handleEdit = useCallback(
    (cat: Category) => {
      if (readOnly) return;
      setEditingId(cat.id);
      setFormData({
        name: cat.name,
        name_am: cat.name_am || "",
        slug: cat.slug,
        code: cat.code || "",
        description: cat.description || "",
        icon: null,
        iconPreview: cat.icon || "",
        order: cat.order || 0,
        is_active: cat.is_active ?? true,
      });
      setModalOpen(true);
    },
    [readOnly],
  );

  const handleDeleteClick = useCallback(
    (cat: Category) => {
      if (readOnly) return;
      setDeleteTarget(cat);
    },
    [readOnly],
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug))
      errors.slug =
        "Slug must contain only lowercase letters, numbers, and hyphens";
    if (formData.order < 0) errors.order = "Order must be a positive number";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validateForm()) return;

    // For edit mode, check if any data actually changed
    if (editingId) {
      const originalCategory = categories.find((c) => c.id === editingId);
      if (originalCategory) {
        const hasChanges =
          originalCategory.name !== formData.name ||
          (originalCategory.name_am || "") !== (formData.name_am || "") ||
          originalCategory.slug !== formData.slug ||
          (originalCategory.code || "") !== (formData.code || "") ||
          (originalCategory.description || "") !==
            (formData.description || "") ||
          (originalCategory.order || 0) !== formData.order ||
          (originalCategory.is_active ?? true) !== formData.is_active ||
          formData.icon !== null; // If new icon uploaded, consider as change

        if (!hasChanges) {
          showToast("info", "No changes detected");
          setModalOpen(false);
          resetForm();
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      if (formData.name_am) fd.append("name_am", formData.name_am);
      if (formData.slug) fd.append("slug", formData.slug);
      if (formData.code) fd.append("code", formData.code);
      if (formData.description) fd.append("description", formData.description);
      fd.append("order", String(formData.order));
      fd.append("is_active", String(formData.is_active));
      if (formData.icon) fd.append("icon", formData.icon);

      if (editingId) {
        await updateCategory(formData.slug, fd);
        showToast("success", "Category updated");
      } else {
        await createCategory(fd);
        showToast("success", "Category created");
      }
      setModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || readOnly) return;
    try {
      await deleteCategory(deleteTarget.slug);
      showToast("success", "Category deleted successfully");
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      // If delete fails (category has related data), deactivate it instead
      if (
        err.response?.status === 400 ||
        err.response?.status === 409 ||
        err.response?.data?.detail?.includes("related")
      ) {
        try {
          await updateCategory(deleteTarget.slug, { is_active: false });
          showToast("success", "Category deactivated (has related data)");
          setDeleteTarget(null);
          fetchCategories();
        } catch (updateErr: any) {
          showToast(
            "error",
            updateErr.response?.data?.detail || "Failed to deactivate category",
          );
        }
      } else {
        showToast("error", err.response?.data?.detail || "Delete failed");
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      name_am: "",
      slug: "",
      code: "",
      description: "",
      icon: null,
      iconPreview: "",
      order: 0,
      is_active: true,
    });
    setFormErrors({});
  };

  const sortOptions: SelectOption[] = useMemo(
    () => [
      { label: "Name (A-Z)", value: "name|asc" },
      { label: "Name (Z-A)", value: "name|desc" },
      { label: "Priority (Ascending)", value: "order|asc" },
      { label: "Priority (Descending)", value: "order|desc" },
      { label: "Most Companies", value: "company_count|desc" },
      { label: "Fewest Companies", value: "company_count|asc" },
    ],
    [],
  );

  if (error) return <ErrorView error={error} onRetry={fetchCategories} />;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4">
      <Toast toast={toast} />

      {/* Header with optional read‑only badge */}
      <div className="flex flex-row items-center justify-between gap-2 xs:gap-3 sm:gap-4 mb-4 sm:mb-6 min-w-0 w-full overflow-hidden">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
          {/* Accent */}
          <div className="hidden xs:block h-8 sm:h-10 w-1 rounded-full bg-gradient-to-b from-[#6750A4] to-[#8B5CF6] shrink-0" />

          {/* Title + Badge */}
          <div className="min-w-0 flex items-center gap-1.5 xs:gap-2 sm:gap-3 overflow-hidden">
            <h2 className="text-[17px] xs:text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#6750A4] truncate leading-tight">
              Categories
            </h2>

            {readOnly && (
              <span
                className="
                  shrink-0 inline-flex items-center gap-1
                  rounded-full border border-gray-200
                  bg-gray-100/80 backdrop-blur-sm
                  text-[10px] xs:text-[11px]
                  text-gray-600 font-medium
                  px-1.5 xs:px-2 sm:px-2.5
                  py-1
                  whitespace-nowrap
                  max-w-full
                "
              >
                <Eye className="h-3 w-3 shrink-0" />
                <span className="truncate">View Only</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Section */}
        {!readOnly && (
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="
              shrink-0
              inline-flex items-center justify-center
              gap-1.5 sm:gap-2
              rounded-full
              bg-[#6750A4]
              hover:bg-[#5a458c]
              active:scale-[0.98]
              transition-all duration-200
              shadow-sm hover:shadow-md

              text-white font-semibold
              text-[11px] xs:text-xs sm:text-sm

              px-2.5 xs:px-3 sm:px-4 md:px-5
              py-2 sm:py-2.5

              min-h-[28px] xs:min-h-[42px] sm:min-h-[40px]
              max-w-[145px] xs:max-w-none

              whitespace-nowrap
              overflow-hidden
            "
            aria-label="Create Category"
          >
            <Plus
              size={16}
              className="shrink-0 xs:h-[17px] xs:w-[17px] sm:h-[18px] sm:w-[18px]"
            />

            <span className="truncate">Create Category</span>
          </button>
        )}
      </div>

      <CategoryTable
        loading={loading}
        readOnly={readOnly}
        categoriesWithRowNumber={paginatedItemsWithRowNumber}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        sortOptions={sortOptions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />

      {/* ---- MOBILE STICKY SORT BAR (visible below md) ---- */}
      <div className="md:hidden fixed bottom-0 left-0  z-30 bg-white/90 backdrop-blur-xl border-t border-gray-200/80 px-4 py-3 flex gap-3 safe-bottom">
        {/* <button
          onClick={() => setSheetOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100/90 rounded-2xl py-3 text-sm font-semibold text-gray-700 active:scale-95 transition-all"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#6750A4] text-white text-[10px] font-bold leading-none">
              {activeFilterCount}
            </span>
          )}
        </button> */}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100/90 rounded-2xl py-3 text-sm font-semibold text-gray-700 active:scale-95 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {sortLabel}
        </button>
      </div>

      {/* ---- MOBILE SORT SHEET (visible when sheetOpen) ---- */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[130] flex flex-col bg-white rounded-t-2xl shadow-2xl max-h-[70vh] transform transition-all duration-300 ease-out">
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Sort</h3>
              <button
                onClick={() => setSheetOpen(false)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Sort options */}
            {/* Sort options (Improved UX Cards) */}
<div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-3 space-y-4">
  <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 block">
    Sort By
  </label>

  <div className="grid grid-cols-1 gap-3">
    {sortOptions.map((opt) => {
      const isActive = tempSort === opt.value;

      return (
        <button
          key={opt.value}
          onClick={() => setTempSort(opt.value)}
          className={`
            w-full flex items-center justify-between
            px-4 py-3 rounded-2xl border
            transition-all duration-200 active:scale-[0.98]

            ${
              isActive
                ? "bg-[#6750A4] text-white border-[#6750A4] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#6750A4]/40 hover:bg-gray-50"
            }
          `}
        >
          <span className="text-sm font-semibold">{opt.label}</span>

          {/* Radio indicator */}
          <span
            className={`
              w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${isActive ? "border-white" : "border-gray-300"}
            `}
          >
            {isActive && (
              <span className="w-2 h-2 bg-white rounded-full" />
            )}
          </span>
        </button>
      );
    })}
  </div>
</div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-white p-4 flex gap-3 flex-shrink-0 safe-bottom">
              <button
                onClick={clearMobileSort}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 active:scale-[0.98] transition-all"
              >
                Reset
              </button>
              <button
                onClick={applyMobileSort}
                className="flex-1 h-12 rounded-2xl bg-[#6750A4] text-sm font-semibold text-white shadow-lg shadow-[#6750A4]/20 active:scale-[0.98] transition-all"
              >
                Apply Sort
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal – only rendered when not read‑only (optional, but keeps conditional) */}
      {!readOnly && (
        <CategoryFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? "Edit Category" : "New Category"}
          onSubmit={handleSubmit}
          submitting={submitting}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          editingId={editingId}
          readOnly={readOnly}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.name || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Safe area padding for mobile filter bar */}
      <style>{`
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 1rem);
        }
      `}</style>
    </div>
  );
}