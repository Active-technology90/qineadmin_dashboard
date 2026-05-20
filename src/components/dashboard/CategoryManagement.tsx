// src/components/admin/CategoryManagement.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Plus, Eye } from "lucide-react";
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

  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    filteredCategories,
    "name",
    "asc",
  );

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-[#6750A4]">Categories</h2>
          {readOnly && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              <Eye className="h-3 w-3" /> View Only
            </span>
          )}
        </div>
        {!readOnly && (
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="bg-[#6750A4] text-white px-4 py-1 rounded-full flex items-center gap-2 hover:bg-[#5a458c] transition shadow-sm text-sm font-medium min-h-[40px] min-w-[44px]"
          >
            <Plus size={18} /> Create Category
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
    </div>
  );
}