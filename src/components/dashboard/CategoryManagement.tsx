// src/components/admin/CategoryManagement.tsx
import React, { useEffect, useState, useMemo } from "react";
import { Plus, ImageIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/api";
import type { Category } from "../../types";
import { SearchInput } from "../ui/SearchInput";
import { DataTable, type Column } from "../ui/DataTable";
import { FormModal } from "../ui/FormModal";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { ErrorView } from "../ui/ErrorView";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { usePagination } from "../../hooks/usePagination";
import { useSorting } from "../../hooks/useSorting";

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_am: "",
    slug: "",
    code: "",
    description: "",
    icon: null as File | null, // ✅ FILE
    iconPreview: "" as string,
    order: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const { toast, showToast } = useToast();

  // Filtered data (search by name, Amharic name, slug, code)
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
  } = usePagination(sortedItems, 10);
  // Inside CategoryManagement, after usePagination
  const paginatedItemsWithRowNumber = useMemo(() => {
    return paginatedItems.map((item, index) => ({
      ...item,
      rowNumber: (currentPage - 1) * itemsPerPage + index + 1,
    }));
  }, [paginatedItems, currentPage, itemsPerPage]);
  useEffect(() => {
    resetPage();
  }, [searchTerm, resetPage]);

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
  const applySortFromModal = (value: string) => {
    if (!value) {
      // Reset to default
      handleSort("name"); // if currently not on name, set it
      if (sortField !== "name" || sortOrder !== "asc") {
        handleSort("name");
        if (sortOrder !== "asc") handleSort("name");
      }
      return;
    }
    const [field, order] = value.split("|");
    // Use the same logic as before
    if (field === sortField && sortOrder === order) return;
    if (field === sortField) {
      handleSort(field); // toggle order
    } else {
      handleSort(field);
      if (order === "desc") handleSort(field); // toggle to desc
    }
  };
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
    if (!validateForm()) return;

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

      if (formData.icon) {
        fd.append("icon", formData.icon); // ✅ REAL FILE
      }

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
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.slug);
      showToast("success", "Category deleted successfully");
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Delete failed");
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

  const openEdit = (cat: Category) => {
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
  };

  // Table columns (includes all relevant fields)
  const columns: Column<Category>[] = [
    // Replace the first column (id) with a row number column
    {
      key: "rowNumber",
      header: "No.",
      sortable: false,
      render: (cat) => cat.rowNumber,
      },
     {
      key: "icon",
      header: "Icon",
      sortable: false,
      render: (cat) =>
        cat.icon ? (
          <img
            src={cat.icon}
            alt={cat.name}
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
            <ImageIcon size={14} className="text-gray-400" />
          </div>
        ),
    },
    { key: "name", header: "Name", sortable: true },
    {
      key: "name_am",
      header: "Name (Am)",
      sortable: true,
      render: (cat) => cat.name_am || "-",
    },
    { key: "slug", header: "Slug", sortable: true },
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (cat) => cat.code || "-",
    },
    {
      key: "order",
      header: "Order",
      sortable: true,
      render: (cat) => cat.order ?? "-",
    },
   
    {
      key: "is_active",
      header: "Active",
      sortable: true,
      render: (cat) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${cat.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {cat.is_active ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "company_count",
      header: "Companies",
      sortable: true,
      render: (cat) => cat.company_count ?? 0,
    },
  ];

  if (error) return <ErrorView error={error} onRetry={fetchCategories} />;

  return (
    <div>
      <Toast toast={toast} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
        <button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="bg-[#6750A4] text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, Amharic name, slug, or code..."
          />
        </div>
        <select
          value={`${sortField}|${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split("|");
            // Use the same field/order logic
            if (field === sortField) {
              if (order !== sortOrder) handleSort(field); // toggle
            } else {
              handleSort(field);
              if (order === "desc") handleSort(field); // second call toggles to desc
            }
          }}
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="name|asc">Name (A-Z)</option>
          <option value="name|desc">Name (Z-A)</option>
          <option value="id|asc">ID (Low to High)</option>
          <option value="id|desc">ID (High to Low)</option>
          <option value="id|desc">Newest (ID ↓)</option>
          <option value="id|asc">Oldest (ID ↑)</option>
          <option value="order|asc">Order (Ascending)</option>
          <option value="order|desc">Order (Descending)</option>
          <option value="company_count|desc">Most Companies</option>
          <option value="company_count|asc">Fewest Companies</option>
        </select>
      </div>
      <DataTable
        data={paginatedItemsWithRowNumber} // use the new array
        columns={columns}
        loading={loading}
        emptyMessage="No categories found"
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        totalItems={sortedItems.length}
        itemsPerPage={itemsPerPage}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Category" : "New Category"}
        onSubmit={handleSubmit}
        submitting={submitting}
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (English) *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full border rounded-lg p-2 ${formErrors.name ? "border-red-500" : "border-gray-300"}`}
              required
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (Amharic)
            </label>
            <input
              type="text"
              value={formData.name_am}
              onChange={(e) =>
                setFormData({ ...formData, name_am: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (optional)
            </label>
            <input
              type="text"
              placeholder="auto-generated"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className={`w-full border rounded-lg p-2 font-mono ${formErrors.slug ? "border-red-500" : "border-gray-300"}`}
            />
            {formErrors.slug && (
              <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
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
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setFormData({
                  ...formData,
                  icon: file,
                  iconPreview: URL.createObjectURL(file),
                });
              }}
              className="w-full border border-gray-300 rounded-lg p-2"
            />

            {formData.iconPreview && (
              <img
                src={formData.iconPreview}
                className="mt-2 h-16 w-16 object-cover rounded"
              />
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg p-2"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-gray-700"
            >
              Active
            </label>
          </div>
        </div>
      </FormModal>
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.name || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
