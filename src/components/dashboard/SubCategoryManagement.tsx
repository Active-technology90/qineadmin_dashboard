// src/components/admin/SubCategoryManagement.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Plus, ImageIcon } from "lucide-react";
import {
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getCategories,
} from "../../services/api";
import type { SubCategory, Category } from "../../types";
import { SearchInput } from "../ui/SearchInput";
import { TableControls } from "../ui/TableControls";
import { DataTable, type Column } from "../ui/DataTable";
import { Pagination } from "../ui/Pagination";
import { FormModal } from "../ui/FormModal";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { ErrorView } from "../ui/ErrorView";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { usePagination } from "../../hooks/usePagination";
import { useSorting } from "../../hooks/useSorting";
import { DragDropImageUpload } from "../ui/DragDropImageUpload";
import { useReadOnly } from "./AdminDashboard";

const MemoizedDataTable = React.memo(DataTable) as typeof DataTable;
const MemoizedPagination = React.memo(Pagination);

export default function SubCategoryManagement() {
  const readOnly = useReadOnly(); // true for viewers

  const [pageSize, setPageSize] = useState(10);
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_am: "",
    slug: "",
    category: 0,
    item_code: "",
    description: "",
    icon: null as File | null,
    iconPreview: "" as string,
    order: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubCategory | null>(null);
  const { toast, showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subRes, catRes] = await Promise.all([
        getSubCategories(),
        getCategories(),
      ]);
      setSubs(subRes.data);
      setCategories(catRes.data);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSubs = useMemo(() => {
    const categoryFiltered =
      categoryFilter === "all"
        ? subs
        : subs.filter((sub) => String(sub.category) === categoryFilter);

    if (!searchTerm.trim()) return categoryFiltered;
    const term = searchTerm.toLowerCase();
    return categoryFiltered.filter(
      (sub) =>
        sub.name.toLowerCase().includes(term) ||
        sub.name_am?.toLowerCase().includes(term) ||
        sub.slug.toLowerCase().includes(term) ||
        sub.item_code?.toLowerCase().includes(term) ||
        categories
          .find((c) => c.id === sub.category)
          ?.name.toLowerCase()
          .includes(term),
    );
  }, [subs, categories, searchTerm, categoryFilter]);

  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    filteredSubs,
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
  }, [searchTerm, pageSize, categoryFilter, resetPage]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchTerm(value);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (formData.category === 0) errors.category = "Please select a category";
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
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      if (formData.name_am) fd.append("name_am", formData.name_am);
      if (formData.slug) fd.append("slug", formData.slug);
      fd.append("category", String(formData.category));
      if (formData.item_code) fd.append("item_code", formData.item_code);
      if (formData.description) fd.append("description", formData.description);
      fd.append("order", String(formData.order));
      fd.append("is_active", String(formData.is_active));
      if (formData.icon instanceof File) fd.append("icon", formData.icon);

      if (editingId) {
        const existing = subs.find((s) => s.id === editingId);
        if (existing) await updateSubCategory(existing.slug, fd);
        showToast("success", "Updated successfully");
      } else {
        await createSubCategory(fd);
        showToast("success", "Created successfully");
      }
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || readOnly) return;
    try {
      await deleteSubCategory(deleteTarget.slug);
      showToast("success", "Subcategory deleted successfully");
      setDeleteTarget(null);
      fetchData();
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
      category: 0,
      item_code: "",
      description: "",
      icon: null,
      iconPreview: "",
      order: 0,
      is_active: true,
    });
    setFormErrors({});
  };

  const openEdit = useCallback(
    (sub: SubCategory) => {
      if (readOnly) return;
      setEditingId(sub.id);
      setFormData({
        name: sub.name,
        name_am: sub.name_am || "",
        slug: sub.slug,
        category: sub.category,
        item_code: sub.item_code || "",
        description: sub.description || "",
        icon: null,
        iconPreview: sub.icon || "",
        order: sub.order || 0,
        is_active: sub.is_active ?? true,
      });
      setModalOpen(true);
    },
    [readOnly],
  );

  const handleDeleteClick = useCallback(
    (sub: SubCategory) => {
      if (readOnly) return;
      setDeleteTarget(sub);
    },
    [readOnly],
  );

  const columns: Column<SubCategory>[] = useMemo(
    () => [
      {
        key: "rowNumber",
        header: "No.",
        sortable: false,
        render: (cat: SubCategory & { rowNumber?: number }) => cat.rowNumber,
      },
      {
        key: "icon",
        header: "Icon",
        sortable: false,
        render: (sub) =>
          sub.icon ? (
            <img
              src={sub.icon}
              alt={sub.name}
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
              <ImageIcon size={14} className="text-gray-400" />
            </div>
          ),
      },
      {
        key: "name",
        header: "Name",
        sortable: true,
        className: "font-medium text-gray-900",
      },
      {
        key: "name_am",
        header: "Name (Am)",
        sortable: true,
        render: (sub) => sub.name_am || "-",
      },
      {
        key: "category",
        header: "Category",
        sortable: true,
        sortKey: "category_name",
        render: (sub) =>
          categories.find((c) => c.id === sub.category)?.name || sub.category,
      },
      {
        key: "item_code",
        header: "Item Code",
        sortable: true,
        render: (sub) => sub.item_code || "-",
      },
      {
        key: "slug",
        header: "Slug",
        sortable: true,
        className: "font-mono text-gray-500",
      },
      {
        key: "order",
        header: "Order",
        sortable: true,
        render: (sub) => sub.order ?? "-",
      },
      {
        key: "is_active",
        header: "Is Active",
        sortable: true,
        render: (sub) => (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              sub.is_active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {sub.is_active ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "company_count",
        header: "Companies",
        sortable: true,
        render: (sub) => sub.company_count ?? 0,
      },
    ],
    [categories],
  );

  if (error) return <ErrorView error={error} onRetry={fetchData} />;

  return (
    <div>
      <Toast toast={toast} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-[#6750A4]">SubCategories</h2>
          {readOnly && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              View Only
            </span>
          )}
        </div>
        {!readOnly && (
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="bg-[#6750A4] text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-[#5a458c] transition shadow-sm"
          >
            <Plus size={18} /> Add SubCategory
          </button>
        )}
      </div>

      <TableControls pageSize={pageSize} onPageSizeChange={setPageSize}>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="flex-1">
            <SearchInput
              value={inputValue}
              onChange={handleInputChange}
              debounceMs={0}
              showClearButton={false}
              placeholder="Search by name, Amharic name, slug, item code, or category..."
              loading={loading}
            />
          </div>
          <select
            value={`${sortField}|${sortOrder}`}
            onChange={(e) => {
              const [field, desiredOrder] = e.target.value.split("|");
              if (field === sortField) {
                if (desiredOrder !== sortOrder) handleSort(field);
              } else {
                handleSort(field);
                if (desiredOrder === "desc") handleSort(field);
              }
            }}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-[#6750A4] hover:border-gray-400"
          >
            <option value="name|asc">Name (A-Z)</option>
            <option value="name|desc">Name (Z-A)</option>
            {/* <option value="id|asc">Oldest (ID ↑)</option>
            <option value="id|desc">Newest (ID ↓)</option> */}
            <option value="order|asc">Order (Ascending)</option>
            <option value="order|desc">Order (Descending)</option>
            {/* <option value="item_code|asc">Item Code (A-Z)</option> */}
            <option value="company_count|desc">Most Companies</option>
            <option value="company_count|asc">Fewest Companies</option>
            <option value="is_active|desc">Active First</option>
            <option value="is_active|asc">Inactive First</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-[#6750A4] hover:border-gray-400"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </TableControls>

      <MemoizedDataTable<SubCategory>
        data={paginatedItemsWithRowNumber}
        columns={columns}
        loading={loading}
        emptyMessage="No subcategories found"
        onEdit={!readOnly ? openEdit : undefined}
        onDelete={!readOnly ? handleDeleteClick : undefined}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <MemoizedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />

      {!readOnly && (
        <FormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? "Edit SubCategory" : "New SubCategory"}
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
                className={`w-full border rounded-lg p-2 ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                }`}
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
                className="w-full border border-gray-300 rounded-lg p-2 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                placeholder="e.g. beverages"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                disabled={!!editingId}
                className={`w-full border rounded-lg p-2 font-mono ${
                  formErrors.slug ? "border-red-500" : "border-gray-300"
                } ${editingId ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
              />
              {formErrors.slug && (
                <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: Number(e.target.value) })
                }
                className={`w-full border rounded-lg p-2 ${
                  formErrors.category ? "border-red-500" : "border-gray-300"
                }`}
                required
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
                Item Code
              </label>
              <input
                type="text"
                value={formData.item_code}
                onChange={(e) =>
                  setFormData({ ...formData, item_code: e.target.value })
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
                min="0"
                value={formData.order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
              />
              {formErrors.order && (
                <p className="text-red-500 text-xs mt-1">{formErrors.order}</p>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Sub Category Icon
              </label>
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 p-2 flex flex-col items-center justify-center transition-all duration-300 hover:border-[#6750A4] hover:bg-gray-50/80" style={{ height: '130px' }}>
                <input
                  type="file"
                  id="subcategory-icon-upload"
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
                        <span className="text-white text-[10px] font-medium">Preview</span>
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
                        const fileInput = document.getElementById("subcategory-icon-upload") as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                      className="mt-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                      title="Remove image"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="subcategory-icon-upload"
                    className="flex flex-col items-center justify-center cursor-pointer w-full h-full transition-all duration-200 hover:scale-102"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6750A4]/10 to-[#6750A4]/5 flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:shadow-md">
                      <svg className="w-5 h-5 text-[#6750A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-600">Upload Icon</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG up to 5MB</span>
                  </label>
                )}
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
                	style={{ height: '130px' }}
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