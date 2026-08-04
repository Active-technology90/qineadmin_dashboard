// src/components/admin/service-management/ServiceDetailModal.tsx
import React, { useMemo, useEffect, useState } from "react";
import {
  X,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Activity,
  Edit,
  Trash2,
  Globe,
  Layers,
  TrendingUp,
  Hash,
  Briefcase,
  Plus,
  Minus,
  Building2,
  Tag,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import type { Service } from "../../../types";
import type { ServiceGroup } from "../../../mock/serviceApi";
import {
  fetchProviders,
  fetchServices,
  updateService,
  fetchServiceGroups,
  type ServiceProvider,
} from "../../../mock/serviceApi";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";

// ─── Theme ────────────────────────────────────────
const PRIMARY = "#6750A4";
const PRIMARY_LIGHT = "rgba(103, 80, 164, 0.08)";

// ─── Helpers ───────────────────────────────────────
const formatCurrency = (amount: string, currency: string = "ETB") =>
  `${currency} ${parseFloat(amount).toFixed(2)}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getInitials = (str: string) =>
  str
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ─── Mini KPI Card ────────────────────────────────
const MiniStat = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100">
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: PRIMARY_LIGHT, color: PRIMARY }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
    </div>
  </div>
);

// ─── Section Title ────────────────────────────────
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
    {children}
    <div className="h-px flex-1 bg-gray-200" />
  </h4>
);

// ─── Info Row ─────────────────────────────────────
const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-2 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800 text-right">{value}</span>
  </div>
);

// ─── Badge ────────────────────────────────────────
const Badge = ({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: "green" | "amber" | "red" | "gray" | "purple";
}) => {
  const colors: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        colors[color || "gray"]
      }`}
    >
      {children}
    </span>
  );
};

// ─── Main Component ────────────────────────────────
interface ServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  services: Service[];
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  readOnly?: boolean;
}

