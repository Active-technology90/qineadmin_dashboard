import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Repeat,
  Search,
  RefreshCw,
  SlidersHorizontal,
  AlertCircle,
  X,
  Calendar,
  CalendarClock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Wrench,
  Phone,
  FileText,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { CompanySelector } from "../company-products/CompanySelector";
import { getManageServiceSubscriptions } from "../../../services/api";
import { ServiceSubscriptionManageModal } from "./ServiceSubscriptionManageModal";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import type { ServiceSubscription } from "../../../types";

/* ---------- custom debounce hook ---------- */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All Contracts", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const PAGE_SIZE_OPTIONS: SelectOption[] = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "30", label: "30 / page" },
  { value: "50", label: "50 / page" },
  { value: "100", label: "100 / page" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; className: string }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
};

/* ---------- helpers ---------- */
function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";

  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatAmount(value: string | number): string {
  const numericValue = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString() : "0";
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDay(date: Date, today: Date): boolean {
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return target < today;
}

function isToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return isSameDay(target, today);
}

function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const responseError = error as {
      response?: { data?: { detail?: string } };
    };

    if (responseError.response?.data?.detail) {
      return responseError.response.data.detail;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while loading recurring contracts.";
}

/* ---------- presentational components ---------- */
function SubscriptionStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    icon: Activity,
    className: "bg-gray-50 text-gray-700 ring-gray-500/20",
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function BillingDateCell({ date }: { date?: string | null }) {
  if (!date) {
    return <span className="text-gray-400">—</span>;
  }

  if (isOverdue(date)) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-red-600">
        <AlertCircle className="h-4 w-4" />
        Overdue
      </span>
    );
  }

  if (isToday(date)) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
        <CalendarClock className="h-4 w-4" />
        Today
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-gray-700">
      <Calendar className="h-4 w-4 text-gray-400" />
      {formatDate(date)}
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-gray-900">{value}</p>
        <p className="mt-1 truncate text-xs font-medium text-gray-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function SubscriptionTableSkeleton() {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-500">
            <th className="pb-3 pr-4">Contract</th>
            <th className="pb-3 pr-4">Customer</th>
            <th className="pb-3 pr-4">Service</th>
            <th className="pb-3 pr-4">Billing</th>
            <th className="pb-3 pr-4">Next Billing</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="animate-pulse">
          {[...Array(5)].map((_, index) => (
            <tr key={index} className="border-b border-gray-50">
              <td className="py-4 pr-4">
                <div className="h-4 w-14 rounded bg-gray-200" />
              </td>
              <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 rounded bg-gray-200" />
                    <div className="h-3 w-20 rounded bg-gray-100" />
                  </div>
                </div>
              </td>
              <td className="py-4 pr-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
              </td>
              <td className="py-4 pr-4">
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-16 rounded bg-gray-100" />
              </td>
              <td className="py-4 pr-4">
                <div className="h-4 w-24 rounded bg-gray-200" />
              </td>
              <td className="py-4 pr-4">
                <div className="h-5 w-16 rounded-full bg-gray-200" />
              </td>
              <td className="py-4 text-right">
                <div className="ml-auto h-8 w-20 rounded-lg bg-gray-200" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubscriptionCardSkeleton() {
  return (
    <div className="space-y-3 md:hidden">
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-100" />
              </div>
            </div>
            <div className="h-5 w-16 rounded-full bg-gray-200" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="h-3 w-12 rounded bg-gray-100" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-gray-100" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
          </div>
          <div className="mt-4 h-10 w-full rounded-xl bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function ServiceSubscriptions() {
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

  /* ---------- subscription state ---------- */
  const [subscriptions, setSubscriptions] = useState<ServiceSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedSubscription, setSelectedSubscription] =
    useState<ServiceSubscription | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      setToast({ type, message });
      toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  /* ---------- data fetching ---------- */
  const requestIdRef = useRef(0);

  const fetchSubscriptions = useCallback(async () => {
    if (!companySlug) return;

    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const params =
        selectedStatus !== "all" ? { status: selectedStatus } : undefined;
      const response = await getManageServiceSubscriptions(companySlug, params);

      if (requestId === requestIdRef.current) {
        setSubscriptions(response.data || []);
      }
    } catch (fetchError) {
      if (requestId === requestIdRef.current) {
        setError(getApiErrorMessage(fetchError));
        setSubscriptions([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [companySlug, selectedStatus]);

  useEffect(() => {
    void fetchSubscriptions();
  }, [fetchSubscriptions]);

  /* ---------- derived data ---------- */
  const filteredSubscriptions = useMemo(() => {
    if (!debouncedSearch.trim()) return subscriptions;

    const term = debouncedSearch.toLowerCase().trim();

    return subscriptions.filter((subscription) => {
      const idMatches = String(subscription.id).includes(term);
      const customerName = subscription.customer_name?.toLowerCase() ?? "";
      const customerPhone = subscription.customer_phone?.toLowerCase() ?? "";
      const offeringTitle = subscription.offering?.title?.toLowerCase() ?? "";
      const staffName = subscription.assigned_staff?.name?.toLowerCase() ?? "";

      return (
        idMatches ||
        customerName.includes(term) ||
        customerPhone.includes(term) ||
        offeringTitle.includes(term) ||
        staffName.includes(term)
      );
    });
  }, [subscriptions, debouncedSearch]);

  const totalItems = filteredSubscriptions.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedSubscriptions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubscriptions.slice(start, start + pageSize);
  }, [filteredSubscriptions, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, pageSize, selectedStatus, companySlug]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const kpiCards = useMemo(() => {
    const total = subscriptions.length;
    const active = subscriptions.filter((s) => s.status === "active").length;
    const paused = subscriptions.filter((s) => s.status === "paused").length;
    const completed = subscriptions.filter(
      (s) => s.status === "completed",
    ).length;
    const cancelled = subscriptions.filter(
      (s) => s.status === "cancelled",
    ).length;

    return [
      {
        label: "Total Contracts",
        value: total,
        icon: Repeat,
        iconClass: "bg-secondary/10 text-secondary",
      },
      {
        label: "Active",
        value: active,
        icon: CheckCircle2,
        iconClass: "bg-emerald-50 text-emerald-600",
      },
      {
        label: "Paused",
        value: paused,
        icon: PauseCircle,
        iconClass: "bg-amber-50 text-amber-600",
      },
      {
        label: "Completed",
        value: completed,
        icon: CheckCircle2,
        iconClass: "bg-purple-50 text-purple-600",
      },
      {
        label: "Cancelled",
        value: cancelled,
        icon: XCircle,
        iconClass: "bg-red-50 text-red-600",
      },
    ];
  }, [subscriptions]);

  /* ---------- company switching ---------- */
  const handleCompanySelect = useCallback(
    (slug: string, name: string) => {
      const membership = (user?.memberships ?? []).find(
        (m: { company_slug?: string; role?: string }) =>
          m.company_slug === slug,
      );

      const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");

      setSearch("");
      setSelectedStatus("all");
      setCurrentPage(1);

      switchCompany({ slug, name, role });
    },
    [isSuperAdmin, switchCompany, user?.memberships],
  );

  const handleManageClose = useCallback(() => {
    setManageModalOpen(false);
    setSelectedSubscription(null);
  }, []);

  const handleManageUpdated = useCallback(() => {
    void fetchSubscriptions();
    setManageModalOpen(false);
    setSelectedSubscription(null);
  }, [fetchSubscriptions]);

  /* ---------- early return states ---------- */
  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies}
        isLoading={isLoadingCompanies}
        title="Service Management"
        searchPlaceholder="Search service companies..."
        onSelect={handleCompanySelect}
        onBack={clearCompany}
      />
    );
  }

  if (!companySlug) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Repeat className="mb-4 h-12 w-12 text-gray-300" />
        <p>Select a service company to manage recurring contracts.</p>
      </div>
    );
  }

  if (selectedCompany && !isServiceCompany) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <Wrench className="mb-4 h-12 w-12 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-700">
          Not a Service Company
        </h3>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          {companyName} is a product vendor. Recurring contract management is
          only available for companies with business type “service”.
        </p>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={clearCompany}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
          >
            <Repeat className="h-4 w-4" />
            Choose another company
          </button>
        )}
      </div>
    );
  }

  const selectedStatusNoun =
    selectedStatus === "all"
      ? "all"
      : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1);

  return (
    <>
      <Toast toast={toast} />

      <div className="space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary/70">
                Service Management
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                  Recurring Contracts
                </h1>

                <span
                  title={companyName}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-secondary/15 bg-secondary/5 px-2.5 py-1 text-xs font-semibold text-secondary"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  <span className="max-w-[180px] truncate sm:max-w-[260px]">
                    {companyName}
                  </span>
                </span>
              </div>

              <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
                Manage ongoing subscriptions, recurring services, billing
                cycles, and contract status.
              </p>
            </div>

            <div className="flex w-full flex-row items-center gap-2 sm:w-auto">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={clearCompany}
                  aria-label="Switch company"
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-secondary/30 hover:bg-secondary/5 hover:text-secondary active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-secondary/20 sm:flex-none sm:gap-2 sm:px-3.5 sm:text-sm"
                >
                  <Repeat className="h-4 w-4 shrink-0" />
                  <span className=" truncate sm:inline">Switch Company</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void fetchSubscriptions()}
                disabled={loading}
                aria-label="Refresh subscriptions"
                title="Refresh subscriptions"
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-secondary/30 hover:bg-secondary/5 hover:text-secondary active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:gap-2 sm:px-3.5 sm:text-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 shrink-0 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                <span className="sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {kpiCards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              iconClass={card.iconClass}
            />
          ))}
        </div>

        {/* Main content card */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="border-b border-gray-100 bg-gray-50/50 p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                {STATUS_TABS.map((tab) => {
                  const isActive = selectedStatus === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSelectedStatus(tab.value)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-secondary/20 ${
                        isActive
                          ? "bg-secondary text-white shadow-sm shadow-secondary/20"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search contract, customer, service, staff..."
                    aria-label="Search subscriptions"
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* <button
                  type="button"
                  onClick={() => void fetchSubscriptions()}
                  disabled={loading}
                  aria-label="Refresh subscriptions"
                  title="Refresh subscriptions"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:border-secondary/30 hover:bg-secondary/5 hover:text-secondary active:scale-95 focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-3 sm:gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                  <span className="hidden text-xs font-semibold sm:inline">
                    Refresh
                  </span>
                </button> */}

                <div className="w-full sm:w-28">
                  <CustomSelect
                    value={String(pageSize)}
                    onChange={(value) => setPageSize(Number(value))}
                    options={PAGE_SIZE_OPTIONS}
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span>
                {totalItems} {totalItems === 1 ? "contract" : "contracts"}
              </span>
              {debouncedSearch.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="font-semibold text-secondary hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-3 sm:p-4 md:p-6">
            {loading ? (
              <>
                <SubscriptionTableSkeleton />
                <SubscriptionCardSkeleton />
              </>
            ) : error ? (
              <div className="py-16 text-center">
                <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
                <h3 className="text-lg font-semibold text-gray-700">
                  Unable to load recurring contracts
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void fetchSubscriptions()}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5B4592] focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              debouncedSearch.trim() ? (
                <div className="py-16 text-center">
                  <Search className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700">
                    No matching contracts
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try a different customer, service, staff member, or contract
                    number.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-4 text-sm font-semibold text-secondary hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              ) : selectedStatus === "all" ? (
                <div className="py-16 text-center">
                  <Repeat className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700">
                    No recurring contracts yet
                  </h3>
                  <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                    Recurring service agreements will appear here when customers
                    subscribe to ongoing services.
                  </p>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Repeat className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700">
                    No {selectedStatusNoun} contracts
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try selecting another status or view all contracts.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("all")}
                    className="mt-4 text-sm font-semibold text-secondary hover:underline"
                  >
                    View all contracts
                  </button>
                </div>
              )
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-500">
                        <th className="pb-3 pr-4">Contract</th>
                        <th className="pb-3 pr-4">Customer</th>
                        <th className="pb-3 pr-4">Service</th>
                        <th className="pb-3 pr-4">Billing</th>
                        <th className="pb-3 pr-4">Next Billing</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedSubscriptions.map((subscription) => (
                        <tr
                          key={subscription.id}
                          className="transition-colors hover:bg-purple-50/20"
                        >
                          <td className="py-4 pr-4">
                            <p className="font-bold text-gray-900">
                              #{subscription.id}
                            </p>
                            {subscription.created_at && (
                              <p className="mt-0.5 text-xs text-gray-400">
                                Created {formatDate(subscription.created_at)}
                              </p>
                            )}
                          </td>

                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary">
                                {getInitials(subscription.customer_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-900">
                                  {subscription.customer_name || "—"}
                                </p>
                                {subscription.customer_phone && (
                                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                    <Phone className="h-3 w-3" />
                                    {subscription.customer_phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 pr-4">
                            <div className="font-semibold text-gray-800">
                              {subscription.offering?.title ||
                                "Recurring Service"}
                            </div>
                            {subscription.assigned_staff?.name && (
                              <div className="mt-0.5 text-xs text-gray-500">
                                Staff: {subscription.assigned_staff.name}
                              </div>
                            )}
                          </td>

                          <td className="py-4 pr-4">
                            <div className="font-bold text-gray-900">
                              {formatAmount(subscription.cycle_amount)}{" "}
                              {subscription.currency}
                            </div>
                            <div className="mt-0.5 text-[11px] font-medium capitalize text-gray-500">
                              per {subscription.billing_cycle}
                            </div>
                          </td>

                          <td className="py-4 pr-4">
                            <BillingDateCell
                              date={subscription.next_billing_date}
                            />
                          </td>

                          <td className="py-4 pr-4">
                            <SubscriptionStatusBadge
                              status={subscription.status}
                            />
                          </td>

                          <td className="py-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setManageModalOpen(true);
                              }}
                              aria-label={`Manage contract #${subscription.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-secondary shadow-sm transition-all hover:bg-secondary hover:text-white focus:outline-none focus:ring-2 focus:ring-secondary/30"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 md:hidden">
                  {paginatedSubscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary">
                            {getInitials(subscription.customer_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">
                              {subscription.customer_name || "—"}
                            </p>
                            {subscription.customer_phone && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="h-3 w-3" />
                                {subscription.customer_phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <SubscriptionStatusBadge status={subscription.status} />
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Contract #{subscription.id}</span>
                      </div>

                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Service
                        </p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {subscription.offering?.title || "Recurring Service"}
                        </p>
                        {subscription.assigned_staff?.name && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            Staff: {subscription.assigned_staff.name}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-400">Billing</p>
                          <p className="mt-1 font-bold text-gray-900">
                            {formatAmount(subscription.cycle_amount)}{" "}
                            {subscription.currency}
                          </p>
                          <p className="mt-0.5 text-xs capitalize text-gray-500">
                            per {subscription.billing_cycle}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Next billing</p>
                          <div className="mt-1 text-sm">
                            <BillingDateCell
                              date={subscription.next_billing_date}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubscription(subscription);
                          setManageModalOpen(true);
                        }}
                        aria-label={`Manage contract #${subscription.id}`}
                        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5B4592] focus:outline-none focus:ring-2 focus:ring-secondary/30"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Manage Contract
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                      Showing{" "}
                      {Math.min((currentPage - 1) * pageSize + 1, totalItems)} –{" "}
                      {Math.min(currentPage * pageSize, totalItems)} of{" "}
                      {totalItems} contracts
                    </p>
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
        </div>
      </div>

      {/* Subscription manage modal */}
      {manageModalOpen && selectedSubscription && (
        <ServiceSubscriptionManageModal
          isOpen={manageModalOpen}
          subscription={selectedSubscription}
          companySlug={companySlug}
          onClose={handleManageClose}
          onUpdated={handleManageUpdated}
          onShowToast={showToast}
        />
      )}
    </>
  );
}
