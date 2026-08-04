// src/components/admin/service-management/ServiceGroupDetailModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Briefcase,
  Layers,
  Users,
  BarChart3,
  Settings,
  Plus,
  RefreshCw,
  TrendingUp,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  ShoppingBag,
  Package,
} from "lucide-react";
import type { ServiceGroup, Service, Category } from "../../../mock/serviceApi";
import ServiceTable from "./ServiceTable";
import ServiceFormModal from "./ServiceFormModal";
import ServiceDetailModal from "./ServiceDetailModal";
import {
  fetchCategoriesMock,
  MOCK_COMPANIES,
  fetchServices,
  updateService,
  deleteService,
  createService,
} from "../../../mock/serviceApi";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";

interface ServiceGroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ServiceGroup;
  services: Service[];
  readOnly: boolean;
  onRefreshServices?: () => void;
}

export default function ServiceGroupDetailModal({
  isOpen,
  onClose,
  group,
  services,
  readOnly,
  onRefreshServices,
}: ServiceGroupDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "services" | "providers" | "analytics" | "settings"
  >("overview");
  const [categories, setCategories] = useState<Category[]>([]);
  const [allServices, setAllServices] = useState<Service[]>(services);
  const [loading, setLoading] = useState(false);

  // Service CRUD state
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");

  const { toast, showToast } = useToast();

  useEffect(() => {
    fetchCategoriesMock().then(setCategories);
  }, []);

  useEffect(() => {
    setAllServices(services);
  }, [services]);

  // Refresh services data
  const refreshServices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchServices();
      setAllServices(data.filter(s => s.group_id === group.id));
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [group.id, showToast]);

  // Handlers
  const handleEdit = (svc: Service) => {
    setEditingService(svc);
    setViewingService(null);
    setFormMode("edit");
    setShowCreateModal(true);
  };

  const handleView = (svc: Service) => {
    setViewingService(svc);
  };

  const handleDelete = (svc: Service) => {
    setDeleteTarget(svc);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService(deleteTarget.slug);
      showToast("success", "Service deleted");
      setDeleteTarget(null);
      refreshServices();
      onRefreshServices?.();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (formMode === "edit" && editingService) {
      await updateService(editingService.slug, formData);
      showToast("success", "Service updated");
    } else {
      await createService({
        ...formData,
        group_id: group.id,
        group_name: group.name,
      });
      showToast("success", "Service created");
    }
    setShowCreateModal(false);
    setEditingService(null);
    refreshServices();
    onRefreshServices?.();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: Briefcase },
    { id: "services", label: "Services", icon: Layers },
    { id: "providers", label: "Providers", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-[65vw] max-w-[1200px] h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <Toast toast={toast} />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200/80 px-8 py-5 shrink-0 bg-gradient-to-r from-gray-50/90 to-white/90 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={group.image}
                className="h-20 w-20 rounded-2xl object-cover shadow-md"
                alt=""
              />
              {group.icon && (
                <img
                  src={group.icon}
                  className="h-10 w-10 rounded-full border-2 border-white absolute -bottom-2 -right-2 shadow-sm"
                  alt=""
                />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{group.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{group.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                    group.is_active
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                      : "bg-red-50 text-red-700 ring-1 ring-red-200/50"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {group.is_active ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-gray-400">
                  Created {new Date(group.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200/80 px-6 space-x-1 overflow-x-auto bg-white/80">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-secondary text-secondary bg-secondary/5"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.id === "services" && (
                <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {allServices.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <DollarSign size={16} />
                    Revenue
                  </div>
                  <p className="text-2xl font-bold text-secondary">
                    ETB {group.total_revenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <ShoppingBag size={16} />
                    Bookings
                  </div>
                  <p className="text-2xl font-bold text-secondary">
                    {group.total_bookings}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Users size={16} />
                    Providers
                  </div>
                  <p className="text-2xl font-bold text-secondary">
                    {group.total_providers}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Package size={16} />
                    Services
                  </div>
                  <p className="text-2xl font-bold text-secondary">
                    {group.total_services}
                  </p>
                </div>
              </div>

              {/* About this group */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  About this group
                </h3>
                <p className="text-gray-600">{group.description}</p>
                {group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {group.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "services" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Services in {group.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Manage all services belonging to this group
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshServices}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                    title="Refresh"
                  >
                    <RefreshCw size={18} />
                  </button>
                  {!readOnly && (
                    <button
                      onClick={() => {
                        setEditingService(null);
                        setFormMode("create");
                        setShowCreateModal(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary-dark transition-all"
                    >
                      <Plus size={18} /> Add Service
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />
              ) : allServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
                  <Layers className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-800">
                    No services yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Click the button above to add a new service to this group.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
                  <ServiceTable
                    services={allServices}
                    categories={categories}
                    loading={loading}
                    readOnly={readOnly}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    onManageFields={() => {}}
                    onManageCompanies={() => {}}
                    sortField="title"
                    sortOrder="asc"
                    onSort={() => {}}
                    currentPage={1}
                    itemsPerPage={10}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "providers" && (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
              <Users className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800">Providers</h3>
              <p className="mt-1 text-sm text-gray-500">Coming soon</p>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
              <BarChart3 className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800">Analytics</h3>
              <p className="mt-1 text-sm text-gray-500">Coming soon</p>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
              <Settings className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800">Settings</h3>
              <p className="mt-1 text-sm text-gray-500">Coming soon</p>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-gray-200/80 px-8 py-4 shrink-0 bg-white/80 backdrop-blur-sm flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>

      {/* Create / Edit Service Modal */}
      {showCreateModal && (
        <ServiceFormModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingService(null);
          }}
          service={editingService}
          mode={formMode}
          categories={categories}
          onSubmit={handleFormSubmit}
          readOnly={readOnly || formMode === "view"}
          allCompanies={MOCK_COMPANIES}
        />
      )}

      {/* Service Detail Modal */}
      {viewingService && (
        <ServiceDetailModal
          isOpen={!!viewingService}
          onClose={() => setViewingService(null)}
          service={viewingService}
          services={allServices}
          onEdit={(svc) => {
            setViewingService(null);
            handleEdit(svc);
          }}
          onDelete={(svc) => {
            setViewingService(null);
            handleDelete(svc);
          }}
          readOnly={readOnly}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ""}
        deleteTitle="Delete Service"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}