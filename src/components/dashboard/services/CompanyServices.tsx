import { useState, useMemo, useEffect, useCallback } from "react";
import { Wrench, Plus, Edit, Trash2, Repeat, Search, RefreshCw } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useServiceOfferings } from "../../../hooks/useServiceOfferings";
import { CompanySelector } from "../company-products/CompanySelector";
import { ServiceOfferingModal } from "./ServiceOfferingModal";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import type { ServiceOffering } from "../../../types";

/* ---------- custom debounce hook ---------- */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const BOOKING_LABELS: Record<string, string> = {
  direct: "Direct",
  inquiry: "Inquiry",
  contact: "Contact",
};

const PAGE_SIZE_OPTIONS: SelectOption[] = [
  { value: "10", label: "10 / page" },
  { value: "15", label: "15 / page" },
  { value: "20", label: "20 / page" },
  { value: "30", label: "30 / page" },
  { value: "50", label: "50 / page" },
  { value: "75", label: "75 / page" },
  { value: "100", label: "100 / page" },
];

export default function CompanyServices() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const serviceCompanies = useMemo(
    () => companies.filter((c) => c.business_type === "service"),
    [companies],
  );

  const selectedCompany = companies.find((c) => c.slug === companySlug);
  const isServiceCompany = selectedCompany?.business_type === "service";

  const {
    offerings,
    loading,
    error,
    create,
    update,
    remove,
    refetch,
    getDetail,
  } = useServiceOfferings(isServiceCompany ? companySlug : null);

  // ---------- search with debounce ----------
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOfferings = useMemo(() => {
    if (!debouncedSearch.trim()) return offerings;
    const term = debouncedSearch.toLowerCase();
    return offerings.filter(
      (o) =>
        o.title.toLowerCase().includes(term) ||
        (o.service_category && o.service_category.toLowerCase().includes(term)),
    );
  }, [offerings, debouncedSearch]);

  const totalItems = filteredOfferings.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedOfferings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOfferings.slice(start, start + pageSize);
  }, [filteredOfferings, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, pageSize]);

  // ---------- modal & toast ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOffering | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceOffering | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const handleSave = async (
    data: Partial<ServiceOffering>,
    existingId?: number,
  ): Promise<ServiceOffering> => {
    const id = existingId ?? editing?.id;
    try {
      if (id) {
        const result = await update(id, data);
        showToast("success", "Service updated");
        return result;
      }
      const result = await create(data);
      showToast("success", "Service created");
      return result;
    } catch (err: any) {
      showToast("error", err?.response?.data?.detail || "Save failed");
      throw err;
    } finally {
      refetch();
    }
  };

  const handleEdit = async (offering: ServiceOffering) => {
    try {
      const fullOffering = await getDetail(offering.id);
      setEditing(fullOffering);
      setModalOpen(true);
    } catch {
      showToast("error", "Failed to load service details");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      showToast("success", "Service deleted");
      setDeleteTarget(null);
      refetch();
    } catch {
      showToast("error", "Delete failed");
      setDeleteTarget(null);
    }
  };

  // ---------- early returns ----------
  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies.length ? serviceCompanies : companies}
        isLoading={isLoadingCompanies}
        title="Service Management"
        searchPlaceholder="Search service companies..."
        onSelect={(slug, name) => {
          const membership = user?.memberships?.find((m: any) => m.company_slug === slug);
          const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");
          switchCompany({ slug, name, role });
        }}
        onBack={clearCompany}
      />
    );
  }

  if (!companySlug) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Wrench className="h-12 w-12 text-gray-300 mb-4" />
        <p>Select a service company to manage offerings.</p>
      </div>
    );
  }

  if (!isServiceCompany) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <Wrench className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">Not a Service Company</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          {companyName} is a product vendor. Service management is only available for companies with business type "service".
        </p>
        {isSuperAdmin && (
          <button
            onClick={clearCompany}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-purple-700 font-medium hover:underline"
          >
            <Repeat className="h-4 w-4" /> Choose another company
          </button>
        )}
      </div>
    );
  }

  // ---------- main content ----------
  return (
    <>
      <Toast toast={toast} />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ServiceOfferingModal
        key={editing?.id ?? "new"}
        isOpen={modalOpen}
        offering={editing}
        companySlug={companySlug}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          refetch();
        }}
        onSave={handleSave}
        onSaved={refetch}
        onShowToast={showToast}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-secondary">My Services</h1>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm text-gray-500">Manage service offerings for</p>
              <span className="text-sm text-secondary font-bold">{companyName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={clearCompany}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-secondary border border-secondary rounded-xl hover:bg-purple-50 transition"
              >
                <Repeat className="h-4 w-4" /> Switch
              </button>
            )}
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-secondary transition shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Service
            </button>
          </div>
        </div>

        {/* Search + Refresh (inline) & Page Size */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-4">
          <div className="flex items-center gap-3 w-full lg:max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50
                           focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                           outline-none transition text-sm"
              />
            </div>
            <button
              onClick={refetch}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-gray-50
                         hover:bg-white hover:border-secondary transition-all duration-200 group flex-shrink-0"
              title="Refresh services"
            >
              <RefreshCw className="h-4 w-4 text-gray-500 group-hover:text-secondary group-hover:rotate-180 transition-all duration-300" />
            </button>
          </div>
          <div className="w-24 lg:w-28">
            <CustomSelect
              value={String(pageSize)}
              onChange={(val) => setPageSize(Number(val))}
              options={PAGE_SIZE_OPTIONS}
              placeholder="10"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
            {error}{" "}
            <button onClick={refetch} className="underline ml-1">Retry</button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading services...</div>
        ) : paginatedOfferings.length === 0 ? (
          <div className="py-16 text-center">
            <Wrench className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {offerings.length === 0
                ? "No services yet. Add your first offering."
                : "No matching services found."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                    <th className="pb-3 pr-4">Image</th>
                    <th className="pb-3 pr-4">Service</th>
                    <th className="pb-3 pr-4">Price</th>
                    <th className="pb-3 pr-4">Duration</th>
                    <th className="pb-3 pr-4">Booking</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Bookings</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOfferings.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 pr-4">
                        {o.primary_image ? (
                          <img
                            src={o.primary_image}
                            alt={o.title}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{o.title}</p>
                        {o.service_category && (
                          <p className="text-xs text-gray-400">{o.service_category}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {o.pricing_type === "custom"
                          ? "Quote"
                          : `${Number(o.price || 0).toLocaleString()} ${o.currency}`}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {o.duration_minutes ? `${o.duration_minutes} min` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">
                          {BOOKING_LABELS[o.booking_mode] || o.booking_mode}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                            o.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {o.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{o.total_bookings ?? 0}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(o)}
                            className="p-1.5 text-secondary hover:text-purple-700 rounded-lg hover:bg-purple-50"
                          >
                            <Edit className="h-4 w-4 text-secondary" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(o)}
                            className="p-1.5 text-red-700 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}