export default function ServiceDetailModal({
  isOpen,
  onClose,
  service,
  services,
  onEdit,
  onDelete,
  readOnly = false,
}: ServiceDetailModalProps) {
  const { toast, showToast } = useToast();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [groups, setGroups] = useState<ServiceGroup[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      const [p, s, g] = await Promise.all([
        fetchProviders(),
        fetchServices(),
        fetchServiceGroups(),
      ]);
      setProviders(p);
      setAllServices(s);
      setGroups(g);
    };
    load();
  }, [isOpen]);

  if (!isOpen || !service) return null;

  const children = useMemo(
    () => services.filter((s) => s.parent_id === service.id),
    [service.id, services]
  );

  const currentProvider = service.provider_id
    ? providers.find((p) => p.id === service.provider_id)
    : null;
  const currentGroup = service.group_id
    ? groups.find((g) => g.id === service.group_id)
    : null;

  const providerServices = currentProvider
    ? allServices.filter(
        (s) => s.provider_id === currentProvider.id && s.id !== service.id
      )
    : [];
  const unassignedServices = allServices.filter((s) => !s.provider_id);

  const handleUnassign = async (svc: Service) => {
    try {
      await updateService(svc.slug, { provider_id: null, provider_name: "" });
      showToast("success", `${svc.title} removed from provider`);
      const updated = await fetchServices();
      setAllServices(updated);
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const handleAssign = async (svc: Service) => {
    if (!currentProvider) return;
    try {
      await updateService(svc.slug, {
        provider_id: currentProvider.id,
        provider_name: currentProvider.businessName,
      });
      showToast("success", `Assigned to ${currentProvider.businessName}`);
      const updated = await fetchServices();
      setAllServices(updated);
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const hasLocation =
    service.address ||
    service.address_am ||
    service.latitude ||
    service.longitude;
  const hasIntakeForm =
    service.intake_form_schema && service.intake_form_schema.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl">
        <Toast toast={toast} />

        {/* ── Header ── */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 p-4 sm:p-5">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white text-lg font-bold"
              style={{ backgroundColor: PRIMARY }}
            >
              {service.icon ? (
                <img
                  src={service.icon}
                  alt=""
                  className="h-12 w-12 rounded-2xl object-cover"
                />
              ) : (
                getInitials(service.title)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 truncate sm:text-xl">
                  {service.title}
                </h2>
                {service.is_active ? (
                  <Badge color="green">
                    <CheckCircle size={12} className="mr-1" /> Active
                  </Badge>
                ) : (
                  <Badge color="red">
                    <AlertTriangle size={12} className="mr-1" /> Inactive
                  </Badge>
                )}
                {service.is_featured && (
                  <Badge color="amber">
                    <Star size={12} className="mr-1" /> Featured
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-gray-500">
                {service.service_category || "Uncategorized"} · /{service.slug}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {!readOnly && onEdit && (
              <button
                onClick={() => onEdit(service)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                title="Edit"
              >
                <Edit size={18} />
              </button>
            )}
            {!readOnly && onDelete && (
              <button
                onClick={() => onDelete(service)}
                className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-5 space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MiniStat
              label="Price"
              value={formatCurrency(service.price, service.currency)}
              icon={<DollarSign size={16} />}
            />
            <MiniStat
              label="Duration"
              value={`${service.duration_minutes || 0}m`}
              icon={<Clock size={16} />}
            />
            <MiniStat
              label="Booking"
              value={service.booking_mode || "—"}
              icon={<Calendar size={16} />}
            />
            <MiniStat
              label="Orders"
              value={service.orders_count ?? 0}
              icon={<Activity size={16} />}
            />
            <MiniStat
              label="Revenue"
              value={service.revenue ? `$${service.revenue}` : "—"}
              icon={<TrendingUp size={16} />}
            />
            <MiniStat
              label="Companies"
              value={service.company_count ?? 0}
              icon={<Building2 size={16} />}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Left column (details) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Overview */}
              <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <SectionTitle>
                  <FileText size={16} style={{ color: PRIMARY }} />
                  Overview
                </SectionTitle>
                <div className="divide-y divide-gray-50">
                  <InfoRow
                    label="Category"
                    value={service.service_category || "—"}
                  />
                  <InfoRow label="Item Code" value={service.item_code || "—"} />
                  <InfoRow label="Order" value={service.order ?? "—"} />
                  {currentProvider && (
                    <InfoRow
                      label="Provider"
                      value={currentProvider.businessName}
                    />
                  )}
                  {currentGroup && (
                    <InfoRow
                      label="Service Group"
                      value={currentGroup.name}
                    />
                  )}
                  <InfoRow
                    label="Pricing Type"
                    value={service.pricing_type || "fixed"}
                  />
                  <InfoRow
                    label="Payment Policy"
                    value={service.payment_policy || "—"}
                  />
                  {service.payment_policy === "deposit" && (
                    <InfoRow
                      label="Deposit %"
                      value={`${service.deposit_percentage || 0}%`}
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <SectionTitle>
                  <Globe size={16} style={{ color: PRIMARY }} />
                  Description
                </SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      English
                    </span>
                    <p className="mt-1 text-sm text-gray-700">
                      {service.description || (
                        <span className="text-gray-400 italic">Not provided</span>
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      Amharic
                    </span>
                    <p className="mt-1 text-sm text-gray-700">
                      {service.description_am || (
                        <span className="text-gray-400 italic">Not provided</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location (if any) */}
              {hasLocation && (
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <SectionTitle>
                    <MapPin size={16} style={{ color: PRIMARY }} />
                    Location
                  </SectionTitle>
                  <div className="space-y-3">
                    {service.address && (
                      <div className="flex gap-2">
                        <MapPin size={16} className="mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase">
                            Address
                          </p>
                          <p className="text-sm text-gray-800">
                            {service.address}
                          </p>
                        </div>
                      </div>
                    )}
                    {service.address_am && (
                      <div className="flex gap-2">
                        <MapPin size={16} className="mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase">
                            Address (Amharic)
                          </p>
                          <p className="text-sm text-gray-800">
                            {service.address_am}
                          </p>
                        </div>
                      </div>
                    )}
                    {(service.latitude || service.longitude) && (
                      <div className="flex items-center gap-4 text-sm pt-2 border-t">
                        <span className="text-gray-500">
                          Lat:{" "}
                          <span className="font-mono text-gray-800">
                            {service.latitude}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          Lon:{" "}
                          <span className="font-mono text-gray-800">
                            {service.longitude}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Intake Form */}
              {hasIntakeForm && (
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <SectionTitle>
                    <Layers size={16} style={{ color: PRIMARY }} />
                    Intake Form Fields
                  </SectionTitle>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {service.intake_form_schema!.map((field, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-gray-100 bg-gray-50/50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">
                            {field.label}
                          </span>
                          <div className="flex items-center gap-1">
                            <Badge color="gray">{field.type}</Badge>
                            {field.required && (
                              <Badge color="red">Required</Badge>
                            )}
                          </div>
                        </div>
                        {field.options && field.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {field.options.map((opt) => (
                              <span
                                key={opt}
                                className="inline-block rounded-full bg-white px-2 py-0.5 text-xs border border-gray-200 text-gray-600"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {service.recent_activity &&
                service.recent_activity.length > 0 && (
                  <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                    <SectionTitle>
                      <Activity size={16} style={{ color: PRIMARY }} />
                      Recent Activity
                    </SectionTitle>
                    <div className="relative space-y-4 pl-4 border-l-2 border-gray-200">
                      {service.recent_activity.map((act, idx) => (
                        <div key={idx} className="relative">
                          <div
                            className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white"
                            style={{ backgroundColor: PRIMARY }}
                          />
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-sm text-gray-700 font-medium">
                              {act.description}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              {formatDate(act.date)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Quick Status */}
              <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <SectionTitle>
                  <Info size={16} style={{ color: PRIMARY }} />
                  Quick Status
                </SectionTitle>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Featured</span>
                    {service.is_featured ? (
                      <Badge color="amber">Yes</Badge>
                    ) : (
                      <Badge color="gray">No</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Booking Mode</span>
                    <span className="font-medium text-gray-800">
                      {service.booking_mode || "—"}
                    </span>
                  </div>
                  {currentProvider && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Provider</span>
                      <span className="font-medium text-gray-800">
                        {currentProvider.businessName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Children Services */}
              {children.length > 0 && (
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <SectionTitle>
                    <Layers size={16} style={{ color: PRIMARY }} />
                    Sub‑Services ({children.length})
                  </SectionTitle>
                  <div className="space-y-2">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-2"
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {child.title}
                        </span>
                        <Badge color="gray">
                          {child.service_category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Provider Assignment */}
              {currentProvider && (
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <SectionTitle>
                    <Briefcase size={16} style={{ color: PRIMARY }} />
                    Provider Services
                  </SectionTitle>
                  {providerServices.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {providerServices.map((svc) => (
                        <div
                          key={svc.id}
                          className="flex items-center justify-between rounded-lg border border-gray-100 p-2 hover:bg-gray-50"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {svc.title}
                            </p>
                            <p className="text-xs text-gray-400">/{svc.slug}</p>
                          </div>
                          {!readOnly && (
                            <button
                              onClick={() => handleUnassign(svc)}
                              className="ml-2 rounded-md p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-500"
                              title="Remove"
                            >
                              <Minus size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No other services from this provider.
                    </p>
                  )}
                  {!readOnly && unassignedServices.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Assign another service
                      </label>
                      <select
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
                        defaultValue=""
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          const svc = unassignedServices.find(
                            (s) => s.id === id
                          );
                          if (svc) handleAssign(svc);
                        }}
                      >
                        <option value="" disabled>
                          Select service…
                        </option>
                        {unassignedServices.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Companies */}
              {service.company_ids && service.company_ids.length > 0 && (
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <SectionTitle>
                    <Building2 size={16} style={{ color: PRIMARY }} />
                    Companies
                  </SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {service.company_ids.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                      >
                        #{id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <SectionTitle>
                    <Tag size={16} style={{ color: PRIMARY }} />
                    Tags
                  </SectionTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {service.tags.map((tag) => (
                      <Badge key={tag} color="purple">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <SectionTitle>
                  <Hash size={16} style={{ color: PRIMARY }} />
                  Metadata
                </SectionTitle>
                <div className="divide-y divide-gray-50">
                  <InfoRow label="ID" value={`#${service.id}`} />
                  <InfoRow label="Created" value={formatDate(service.created_at)} />
                  <InfoRow label="Updated" value={formatDate(service.updated_at)} />
                  {service.recent_activity?.length > 0 && (
                    <InfoRow
                      label="Last Activity"
                      value={formatDate(
                        service.recent_activity[
                          service.recent_activity.length - 1
                        ].date
                      )}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 px-4 py-3 sm:px-5 flex justify-end shrink-0 bg-white">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}