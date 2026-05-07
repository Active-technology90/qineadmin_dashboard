// src/components/admin/Overview.tsx
import { useState, useEffect, type ComponentType } from "react";
import {
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { getAdminAnalyticsOverview } from "../../services/api";
import type { AnalyticsOverviewResponse } from "../../types";
import { useReadOnly } from "./AdminDashboard";
import { useAuth } from "../../hooks/useAuth";

const EMPTY_ANALYTICS: AnalyticsOverviewResponse = {
  scope: "company",
  selected_company: null,
  available_companies: [],
  summary: {
    products: 0,
    users: 0,
    orders: 0,
    payments_total: 0,
    avg_order_value: 0,
    success_rate: 0,
    active_categories: 0,
  },
  revenue_series: [],
  order_status: [],
  top_products: [],
  product_sales_trend: [],
  recent_orders: [],
};

// const CHART_COLORS = ["#6750A4", "#9B7DD4", "#B794F4", "#D6BCFA", "#E9D8FD"];
const CHART_COLORS = [
  "#6366F1", // indigo
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#EC4899", // pink
];
type Period = "week" | "month" | "year";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const statusClass = (status: string) => {
  const s = status.toLowerCase();
  if (s === "completed" || s === "paid")
    return "bg-emerald-100 text-emerald-800";
  if (s === "pending") return "bg-amber-100 text-amber-800";
  if (s === "cancelled") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

const paymentStatusClass = (ps: string) => {
  const p = ps?.toLowerCase();
  if (p === "paid") return "bg-emerald-100 text-emerald-800";
  if (p === "checkout initiated") return "bg-gray-100 text-gray-700";
  if (p === "verifying receipt") return "bg-orange-100 text-orange-800";
  if (p === "cancelled") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-600";
};

// Get meaningful color for each order status
const getStatusColor = (statusName: string): string => {
  const s = statusName.toLowerCase();

  if (s.includes("paid") || s.includes("approved") || s.includes("success"))
    return "#10B981"; // green

  if (s.includes("cancell") || s.includes("reject") || s.includes("failed"))
    return "#EF4444"; // red

  if (s.includes("pending") || s.includes("waiting")) return "#F59E0B"; // amber

  if (s.includes("verify") || s.includes("review") || s.includes("check"))
    return "#F97316"; // orange

  if (s.includes("process") || s.includes("shipp") || s.includes("confirm"))
    return "#3B82F6"; // blue

  if (s.includes("out for delivery") || s.includes("on the way"))
    return "#8B5CF6"; // purple

  if (s.includes("delivered") || s.includes("completed")) return "#059669"; // emerald

  // Fallback: generate consistent color from name hash
  let hash = 0;
  for (let i = 0; i < statusName.length; i++) {
    hash = (hash << 5) - hash + statusName.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 55%)`;
};

// Skeleton components
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="w-11 h-11 rounded-xl bg-gray-200" />
      <div className="w-12 h-4 bg-gray-200 rounded" />
    </div>
    <div className="mt-3 h-3 w-20 bg-gray-200 rounded" />
    <div className="mt-2 h-7 w-28 bg-gray-200 rounded" />
  </div>
);

const SkeletonChart = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse ${height}`}
  >
    <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
    <div className="flex-1 bg-gray-100 rounded-xl" />
  </div>
);

const EmptyState = ({
  title,
  description,
  compact = false,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/70 ${compact ? "py-8 px-4" : "h-72 px-6"}`}
  >
    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3">
      <Package className="h-5 w-5 text-gray-400" />
    </div>
    <p className="text-sm font-semibold text-gray-700">{title}</p>
    <p className="text-xs text-gray-500 mt-1 max-w-md">{description}</p>
  </div>
);

type SummaryCardProps = {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  bgLight: string;
  textColor: string;
};

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  bgLight,
  textColor,
}: SummaryCardProps) => (
  <div className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
    <div className="flex items-start justify-between">
      <div
        className={`${bgLight} w-11 h-11 rounded-xl flex items-center justify-center transition-colors group-hover:bg-opacity-80`}
      >
        <Icon className={`h-6 w-6 ${textColor}`} />
      </div>
      {/* {trend !== undefined && (
        <span
          className={`flex items-center text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}
        >
          {trend >= 0 ? (
            <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
          )}
          {Math.abs(trend)}%
          {trendLabel && (
            <span className="ml-1 text-gray-400 font-normal">{trendLabel}</span>
          )}
        </span>
      )} */}
    </div>
    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3">
      {title}
    </h3>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

