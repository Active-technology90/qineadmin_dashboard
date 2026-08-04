// src/components/admin/service-management/PromotionsManagement.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  X,
  Tag,
  Percent,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle,
  AlertCircle,
  List,
} from "lucide-react";
import type { Promotion, Service } from "../../../mock/serviceApi";
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  fetchServices,
} from "../../../mock/serviceApi";
import { Toast } from "../../ui/Toast";
import { useToast } from "../../../hooks/useToast";

// Helper to determine promotion status based on dates and isActive
const getPromoStatus = (promo: Promotion): "active" | "scheduled" | "expired" => {
  const now = new Date();
  const start = new Date(promo.startDate);
  const end = new Date(promo.endDate);
  if (!promo.isActive) return "expired"; // treated as expired if not active
  if (now < start) return "scheduled";
  if (now > end) return "expired";
  return "active";
};

export default function PromotionsManagement({
  readOnly,
}: {
  readOnly?: boolean;
}) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"code" | "discountPercent" | "startDate" | "endDate">("code");
  const [sortAsc, setSortAsc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<Omit<Promotion, "id">>({
    code: "",
    discountPercent: 10,
    startDate: "",
    endDate: "",
    applicableServices: [],
    isActive: true,
  });
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const { toast, showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [promos, svcs] = await Promise.all([
        fetchPromotions(),
        fetchServices(),
      ]);
      setPromotions(promos);
      setServices(svcs);
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: "",
      discountPercent: 10,
      startDate: "",
      endDate: "",
      applicableServices: [],
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({ ...p });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.startDate || !form.endDate) {
      showToast("error", "Code, start date, and end date are required");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      showToast("error", "End date must be after start date");
      return;
    }
    try {
      if (editing) {
        await updatePromotion(editing.id, form);
        showToast("success", "Promotion updated");
      } else {
        await createPromotion(form);
        showToast("success", "Promotion created");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    try {
      await updatePromotion(promo.id, { isActive: !promo.isActive });
      showToast("success", `Promotion ${promo.isActive ? "deactivated" : "activated"}`);
      load();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePromotion(deleteTarget.id);
      showToast("success", "Promotion deleted");
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  // Map service IDs to names
  const serviceMap = useMemo(() => {
    const map = new Map<number, string>();
    services.forEach(s => map.set(s.id, s.title));
    return map;
  }, [services]);

  // Filter & sort
  const filtered = useMemo(() => {
    let list = promotions;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(p =>
        p.code.toLowerCase().includes(s) ||
        String(p.discountPercent).includes(s)
      );
    }
    return list.sort((a, b) => {
      let valA: any, valB: any;
      switch (sortField) {
        case "code":
          valA = a.code.toLowerCase();
          valB = b.code.toLowerCase();
          break;
        case "discountPercent":
          valA = a.discountPercent;
          valB = b.discountPercent;
          break;
        case "startDate":
          valA = new Date(a.startDate).getTime();
          valB = new Date(b.startDate).getTime();
          break;
        case "endDate":
          valA = new Date(a.endDate).getTime();
          valB = new Date(b.endDate).getTime();
          break;
      }
      return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [promotions, search, sortField, sortAsc]);

  // Summary stats
  const active = filtered.filter(p => getPromoStatus(p) === "active").length;
  const scheduled = filtered.filter(p => getPromoStatus(p) === "scheduled").length;
  const expired = filtered.filter(p => getPromoStatus(p) === "expired").length;

  // Service selection toggling for form
  const toggleService = (serviceId: number) => {
    setForm(prev => ({
      ...prev,
      applicableServices: prev.applicableServices.includes(serviceId)
        ? prev.applicableServices.filter(id => id !== serviceId)
        : [...prev.applicableServices, serviceId],
    }));
  };

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Promotions</p>
          <p className="text-2xl font-bold text-secondary">{promotions.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{active}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Scheduled</p>
          <p className="text-2xl font-bold text-amber-600">{scheduled}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Expired / Inactive</p>
          <p className="text-2xl font-bold text-rose-600">{expired}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search promotions by code or discount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {!readOnly && (
            <button onClick={openCreate} className="flex items-center gap-1 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-secondary-dark">
              <Plus size={18} /> New Promotion
            </button>
          )}
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
        <span>Sort by:</span>
        {[
          { field: "code", label: "Code" },
          { field: "discountPercent", label: "Discount" },
          { field: "startDate", label: "Start Date" },
          { field: "endDate", label: "End Date" },
        ].map(({ field, label }) => (
          <button
            key={field}
            onClick={() => {
              if (sortField === field) setSortAsc(!sortAsc);
              else {
                setSortField(field as any);
                setSortAsc(true);
              }
            }}
            className={`px-2 py-0.5 rounded-full ${
              sortField === field
                ? "bg-secondary/10 text-secondary font-medium"
                : "hover:bg-gray-100"
            }`}
          >
            {label} {sortField === field && (sortAsc ? "↑" : "↓")}
          </button>
        ))}
      </div>

      {/* Promotions Table */}
      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
          <Tag className="h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-500">No promotions found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Discount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Period</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Services</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status = getPromoStatus(p);
                return (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.code}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        <Percent size={12} className="mr-1" /> {p.discountPercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="text-xs">
                        {new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.applicableServices.length === 0 ? (
                          <span className="text-xs text-gray-400">All services</span>
                        ) : (
                          p.applicableServices.map(id => (
                            <span key={id} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                              {serviceMap.get(id) || `ID ${id}`}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        status === "active"
                          ? "bg-green-100 text-green-700"
                          : status === "scheduled"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {status === "active" && <CheckCircle size={12} className="mr-1" />}
                        {status === "scheduled" && <Clock size={12} className="mr-1" />}
                        {status === "expired" && <AlertCircle size={12} className="mr-1" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={readOnly}
                          className="p-1.5 text-gray-400 hover:text-secondary rounded-lg hover:bg-secondary/10"
                          title={p.isActive ? "Deactivate" : "Activate"}
                        >
                          {p.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          disabled={readOnly}
                          className="p-1.5 text-gray-400 hover:text-secondary rounded-lg hover:bg-secondary/10"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          disabled={readOnly}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editing ? "Edit Promotion" : "Create Promotion"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Code *</label>
                <input
                  type="text"
                  placeholder="e.g., SUMMER20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Discount %</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="80"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                  <input
                    type="number"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                    className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center"
                    min="1"
                    max="80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Services
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={form.applicableServices.length === 0}
                      onChange={() => setForm({ ...form, applicableServices: [] })}
                    />
                    <span className="text-sm text-gray-700">All Services</span>
                  </label>
                  {services.map((svc) => (
                    <label
                      key={svc.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={form.applicableServices.includes(svc.id)}
                        onChange={() => toggleService(svc.id)}
                        disabled={form.applicableServices.length === 0}
                      />
                      <span className="text-sm text-gray-700">{svc.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Active</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary-dark"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h4 className="text-lg font-semibold text-gray-800">Delete Promotion</h4>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleteTarget.code}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}