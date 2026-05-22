// src/components/admin/overview/components/ChartsSection.tsx
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
import { TrendingUp, Building2 } from "lucide-react";
import { SkeletonChart, EmptyState } from "./LoadingStates";
import { formatCurrency, CHART_COLORS } from "./uiHelpers";
import type { DashboardTab } from "../../types"; // adjust path if needed

type Period = "week" | "month" | "year";

interface ChartsSectionProps {
  loading: boolean;
  period: Period;
  setPeriod: (p: Period) => void;
  totalRevenue: number;
  hasRevenueData: boolean;
  hasOrderStatusData: boolean;
  hasProductTrendData: boolean;
  hasTopProductsData: boolean;
  currentData: any[];
  orderStatusData: { name: string; value: number; color: string }[];
  productSalesData: { name: string; sales: number; company_name: string; color: string }[];
  productTrendData: any[];
  topProductNames: string[];
  onNavigate?: (tab: DashboardTab) => void;
}

export default function ChartsSection({
  loading,
  period,
  setPeriod,
  totalRevenue,
  hasRevenueData,
  hasOrderStatusData,
  hasProductTrendData,
  hasTopProductsData,
  currentData,
  orderStatusData,
  productSalesData,
  productTrendData,
  topProductNames,
  onNavigate,
}: ChartsSectionProps) {
  return (
    <>
      {/* =========== Revenue & Order Status Row =========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-4 lg:gap-5">
        {/* -------- Revenue Bar Chart (lg:col-span-2) -------- */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          {loading ? (
            <SkeletonChart height="h-64 sm:h-72 lg:h-80" />
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-700">
                    Revenue
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {formatCurrency(totalRevenue)}
                  </p>
                  {/* Legend */}
                  <div className="flex items-center gap-3 mt-2">
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
                {/* Period switcher + icon */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    {(["week", "month", "year"] as Period[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                          period === p
                            ? "bg-white shadow text-[#6750A4] ring-1 ring-gray-200/50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 bg-purple-50 rounded-xl hidden sm:block">
                    <TrendingUp className="h-5 w-5 text-[#6750A4]" />
                  </div>
                </div>
              </div>

              {/* Chart container */}
              {hasRevenueData ? (
                <div className="h-64 sm:h-72 lg:h-80">
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
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          typeof value === "number"
                            ? formatCurrency(value)
                            : String(value ?? ""),
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

        {/* -------- Order Status Donut Chart -------- */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          {loading ? (
            <SkeletonChart height="h-64 sm:h-72 lg:h-80" />
          ) : (
            <>
              <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-4">
                Orders by Status
              </h3>
              {hasOrderStatusData ? (
                <>
                  <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center">
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
                          formatter={(value) => [`${value ?? 0} orders`]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend – wraps nicely on all screens */}
                  <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
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

      {/* =========== Product Trend & Top Products =========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-4 lg:gap-5 mt-4 md:mt-6">
        {/* -------- Product Trend Line Chart (lg:col-span-2) -------- */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          {loading ? (
            <SkeletonChart height="h-64 sm:h-72 lg:h-80" />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-700">
                    Product Sales Trend
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Monthly comparison</p>
                </div>
                {/* Legend – wraps on small screens */}
                <div className="flex flex-wrap items-center gap-3 xs:gap-4">
                  {topProductNames.map((name, idx) => (
                    <div key={name} className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      />
                      <span className="text-xs text-gray-600">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
              {hasProductTrendData ? (
                <div className="h-64 sm:h-72 lg:h-80">
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
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value) => [
                          typeof value === "number"
                            ? formatCurrency(value)
                            : String(value ?? ""),
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

        {/* -------- Top Products -------- */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          {loading ? (
            <SkeletonChart height="h-64 sm:h-72 lg:h-80" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm sm:text-base font-semibold text-gray-700">
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
                <div className="space-y-4 overflow-y-auto pr-1">
                  {productSalesData.map((product) => (
                    <div
                      key={product.name}
                      className="group flex items-center gap-3 hover:bg-gray-50/50 p-2 -mx-2 rounded-xl transition-colors"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: product.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p
                            className="text-sm font-medium truncate pr-2"
                            style={{ color: product.color }}
                          >
                            {product.name}
                          </p>
                          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {formatCurrency(product.sales)}
                          </span>
                        </div>
                        {/* Company badge */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-white"
                            style={{ backgroundColor: product.color }}
                          >
                            <Building2 className="h-3 w-3" />
                            {product.company_name}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
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
    </>
  );
}