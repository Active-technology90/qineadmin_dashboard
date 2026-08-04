// src/components/admin/service-management/CategoriesManagement.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  Tag,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  ChevronDown,
} from "lucide-react";
import { fetchCategoriesMock, createCategory, updateCategory, deleteCategory } from "../../../mock/serviceApi";
import { Toast } from "../../ui/Toast";
import { useToast } from "../../../hooks/useToast";
import type { Category } from "../../../types";

const skeleton = <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;

export default function CategoriesManagement({ readOnly }: { readOnly?: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    parent_id: null as number | null,
    is_active: true,
  });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [sortField, setSortField] = useState<"name" | "service_count">("name");
  const [sortAsc, setSortAsc] = useState(true);
  const { toast, showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCategoriesMock();
      setCategories(data);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", icon: "", parent_id: null, is_active: true });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon || "",
      parent_id: cat.parent_id ?? null,
      is_active: cat.is_active ?? true,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      showToast("error", "Name and slug are required");
      return;
    }
    try {
      if (editing) {
        await updateCategory(editing.id, form);
        showToast("success", "Category updated");
      } else {
        await createCategory(form);
        showToast("success", "Category created");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      showToast("success", "Category deleted");
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  // Filter & sort
  const filtered = useMemo(() => {
    let list = categories;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(s) ||
        c.slug.toLowerCase().includes(s) ||
        (c.description && c.description.toLowerCase().includes(s))
      );
    }
    return list.sort((a, b) => {
      let valA: any, valB: any;
      if (sortField === "name") {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else {
        valA = a.service_count || 0;
        valB = b.service_count || 0;
      }
      return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [categories, search, sortField, sortAsc]);

  const totalCategories = categories.length;
  const activeCount = categories.filter(c => c.is_active !== false).length;
  const totalServices = categories.reduce((sum, c) => sum + (c.service_count || 0), 0);

  if (loading) return skeleton;

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Categories</p>
          <p className="text-2xl font-bold text-secondary">{totalCategories}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Linked Services</p>
          <p className="text-2xl font-bold text-purple-600">{totalServices}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm shadow-sm transition focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Refresh">
            <RefreshCw size={18} />
          </button>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setViewMode("table")} className={`p-2 ${viewMode === "table" ? "bg-secondary text-white" : "bg-white text-gray-500"}`}>
              <List size={16} />
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-secondary text-white" : "bg-white text-gray-500"}`}>
              <LayoutGrid size={16} />
            </button>
          </div>
          {!readOnly && (
            <button onClick={openCreate} className="flex items-center gap-1 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-dark">
              <Plus size={18} /> New Category
            </button>
          )}
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Sort by:</span>
        <button onClick={() => { setSortField("name"); setSortAsc(!sortAsc); }} className={`px-2 py-0.5 rounded-full ${sortField === "name" ? "bg-secondary/10 text-secondary font-medium" : "hover:bg-gray-100"}`}>
          Name {sortField === "name" && (sortAsc ? "↑" : "↓")}
        </button>
        <button onClick={() => { setSortField("service_count"); setSortAsc(!sortAsc); }} className={`px-2 py-0.5 rounded-full ${sortField === "service_count" ? "bg-secondary/10 text-secondary font-medium" : "hover:bg-gray-100"}`}>
          Services {sortField === "service_count" && (sortAsc ? "↑" : "↓")}
        </button>
      </div>

      {/* Content: Table or Grid */}
      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
          <Tag className="h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-500">No categories found</p>
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Services</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cat => (
                <tr key={cat.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {cat.icon ? (
                        <img src={cat.icon} className="h-8 w-8 rounded-lg object-cover border" alt="" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                          <Tag size={14} />
                        </div>
                      )}
                      <span className="font-medium text-gray-800">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{cat.description || "—"}</td>
                  <td className="px-4 py-3 text-center">{cat.service_count ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    {cat.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        <CheckCircle size={12} className="mr-1" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        <AlertCircle size={12} className="mr-1" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button disabled={readOnly} onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-secondary rounded-lg hover:bg-secondary/10" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button disabled={readOnly} onClick={() => setDeleteTarget(cat)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cat => (
            <div key={cat.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {cat.icon ? (
                      <img src={cat.icon} className="h-12 w-12 rounded-xl object-cover border" alt="" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                        <Tag size={20} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                      <p className="text-xs text-gray-500">{cat.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button disabled={readOnly} onClick={() => openEdit(cat)} className="p-1 text-gray-400 hover:text-secondary"><Edit size={14} /></button>
                    <button disabled={readOnly} onClick={() => setDeleteTarget(cat)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{cat.description || "No description"}</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Tag size={12} /> {cat.service_count ?? 0} services
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${cat.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editing ? "Edit Category" : "Create Category"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug *</label>
                <input type="text" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Icon URL</label>
                <input type="text" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." />
                {form.icon && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Preview:</span>
                    <img src={form.icon} className="h-8 w-8 rounded object-cover border" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Category</label>
                <select value={form.parent_id ?? ""} onChange={e => setForm({...form, parent_id: e.target.value ? Number(e.target.value) : null})} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">None (top-level)</option>
                  {categories.filter(c => c.id !== editing?.id).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Active</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary-dark">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h4 className="text-lg font-semibold text-gray-800">Delete Category</h4>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}