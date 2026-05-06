// src/components/admin/Overview.tsx
import { useState, useEffect } from "react";
import {
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
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
import { useAuth } from "../../hooks/useAuth";
import type { AnalyticsOverviewResponse } from "../../types";

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
  category_sales: [],
  category_trend: [],
  recent_orders: [],
};

const CHART_COLORS = ["#6750A4", "#9B7DD4", "#B794F4", "#D6BCFA", "#E9D8FD"];
const PIE_COLORS = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

type Period = "week" | "month" | "year";

// ---------- Helpers ----------
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

// ---------- Skeleton Presets ----------
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

// ---------- Summary Card Component ----------
const SummaryCard = ({
  title,
  value,
  icon: Icon,
  bgLight,
  textColor,
  trend,
  trendLabel,
}: {
  title: string;
  value: string;
  icon: any;
  bgLight: string;
  textColor: string;
  trend?: number;
  trendLabel?: string;
}) => (
  <div className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
    <div className="flex items-start justify-between">
      <div
        className={`${bgLight} w-11 h-11 rounded-xl flex items-center justify-center transition-colors group-hover:bg-opacity-80`}
      >
        <Icon className={`h-6 w-6 ${textColor}`} />
      </div>
      {trend !== undefined && (
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
      )}
    </div>
    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3">
      {title}
    </h3>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

// ---------- Main Overview Component ----------
export default function Overview() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [analytics, setAnalytics] = useState<AnalyticsOverviewResponse>(EMPTY_ANALYTICS);
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string>("");

  useEffect(() => {
    if (!selectedCompanySlug && user?.memberships?.length) {
      setSelectedCompanySlug(user.memberships[0].company_slug);
    }
  }, [user, selectedCompanySlug]);

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
        if (!selectedCompanySlug && data.selected_company?.slug) {
          setSelectedCompanySlug(data.selected_company.slug);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.response?.data?.detail || "Failed to load analytics.");
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
  const orderStatusData = analytics.order_status;
  const categorySalesData = analytics.category_sales.map((cat, idx) => ({
    ...cat,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));
  const categoryTrendData = analytics.category_trend;
  const recentOrders = analytics.recent_orders;
  const topCategoryNames = categoryTrendData.length
    ? Object.keys(categoryTrendData[0]).filter((key) => key !== "month")
    : [];

  // Orders disabled period selection effect on other charts (optional)

  return (
    <div className="space-y-8">
      {(analytics.available_companies.length > 1 || analytics.scope === "platform") && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-3">
          <div className="text-sm text-gray-600">
            Scope:{" "}
            <span className="font-semibold text-gray-900">
              {analytics.scope === "platform" && !analytics.selected_company
                ? "All Companies"
                : analytics.selected_company?.name || "Company"}
            </span>
          </div>
          <select
            value={selectedCompanySlug}
            onChange={(e) => setSelectedCompanySlug(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {analytics.scope === "platform" && <option value="">All Companies</option>}
            {analytics.available_companies.map((company) => (
              <option key={company.slug} value={company.slug}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
              trend={summaryData.payments.change}
              trendLabel="vs last period"
            />
          </>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

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
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          period === p
                            ? "bg-white shadow text-[#6750A4]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
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
                      formatter={(value: any, name: any) => [
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
            </>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {loading ? (
            <SkeletonChart height="h-[300px]" />
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Orders by Status
              </h3>
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
                      {orderStatusData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
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
                {orderStatusData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i] }}
                    />
                    <span className="text-xs text-gray-600">
                      {s.name} ({s.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category Trend & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {loading ? (
            <SkeletonChart height="h-[300px]" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Category Sales Trend
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Monthly comparison
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {topCategoryNames.map((name, idx) => (
                    <div key={name} className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="text-xs text-gray-600">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={categoryTrendData}
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
                      formatter={(value: any) => [
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
                    {topCategoryNames.map((name, idx) => (
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
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {loading ? (
            <SkeletonChart height="h-[300px]" />
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Top Categories
              </h3>
              <div className="space-y-4">
                {categorySalesData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {cat.name}
                        </p>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(cat.sales)}
                        </span>
                      </div>
                      <div className="mt-1 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${categorySalesData[0]?.sales ? (cat.sales / categorySalesData[0].sales) * 100 : 0}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        {loading ? (
          <SkeletonChart height="h-[320px]" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Recent Orders
              </h3>
              <p className="text-xs font-medium text-[#6750A4] hover:underline">
                View all →
              </p>
            </div>
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
                      Vendors
                    </th>
                    <th className="text-right py-2.5 pl-3 text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="text-right py-2.5 pl-3 text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <span className="text-sm font-semibold text-indigo-600">
                          {order.id}
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
                      <td className="py-2.5 pl-3 text-right">
                        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
