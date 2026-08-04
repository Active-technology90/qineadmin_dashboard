// src/components/admin/service-management/AdvancedReports.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  ShoppingBag,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { fetchReportSummary, type ReportSummary } from "../../../mock/serviceApi";
import { Toast } from "../../ui/Toast";
import { useToast } from "../../../hooks/useToast";

// ---------- COLOR THEME ----------
const PRIMARY = "#6750A4";
const PRIMARY_LIGHT = "#EADDFF";
const CHART_COLORS = [PRIMARY, "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];

// ---------- COMPACT STAT CARD ----------
const StatCard = ({
  label,
  value,
  icon,
  change,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: { value: number; positive: boolean };
}) => {
  const changeColor =
    change?.positive === undefined
      ? "text-gray-400"
      : change.positive
      ? "text-emerald-500"
      : "text-rose-500";
  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm border border-gray-100 sm:p-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-gray-800 truncate sm:text-xl">
          {value}
        </p>
        {change && (
          <p className={`mt-0.5 flex items-center text-[11px] font-medium ${changeColor}`}>
            {change.positive ? (
              <TrendingUp className="mr-0.5 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-0.5 h-3 w-3" />
            )}
            {change.value}%
          </p>
        )}
      </div>
      <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6750A4]/10 text-[#6750A4]">
        {icon}
      </div>
    </div>
  );
};

// ---------- SKELETON CARD ----------
const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl bg-white p-3 shadow-sm border border-gray-100 sm:p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-gray-200" />
        <div className="h-6 w-20 rounded bg-gray-200" />
      </div>
      <div className="h-10 w-10 rounded-xl bg-gray-200" />
    </div>
  </div>
);

// ---------- DATE RANGE KEY ----------
type DateRange = "all" | "year" | "month" | "week";
const DATE_OPTIONS: { key: DateRange; label: string }[] = [
  { key: "all", label: "All" },
  { key: "year", label: "Year" },
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
];

// ---------- MAIN COMPONENT ----------
export default function AdvancedReports() {
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const { toast, showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const report = await fetchReportSummary();
      setData(report);
    } catch (e: any) {
      showToast("error", e.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownload = () => {
    showToast("success", "Report downloaded (mock)");
  };

  const filteredTrend = useMemo(() => {
    if (!data) return [];
    const trend = data.monthlyTrend;
    switch (dateRange) {
      case "week":
        return trend.slice(-1);
      case "month":
        return trend.slice(-2);
      case "year":
        return trend;
      default:
        return trend;
    }
  }, [data, dateRange]);

  // ---------- LOADING STATE ----------
  if (loading || !data) {
    return (
      <div className="space-y-5 px-1">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
          <div className="h-9 w-20 rounded-xl bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-72 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-72 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  return (
    <div className="space-y-5 px-1">
      <Toast toast={toast} />

      {/* ---------- HEADER ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">Advanced Reports</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Business performance at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Compact date range */}
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            {DATE_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDateRange(key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  dateRange === key
                    ? "bg-white text-[#6750A4] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6750A4] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5a3f8c] active:scale-95 transition"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ---------- KPI ROW ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={<DollarSign size={18} />}
          change={{ value: 12.5, positive: true }}
        />
        <StatCard
          label="Total Orders"
          value={data.totalOrders}
          icon={<ShoppingBag size={18} />}
          change={{ value: 8.3, positive: true }}
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(data.avgOrderValue)}
          icon={<TrendingUp size={18} />}
          change={{ value: 3.2, positive: true }}
        />
        <StatCard
          label="Top Category"
          value={data.topCategory}
          icon={<Package size={18} />}
        />
      </div>

      {/* ---------- CHARTS ROW 1 ---------- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Revenue & Orders Chart */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 sm:text-base">
            Revenue & Orders Over Time
          </h3>
          <div className="-ml-4 -mr-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={filteredTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke={PRIMARY}
                  fill="url(#revGrad)"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Bar
                  yAxisId="right"
                  dataKey="orders"
                  fill={PRIMARY}
                  radius={[4, 4, 0, 0]}
                  name="Orders"
                  opacity={0.7}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Services */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 sm:text-base">
            Top Performing Services
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-2 font-medium">Service</th>
                  <th className="pb-2 pr-2 text-right font-medium">Orders</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topServices.slice(0, 5).map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-[#6750A4]/5 transition-colors"
                  >
                    <td className="py-2.5 pr-2 font-medium text-gray-800">{s.title}</td>
                    <td className="py-2.5 pr-2 text-right text-gray-600">{s.orders}</td>
                    <td className="py-2.5 text-right font-medium text-gray-900">
                      {formatCurrency(s.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------- SECOND ROW: DONUT / COMPLIANCE / PROVIDER ---------- */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Category Breakdown (Donut) */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 sm:p-5">
          <h3 className="mb-2 text-sm font-semibold text-gray-700 sm:text-base">
            Revenue by Category
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={data.categoryBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="revenue"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.categoryBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance Overview */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 sm:text-base">
            Compliance Overview
          </h3>
          <div className="space-y-3">
            {[
              { label: "Verified", count: data.complianceSummary.verified, color: "text-emerald-500", bg: "bg-emerald-50", icon: CheckCircle },
              { label: "Pending", count: data.complianceSummary.pending, color: "text-amber-500", bg: "bg-amber-50", icon: Clock },
              { label: "Flagged", count: data.complianceSummary.flagged, color: "text-rose-500", bg: "bg-rose-50", icon: AlertTriangle },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-1.5 ${item.bg}`}>
                    <item.icon size={16} className={item.color} />
                  </div>
                  <span className="text-xs font-medium text-gray-600 sm:text-sm">
                    {item.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-800 sm:text-base">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Approval */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 sm:text-base">
            Provider Approval
          </h3>
          <div className="space-y-3">
            {[
              { label: "Pending", count: data.providerSummary.pending, color: "text-amber-500", bg: "bg-amber-50", icon: User },
              { label: "Approved", count: data.providerSummary.approved, color: "text-emerald-500", bg: "bg-emerald-50", icon: CheckCircle },
              { label: "Rejected", count: data.providerSummary.rejected, color: "text-rose-500", bg: "bg-rose-50", icon: AlertTriangle },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-1.5 ${item.bg}`}>
                    <item.icon size={16} className={item.color} />
                  </div>
                  <span className="text-xs font-medium text-gray-600 sm:text-sm">
                    {item.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-800 sm:text-base">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}