type DashboardTab = "products" | "masterOrders" | "companyOrders";

export default function Overview({
  onNavigate,
}: {
  onNavigate?: (tab: DashboardTab) => void;
}) {
  const readOnly = useReadOnly();
  const { user } = useAuth();
  const isSuperAdmin = !user?.memberships?.length;
  const [period, setPeriod] = useState<Period>("week");
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [analytics, setAnalytics] =
    useState<AnalyticsOverviewResponse>(EMPTY_ANALYTICS);

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getAdminAnalyticsOverview({
          period,
          company_slug: selectedCompanySlug || undefined,
        });
        if (!active) return;
        setAnalytics(data);
      } catch (err: unknown) {
        if (!active) return;
        const detail =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { detail?: string } } }).response
            ?.data?.detail === "string"
            ? (err as { response?: { data?: { detail?: string } } }).response!
                .data!.detail
            : "Failed to load analytics.";
        setError(detail);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAnalytics();
    return () => {
      active = false;
    };
  }, [period, selectedCompanySlug]);

  const currentData = analytics.revenue_series;
  const totalRevenue = currentData.reduce((s, d) => s + d.revenue, 0);
  const summaryData = {
    products: analytics.summary.products,
    users: analytics.summary.users,
    orders: analytics.summary.orders,
    payments: { total: analytics.summary.payments_total, change: 0 },
    avgOrderValue: analytics.summary.avg_order_value,
    conversionRate: analytics.summary.success_rate,
  };

  // Prepare order status data with dynamic colors
  const orderStatusData = analytics.order_status.map((item) => ({
    ...item,
    color: getStatusColor(item.name),
  }));

  const productSalesData = analytics.top_products.map((product, idx) => ({
    ...product,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));
  const productTrendData = analytics.product_sales_trend;
  const recentOrders = analytics.recent_orders;
  const topProductNames = productTrendData.length
    ? Object.keys(productTrendData[0]).filter((key) => key !== "month")
    : [];

  const scopeOptions = [
    { value: "", label: "All Companies" },
    ...analytics.available_companies.map((c) => ({
      value: c.slug,
      label: c.name,
    })),
  ];

  const hasRevenueData =
    currentData.length > 0 &&
    currentData.some((item) => item.revenue > 0 || item.prevRevenue > 0);
  const hasOrderStatusData =
    orderStatusData.length > 0 && orderStatusData.some((item) => item.value > 0);
  const hasProductTrendData =
    productTrendData.length > 0 &&
    topProductNames.length > 0 &&
    productTrendData.some((row) =>
      topProductNames.some((name) => Number(row[name] ?? 0) > 0),
    );
  const hasTopProductsData =
    productSalesData.length > 0 &&
    productSalesData.some((product) => product.sales > 0);
  const hasRecentOrdersData = recentOrders.length > 0;

  return (
    <div className="space-y-8">
      {/* Scope selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Scope:</span>
          <select
            value={selectedCompanySlug}
            onChange={(e) => setSelectedCompanySlug(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-[#6750A4] focus:border-transparent"
          >
            {scopeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {readOnly && (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
            View Only
          </span>
        )}
      </div>

      {!!error && (
        <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <SummaryCard
              title="Total Products"
              value={summaryData.products.toLocaleString()}
              icon={Package}
              bgLight="bg-blue-50"
              textColor="text-blue-600"
            />
            <SummaryCard
              title="Company Users"
              value={summaryData.users.toLocaleString()}
              icon={Users}
              bgLight="bg-emerald-50"
              textColor="text-emerald-600"
            />
            <SummaryCard
              title="Total Orders"
              value={summaryData.orders.toLocaleString()}
              icon={ShoppingBag}
              bgLight="bg-purple-50"
              textColor="text-purple-600"
            />
            <SummaryCard
              title="Total Payments"
              value={formatCurrency(summaryData.payments.total)}
              icon={DollarSign}
              bgLight="bg-amber-50"
              textColor="text-amber-600"
            />
          </>
        )}
      </div>
       {/* Quick Stats Row */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Activity className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Avg. Order Value
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(summaryData.avgOrderValue)}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Success Rate
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {summaryData.conversionRate}%
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <PieChartIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Active Categories
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {analytics.summary.active_categories}
                </p>
              </div>
            </div>
          </>
        )}
      </div> */}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {loading ? (
            <SkeletonChart height="h-[300px]" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Revenue
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(totalRevenue)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6750A4]" />
                      <span className="text-xs text-gray-500">Current</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-[#D6BCFA]" />
                      <span className="text-xs text-gray-500">Previous</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {(["week", "month", "year"] as Period[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p ? "bg-white shadow text-[#6750A4]" : "text-gray-500 hover:text-gray-700"}`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-[#6750A4]" />
                  </div>
                </div>
              </div>
              {hasRevenueData ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={currentData}
                      margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                      formatter={(value: number | string, name: string) => [
                          typeof value === "number"
                            ? formatCurrency(value)
                            : value,
                          name === "revenue" ? "Revenue" : "Prev. Revenue",
                        ]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar
                        dataKey="prevRevenue"
                        fill="#D6BCFA"
                        radius={[6, 6, 0, 0]}
                        barSize={28}
                        opacity={0.6}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#6750A4"
                        radius={[6, 6, 0, 0]}
                        barSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No revenue data yet"
                  description="Revenue insights will appear here once paid orders are placed."
                />
              )}
            </>
          )}
        </div>

        {/* Order Status Pie Chart with dynamic colors */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {loading ? (
            <SkeletonChart height="h-[300px]" />
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Orders by Status
              </h3>
              {hasOrderStatusData ? (
                <>
                  <div className="h-48 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {orderStatusData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                        formatter={(value: number | string) => [
                          `${value} orders`,
                        ]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {orderStatusData.map((s) => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="text-xs text-gray-600">
                          {s.name} ({s.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  compact
                  title="No order status data"
                  description="Status distribution will be shown after orders are placed."
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Product Trend & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {loading ? (
            <SkeletonChart height="h-[300px]" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Product Sales Trend
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Monthly comparison
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {topProductNames.map((name, idx) => (
                    <div key={name} className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      />
                      <span className="text-xs text-gray-600">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
              {hasProductTrendData ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={productTrendData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: number | string) => [
                          typeof value === "number"
                            ? formatCurrency(value)
                            : value,
                          "",
                        ]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      {topProductNames.map((name, idx) => (
                        <Line
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No product trend data"
                  description="Product sales trend will appear after products generate sales over time."
                />
              )}
            </>
          )}
        </div>
          {/* Top products */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {loading ? (
            <SkeletonChart height="h-[300px]" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Top Products
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigate?.("products")}
                  className="text-xs font-medium text-[#6750A4] hover:underline cursor-pointer"
                >
                  View all 
                </button>
              </div>
              {hasTopProductsData ? (
                <div className="space-y-4">
                  {productSalesData.map((product) => (
                    <div key={product.name} className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: product.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {product.name}
                          </p>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(product.sales)}
                          </span>
                        </div>
                        <div className="mt-1 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${productSalesData[0]?.sales ? (product.sales / productSalesData[0].sales) * 100 : 0}%`,
                              backgroundColor: product.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  compact
                  title="No top products yet"
                  description="Top products will be listed here once product sales are available."
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        {loading ? (
          <SkeletonChart height="h-[320px]" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Recent Orders
              </h3>
              <button
                type="button"
                onClick={() =>
                  onNavigate?.(isSuperAdmin ? "masterOrders" : "companyOrders")
                }
                className="text-xs font-medium text-[#6750A4] hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>
            {hasRecentOrdersData ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2.5 pr-3 text-xs font-medium text-gray-500 uppercase">
                        Order
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">
                        Customer
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">
                        Payment
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">
                        Companies
                      </th>
                      <th className="text-right py-2.5 pl-3 text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((order, idx) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-2.5 pr-3">
                          <span className="text-sm font-semibold text-indigo-600">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-gray-700">
                          {order.customer}
                        </td>
                        <td className="py-2.5 px-3 text-sm font-semibold text-gray-900">
                          {formatCurrency(order.amount)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusClass(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${paymentStatusClass(order.paymentStatus)}`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-gray-600">
                          {order.vendors}
                        </td>
                        <td className="py-2.5 pl-3 text-right text-sm text-gray-500">
                          {formatDate(order.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                compact
                title="No recent orders"
                description="New orders will appear here as soon as customers start placing them."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}