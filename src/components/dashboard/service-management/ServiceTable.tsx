import React, { useMemo } from "react";
import { ImageIcon, Edit, Trash2, Eye, Settings, Building2 } from "lucide-react";
import { DataTable, type Column } from "../../ui/DataTable";
import MobileCardSkeleton from "../../ui/MobileCardSkeleton";
import type { Service, Category } from "../../../types";

interface ServiceTableProps {
  services: Service[];
  categories: Category[];
  loading: boolean;
  readOnly: boolean;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onView: (service: Service) => void;
  onManageFields: (service: Service) => void;
  onManageCompanies: (service: Service) => void;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  currentPage: number;
  itemsPerPage: number;
}

const MemoizedDataTable = React.memo(DataTable) as typeof DataTable;

const ServiceTable: React.FC<ServiceTableProps> = ({
  services,
  categories,
  loading,
  readOnly,
  onEdit,
  onDelete,
  onView,
  onManageFields,
  onManageCompanies,
  sortField,
  sortOrder,
  onSort,
  currentPage,
  itemsPerPage,
}) => {
  const servicesWithRow = useMemo(
    () => services.map((item, idx) => ({ ...item, rowNumber: (currentPage - 1) * itemsPerPage + idx + 1 })),
    [services, currentPage, itemsPerPage]
  );

  // Helper to find parent title
  const getParentTitle = (svc: Service) => {
    const parent = services.find(s => s.id === svc.parent_id);
    return parent ? parent.title : "—";
  };

  const columns: Column<Service>[] = useMemo(() => [
    { key: "rowNumber", header: "#", sortable: false, render: (svc: Service & { rowNumber?: number }) => svc.rowNumber },
    {
      key: "icon",
      header: "Image",
      sortable: false,
      render: (svc) =>
        svc.icon ? (
          <img src={svc.icon} alt={svc.title} className="h-8 w-8 rounded object-cover" />
        ) : (
          <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
            <ImageIcon size={14} className="text-gray-400" />
          </div>
        ),
    },
    { key: "title", header: "Service Name", sortable: true, className: "font-medium text-gray-900" },
    { key: "slug", header: "Slug", sortable: true, className: "font-mono text-gray-500" },
    {
      key: "service_category",
      header: "Category",
      sortable: true,
      render: (svc) => svc.service_category || "—",
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (svc) => `${svc.currency || ""} ${svc.price || "0.00"}`,
    },
    {
      key: "duration_minutes",
      header: "Duration",
      sortable: true,
      render: (svc) => `${svc.duration_minutes || 0} min`,
    },
    // ── NEW: Parent column ──
    {
      key: "parent",
      header: "Parent",
      sortable: false,
      render: (svc) => (
        <span className="text-sm text-gray-500">{getParentTitle(svc)}</span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      render: (svc) => (
        <span className={`px-2 py-1 text-xs rounded-full ${svc.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {svc.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "orders_count", header: "Orders", sortable: true, render: (svc) => svc.orders_count ?? 0 },
    { key: "revenue", header: "Revenue", sortable: true, render: (svc) => `$${(svc.revenue ?? 0).toLocaleString()}` },
    { key: "created_at", header: "Created", sortable: true, render: (svc) => new Date(svc.created_at).toLocaleDateString() },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (svc) => (
        <div className="flex items-center gap-1">
          <button onClick={() => onView(svc)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye size={16} /></button>
          {!readOnly && (
            <>
              <button onClick={() => onEdit(svc)} className="p-1.5 text-gray-500 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="Edit"><Edit size={16} /></button>
              <button onClick={() => onManageFields(svc)} className="p-1.5 text-gray-500 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="Form Fields"><Settings size={16} /></button>
              <button onClick={() => onManageCompanies(svc)} className="p-1.5 text-gray-500 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="Companies"><Building2 size={16} /></button>
              <button onClick={() => onDelete(svc)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      ),
    },
  ], [categories, readOnly, onView, onEdit, onManageFields, onManageCompanies, onDelete, services]);

  if (loading) {
    return (
      <>
        <div className="hidden md:block"><MemoizedDataTable data={[]} columns={columns} loading={true} emptyMessage="" /></div>
        <div className="md:hidden"><MobileCardSkeleton count={3} metaLinePairs={2} showActions={!readOnly} /></div>
      </>
    );
  }

  if (!servicesWithRow.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-2">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><ImageIcon className="h-8 w-8 text-gray-400" /></div>
        <h3 className="text-lg font-semibold text-gray-900">No services found</h3>
        <p className="text-sm text-gray-500 mt-1">{!readOnly ? "Create your first service." : "No services available."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto -mx-2 sm:-mx-4 px-2 sm:px-4">
        <MemoizedDataTable<Service>
          data={servicesWithRow}
          columns={columns}
          loading={false}
          emptyMessage="No services found"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      </div>

      <div className="md:hidden space-y-4 px-2 pb-24">
        {servicesWithRow.map((svc) => (
          <div key={svc.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3">
            <div className="flex items-center gap-3">
              {svc.icon ? (
                <img src={svc.icon} alt={svc.title} className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center"><ImageIcon size={18} className="text-gray-400" /></div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{svc.title}</h3>
                <p className="text-xs text-gray-500">{svc.slug}</p>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] xs:text-xs font-medium rounded-full ${svc.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {svc.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div><span className="font-medium">Category:</span> {svc.service_category || "—"}</div>
              <div><span className="font-medium">Price:</span> {svc.currency} {svc.price}</div>
              <div><span className="font-medium">Duration:</span> {svc.duration_minutes} min</div>
              <div><span className="font-medium">Parent:</span> {getParentTitle(svc)}</div>
              <div><span className="font-medium">Orders:</span> {svc.orders_count ?? 0}</div>
            </div>
            <div className="flex gap-2 pt-1 flex-wrap">
              <button onClick={() => onView(svc)} className="flex-1 bg-blue-50 text-blue-600 text-xs font-medium p-1 rounded-xl hover:bg-blue-100 min-h-[32px]"><Eye size={14} className="inline-block mr-1" /> View</button>
              {!readOnly && (
                <>
                  <button onClick={() => onEdit(svc)} className="flex-1 bg-secondary/10 text-secondary text-xs font-medium p-1 rounded-xl hover:bg-secondary/20 min-h-[32px]"><Edit size={14} className="inline-block mr-1" /> Edit</button>
                  <button onClick={() => onManageFields(svc)} className="flex-1 bg-secondary/10 text-secondary text-xs font-medium p-1 rounded-xl hover:bg-secondary/20 min-h-[32px]"><Settings size={14} className="inline-block mr-1" /> Fields</button>
                  <button onClick={() => onManageCompanies(svc)} className="flex-1 bg-secondary/10 text-secondary text-xs font-medium p-1 rounded-xl hover:bg-secondary/20 min-h-[32px]"><Building2 size={14} className="inline-block mr-1" /> Companies</button>
                  <button onClick={() => onDelete(svc)} className="flex-1 bg-red-50 text-red-600 text-xs font-medium p-1 rounded-xl hover:bg-red-100 min-h-[32px]"><Trash2 size={14} className="inline-block mr-1" /> Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default React.memo(ServiceTable);