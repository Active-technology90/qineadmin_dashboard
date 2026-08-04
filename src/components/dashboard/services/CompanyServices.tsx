import { useMemo, useState } from "react";
import { Plus, Edit, Trash2, Wrench, Repeat } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useServiceOfferings } from "../../../hooks/useServiceOfferings";
import { CompanySelector } from "../company-products/CompanySelector";
import { ServiceOfferingModal } from "./ServiceOfferingModal";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { Toast } from "../../ui/Toast";
import type { ServiceOffering } from "../../../types";

const BOOKING_LABELS: Record<string, string> = {
  direct: "Direct",
  inquiry: "Inquiry",
  contact: "Contact",
};

export default function CompanyServices() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const serviceCompanies = useMemo(
    () => companies.filter((c) => c.business_type === "service"),
    [companies],
  );

  const selectedCompany = companies.find((c) => c.slug === companySlug);
  const isServiceCompany = selectedCompany?.business_type === "service";

  const { offerings, loading, error, create, update, remove, refetch } =
    useServiceOfferings(isServiceCompany ? companySlug : null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOffering | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceOffering | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

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
        Select a service company to manage offerings.
      </div>
    );
  }

  if (!isServiceCompany) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <Wrench className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">Not a Service Company</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          {company?.name} is a product vendor. Service management is only available for
          companies with business type &quot;service&quot;.
        </p>
        {isSuperAdmin && (
          <button
            onClick={clearCompany}
            className="mt-4 text-sm text-purple-700 font-medium hover:underline"
          >
            Choose another company
          </button>
        )}
      </div>
    );
  }

  const handleSave = async (
    data: Partial<ServiceOffering>,
    existingId?: number,
  ): Promise<ServiceOffering> => {
    if (existingId || editing) {
      const id = existingId ?? editing!.id;
      const result = await update(id, data);
      return result;
    }
    const result = await create(data);
    return result;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      showToast("success", "Service deleted");
    } catch {
      showToast("error", "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

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
        isOpen={modalOpen}
        offering={editing}
        companySlug={companySlug!}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          refetch();
        }}
        onSave={handleSave}
        onSaved={refetch}
        onShowToast={showToast}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Services</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage service offerings for {company?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={clearCompany}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <Repeat className="h-4 w-4" />
                Switch
              </button>
            )}
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white text-sm font-medium rounded-xl hover:bg-purple-800"
            >
              <Plus className="h-4 w-4" />
              Add Service
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
            {error}{" "}
            <button onClick={refetch} className="underline ml-1">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading services...</div>
        ) : offerings.length === 0 ? (
          <div className="py-16 text-center">
            <Wrench className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No services yet. Add your first offering.</p>
          </div>
        ) : (
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
                {offerings.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 pr-4">
                      {o.primary_image ? (
                        <img
                          src={o.primary_image}
                          alt={o.title}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
                          No image
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
                          o.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {o.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{o.total_bookings ?? 0}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(o);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-purple-700 rounded-lg hover:bg-purple-50"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(o)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
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
        )}
      </div>
    </>
  );
}
