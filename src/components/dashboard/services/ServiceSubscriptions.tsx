import { useState, useMemo, useEffect } from "react";
import {
  Repeat,
  Search,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { CompanySelector } from "../company-products/CompanySelector";
import { getManageServiceSubscriptions } from "../../../services/api";
import { ServiceSubscriptionManageModal } from "./ServiceSubscriptionManageModal";
import { Toast } from "../../ui/Toast";
import type { ServiceSubscription } from "../../../types";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All Contracts", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function ServiceSubscriptions() {
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

  const [subscriptions, setSubscriptions] = useState<ServiceSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Modal & Toast
  const [selectedSubscription, setSelectedSubscription] = useState<ServiceSubscription | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchSubscriptions = async () => {
    if (!companySlug) return;
    try {
      setLoading(true);
      const params = selectedStatus !== "all" ? { status: selectedStatus } : undefined;
      const res = await getManageServiceSubscriptions(companySlug, params);
      setSubscriptions(res.data || []);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [companySlug, selectedStatus]);

  const filteredSubscriptions = useMemo(() => {
    if (!search.trim()) return subscriptions;
    const term = search.toLowerCase();
    return subscriptions.filter(
      (s) =>
        s.customer_name?.toLowerCase().includes(term) ||
        s.offering?.title?.toLowerCase().includes(term) ||
        s.assigned_staff?.name?.toLowerCase().includes(term) ||
        String(s.id).includes(term),
    );
  }, [subscriptions, search]);

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-emerald-100", text: "text-emerald-800" },
    paused: { bg: "bg-blue-100", text: "text-blue-800" },
    completed: { bg: "bg-purple-100", text: "text-purple-800" },
    cancelled: { bg: "bg-red-100", text: "text-red-800" },
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Repeat className="h-7 w-7 text-[#6750A4]" /> Recurring Contracts & Subscriptions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage ongoing student tutoring, gym memberships, recurring cleaning contracts, and periodic billing.
          </p>
        </div>

        {companySlug && (
          <button
            onClick={fetchSubscriptions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all"
          >
            <RefreshCw className={`h-4 w-4 text-[#6750A4] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Company Selector (for Super Admins) */}
      {showSelector && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <CompanySelector
            companies={serviceCompanies}
            isLoading={isLoadingCompanies}
            onSelect={(slug: string, name: string) => {
              const membership = user?.memberships?.find(
                (m: any) => m.company_slug === slug,
              );
              const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");
              switchCompany({ slug, name, role });
            }}
            onBack={clearCompany}
          />
        </div>
      )}

      {/* Content */}
      {companySlug && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {STATUS_TABS.map((tab) => {
                const isActive = selectedStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedStatus(tab.value)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      isActive
                        ? "bg-[#6750A4] text-white shadow-sm"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contract #, client, tutor..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-[#6750A4] focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#6750A4] mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500">Loading recurring contracts...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="py-16 text-center">
              <Repeat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">No Recurring Subscriptions Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                When customers book ongoing long-term services (such as tutoring contracts), they will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Contract #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Service Offering</th>
                    <th className="py-3.5 px-4">Cycle Fee</th>
                    <th className="py-3.5 px-4">Next Billing Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-4 px-4 font-bold text-gray-900">
                        #{sub.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{sub.customer_name}</div>
                        {sub.customer_phone && (
                          <div className="text-xs text-gray-500">{sub.customer_phone}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-800">
                          {sub.offering?.title || "Recurring Service"}
                        </div>
                        {sub.assigned_staff && (
                          <div className="text-xs text-[#6750A4] font-medium mt-0.5">
                            Tutor: {sub.assigned_staff.name}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">
                          {parseFloat(sub.cycle_amount).toLocaleString()} {sub.currency}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium capitalize">
                          per {sub.billing_cycle}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-gray-700">
                        {sub.next_billing_date || "—"}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            statusColors[sub.status]?.bg || "bg-gray-100"
                          } ${statusColors[sub.status]?.text || "text-gray-800"}`}
                        >
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setManageModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 bg-purple-50 text-[#6750A4] hover:bg-[#6750A4] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          Manage Contract
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subscription Manage Modal */}
      {manageModalOpen && selectedSubscription && (
        <ServiceSubscriptionManageModal
          isOpen={manageModalOpen}
          subscription={selectedSubscription}
          companySlug={companySlug!}
          onClose={() => {
            setManageModalOpen(false);
            setSelectedSubscription(null);
          }}
          onUpdated={() => {
            fetchSubscriptions();
            setManageModalOpen(false);
            setSelectedSubscription(null);
          }}
          onShowToast={(type, message) => setToast({ type, message })}
        />
      )}
    </div>
  );
}
