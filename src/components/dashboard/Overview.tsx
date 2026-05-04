// src/components/admin/Overview.tsx
import { useState } from "react";
import {
  Package,
  Users,
  ShoppingBag,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
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
} from "recharts";

// ---------- Dummy Data (replace with API calls later) ----------
const summaryData = {
  products: 1247,
  users: 342,
  orders: 856,
  payments: {
    total: 2847500,
    change: 12.5,
  },
};

const CHART_COLORS = ["#6750A4", "#9B7DD4", "#B794F4", "#D6BCFA", "#E9D8FD", "#F3E8FF"];

// Revenue data for different periods
const revenueWeek = [
  { label: "Mon", revenue: 420000 },
  { label: "Tue", revenue: 380000 },
  { label: "Wed", revenue: 510000 },
  { label: "Thu", revenue: 470000 },
  { label: "Fri", revenue: 620000 },
  { label: "Sat", revenue: 780000 },
  { label: "Sun", revenue: 710000 },
];

const revenueMonth = [
  { label: "Week 1", revenue: 1800000 },
  { label: "Week 2", revenue: 2150000 },
  { label: "Week 3", revenue: 1900000 },
  { label: "Week 4", revenue: 2450000 },
];

const revenueYear = [
  { label: "Jan", revenue: 4500000 },
  { label: "Feb", revenue: 3800000 },
  { label: "Mar", revenue: 5200000 },
  { label: "Apr", revenue: 6100000 },
  { label: "May", revenue: 5800000 },
  { label: "Jun", revenue: 7000000 },
  { label: "Jul", revenue: 7500000 },
  { label: "Aug", revenue: 6300000 },
  { label: "Sep", revenue: 6800000 },
  { label: "Oct", revenue: 7200000 },
  { label: "Nov", revenue: 8000000 },
  { label: "Dec", revenue: 9500000 },
];

const orderStatusData = [
  { name: "Completed", value: 512, color: "#10B981" },
  { name: "Pending", value: 204, color: "#F59E0B" },
  { name: "Cancelled", value: 98, color: "#EF4444" },
  { name: "Processing", value: 42, color: "#3B82F6" },
];

const categorySalesData = [
  { name: "Flour", sales: 845000 },
  { name: "Grain", sales: 632000 },
  { name: "Furniture", sales: 410000 },
  { name: "Garment", sales: 385000 },
  { name: "Cleaning", sales: 275000 },
];

const recentOrders = [
  { id: "#138", customer: "One", amount: 7700, status: "paid", date: "2026-04-30T15:18:31", vendors: 3 },
  { id: "#137", customer: "One", amount: 8545, status: "paid", date: "2026-04-27T22:48:40", vendors: 4 },
  { id: "#136", customer: "One", amount: 4435, status: "pending", date: "2026-04-27T21:45:45", vendors: 3 },
  { id: "#135", customer: "One", amount: 425, status: "pending", date: "2026-04-27T21:34:15", vendors: 1 },
  { id: "#134", customer: "One", amount: 330, status: "pending", date: "2026-04-25T16:15:06", vendors: 2 },
];

type Period = "week" | "month" | "year";

// ---------- Helper functions ----------
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

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  bgLight,
  textColor,
  trend,
}: {
  title: string;
  value: string;
  icon: any;
  bgLight: string;
  textColor: string;
  trend?: number;
}) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`${bgLight} w-11 h-11 rounded-xl flex items-center justify-center`}>
        <Icon className={`h-6 w-6 ${textColor}`} />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-1" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

export default function Overview() {
  const [period, setPeriod] = useState<Period>("week");

  const revenueDataMap: Record<Period, { label: string; revenue: number }[]> = {
    week: revenueWeek,
    month: revenueMonth,
    year: revenueYear,
  };

  const currentData = revenueDataMap[period];
  const totalRevenue = currentData.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Products" value={summaryData.products.toLocaleString()} icon={Package} bgLight="bg-blue-50" textColor="text-blue-600" />
        <SummaryCard title="Company Users" value={summaryData.users.toLocaleString()} icon={Users} bgLight="bg-emerald-50" textColor="text-emerald-600" />
        <SummaryCard title="Total Orders" value={summaryData.orders.toLocaleString()} icon={ShoppingBag} bgLight="bg-purple-50" textColor="text-purple-600" />
        <SummaryCard title="Total Payments" value={formatCurrency(summaryData.payments.total)} icon={DollarSign} bgLight="bg-amber-50" textColor="text-amber-600" trend={summaryData.payments.change} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Bar Chart with period selector */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">
                Revenue ({period === "week" ? "Last 7 days" : period === "month" ? "This Month" : "This Year"})
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Period Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(["week", "month", "year"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      period === p ? "bg-white shadow text-[#6750A4]" : "text-gray-500 hover:text-gray-700"
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="revenue" fill="#6750A4" radius={[6, 6, 0, 0]} barSize={period === "year" ? 16 : 32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Orders by Status</h3>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value} orders`, name]} contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {orderStatusData.map((status) => (
              <div key={status.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-xs text-gray-600">{status.name} ({status.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Sales & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Categories by Sales</h3>
          <div className="space-y-4">
            {categorySalesData.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium text-gray-700 truncate">{cat.name}</p>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(cat.sales)}</span>
                  </div>
                  <div className="mt-1 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(cat.sales / categorySalesData[0].sales) * 100}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Recent Orders</h3>
            <a href="/admin/orders" className="text-xs font-medium text-[#6750A4] hover:underline">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 pr-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500 uppercase">Vendors</th>
                  <th className="text-right py-2.5 pl-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 pr-3"><span className="text-sm font-semibold text-indigo-600">{order.id}</span></td>
                    <td className="py-2.5 px-3 text-sm text-gray-700">{order.customer}</td>
                    <td className="py-2.5 px-3 text-sm font-semibold text-gray-900">{formatCurrency(order.amount)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-gray-600">{order.vendors}</td>
                    <td className="py-2.5 pl-3 text-right text-sm text-gray-500">{formatDate(order.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}