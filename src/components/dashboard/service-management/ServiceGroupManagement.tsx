// src/components/admin/service-management/ServiceGroupManagement.tsx
import React, { useState, useMemo } from "react";
import {
  RefreshCw,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import type { ServiceGroup, Service } from "../../../mock/serviceApi";
import { SearchInput } from "../../ui/SearchInput";
import { TableControls } from "../../ui/TableControls";
import { Pagination } from "../../ui/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { DataTable, type Column } from "../../ui/DataTable";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import ServiceGroupDetailModal from "./ServiceGroupDetailModal";
import ServiceGroupFormModal from "./ServiceGroupFormModal";
import {
  updateServiceGroup,
  deleteServiceGroup,
} from "../../../mock/serviceApi";

interface ServiceGroupManagementProps {
  groups: ServiceGroup[];
  loading: boolean;
  readOnly: boolean;
  services: Service[];
  onRefresh: () => void;
}

export default function ServiceGroupManagement({
  groups,
  loading,
  readOnly,
  services,
  onRefresh,
}: ServiceGroupManagementProps) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedGroup, setSelectedGroup] = useState<ServiceGroup | null>(null);
  const [editGroup, setEditGroup] = useState<ServiceGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceGroup | null>(null);
  const { toast, showToast } = useToast();

  // Filter & sort (same as before)
  const filtered = useMemo(() => {
    let list = groups;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(s) ||
          g.description.toLowerCase().includes(s) ||
          g.category.toLowerCase().includes(s)
      );
    }
    return list.sort((a, b) => {
      let valA: any = a[sortField as keyof ServiceGroup] ?? "";
      let valB: any = b[sortField as keyof ServiceGroup] ?? "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      return sortOrder === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [groups, search, sortField, sortOrder]);

  const { paginatedItems, currentPage, totalPages, goToPage, resetPage } =
    usePagination(filtered, pageSize);

  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.is_active).length;
  const totalServices = groups.reduce((sum, g) => sum + g.total_services, 0);
  const totalRevenue = groups.reduce((sum, g) => sum + g.total_revenue, 0);

  const handleEdit = (g: ServiceGroup) => {
    setEditGroup(g);
  };

  const handleEditSave = async (data: Partial<ServiceGroup>) => {
    if (!editGroup) return;
    try {
      await updateServiceGroup(editGroup.id, data);
      showToast("success", "Group updated");
      setEditGroup(null);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteServiceGroup(deleteTarget.id);
      showToast("success", "Group deleted");
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const columns: Column<ServiceGroup>[] = useMemo(
    () => [
      {
        key: "icon",
        header: "",
        sortable: false,
        render: (g) => (
          <img src={g.icon} className="h-8 w-8 rounded object-cover" alt="" />
        ),
      },
      { key: "name", header: "Group Name", sortable: true },
      { key: "description", header: "Description", sortable: true },
      { key: "category", header: "Category", sortable: true },
      { key: "total_services", header: "Services", sortable: true },
      { key: "total_providers", header: "Providers", sortable: true },
      { key: "total_bookings", header: "Bookings", sortable: true },
      {
        key: "total_revenue",
        header: "Revenue",
        sortable: true,
        render: (g) => `ETB ${g.total_revenue.toLocaleString()}`,
      },
      {
        key: "is_active",
        header: "Status",
        sortable: true,
        render: (g) => (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              g.is_active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {g.is_active ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "created_at",
        header: "Created",
        sortable: true,
        render: (g) => new Date(g.created_at).toLocaleDateString(),
      },
      {
        key: "actions",
        header: "",
        sortable: false,
        render: (g) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedGroup(g)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="View"
            >
              <Eye size={16} />
            </button>
            {!readOnly && (
              <>
                <button
                  onClick={() => handleEdit(g)}
                  className="p-1.5 text-gray-500 hover:text-secondary hover:bg-secondary/10 rounded-lg"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(g)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [readOnly]
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Service Groups</h2>
          <p className="text-sm text-gray-500 mt-1">
            Organise services into logical collections
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Groups</p>
          <p className="text-2xl font-bold text-secondary">{totalGroups}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{activeGroups}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Services</p>
          <p className="text-2xl font-bold text-secondary">{totalServices}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-secondary">
            ETB {totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-sm px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search groups..."
              className="w-full"
            />
          </div>
          <TableControls pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); resetPage(); }} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <DataTable
          data={paginatedItems}
          columns={columns}
          loading={false}
          emptyMessage="No groups found"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={(field) => {
            if (sortField === field) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            else { setSortField(field); setSortOrder("asc"); }
          }}
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />

      {/* Group detail modal */}
      {selectedGroup && (
        <ServiceGroupDetailModal
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          group={selectedGroup}
          services={services.filter((s) => s.group_id === selectedGroup.id)}
          readOnly={readOnly}
          onRefreshServices={onRefresh}
        />
      )}

      {/* Edit group modal */}
      {editGroup && (
        <ServiceGroupFormModal
          isOpen={!!editGroup}
          onClose={() => setEditGroup(null)}
          group={editGroup}
          onSave={handleEditSave}
        />
      )}

      {/* Delete confirmation */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.name || ""}
        deleteTitle="Delete Group"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}