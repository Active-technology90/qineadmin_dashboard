// src/components/admin/dashboards/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  Users,
  ShoppingBag,
  DollarSign,
  Star,
  BarChart3,
  Package,
  ShieldCheck,
  Tag,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { getAdminStats } from "../../../mock/serviceApi";

interface AdminStats {
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
  categoryPerformance: { name: string; revenue: number; bookings: number }[];
  avgRating: number;
}

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

const StatCard = ({
  label,
  value,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; positive: boolean };
}) => {
  const trendColor = trend
    ? trend.positive
      ? "text-emerald-600"
      : "text-rose-600"
    : "text-gray-400";

  return (
    <div className="group rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-secondary">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trendColor}`}>
              {trend.positive ? (
                <TrendingUp className="inline h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="inline h-3 w-3 mr-1" />
              )}
              {trend.value}% from last month
            </p>
          )}
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${color} p-3 shadow-sm group-hover:shadow-md transition`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const CategoryBar = ({
  name,
  revenue,
  bookings,
  maxRevenue,
}: {
  name: string;
  revenue: number;
  bookings: number;
  maxRevenue: number;
}) => {
  const width = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm font-medium text-gray-700 truncate">{name}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-secondary to-secondary/70 rounded-full transition-all duration-700"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[80px] justify-end">
        <span>${revenue.toFixed(0)}</span>
        <span className="text-xs text-gray-400">({bookings})</span>
      </div>
    </div>
  );
};

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const data = getAdminStats();
    setStats(data);
    setLoading(false);
    setLastUpdated(new Date().toLocaleString());
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="mt-2 h-8 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { totalProviders, totalBookings, totalRevenue, categoryPerformance, avgRating } = stats!;
  const maxRevenue = Math.max(...categoryPerformance.map((c) => c.revenue), 0);

  // Dummy trends for demo
  const getTrend = (value: number) => ({
    value: Math.round((Math.random() * 10 - 2) * 10) / 10,
    positive: Math.random() > 0.4,
  });

  const quickLinks = [
    { label: "Provider Approval", icon: ShieldCheck, tab: "provider-approval" },
    { label: "Categories", icon: Package, tab: "categories" },
    { label: "Pricing Policy", icon: DollarSign, tab: "pricing" },
    { label: "Promotions", icon: Tag, tab: "promotions" },
    { label: "Advanced Reports", icon: FileText, tab: "reports", colSpan: true },
  ];

  return (
    <div className="space-y-6">
      {/* Last updated */}
      <div className="flex items-center justify-end text-xs text-gray-400 gap-1">
        <Clock size={14} />
        <span>Updated: {lastUpdated}</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Providers"
          value={totalProviders}
          icon={<Users className="h-5 w-5 text-white" />}
          color="from-blue-500 to-indigo-600"
          trend={getTrend(totalProviders)}
        />
        <StatCard
          label="Total Bookings"
          value={totalBookings}
          icon={<ShoppingBag className="h-5 w-5 text-white" />}
          color="from-orange-500 to-amber-600"
          trend={getTrend(totalBookings)}
        />
        <StatCard
          label="Revenue"
          value={`$${totalRevenue.toFixed(0)}`}
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="from-purple-500 to-violet-600"
          trend={getTrend(totalRevenue)}
        />
        <StatCard
          label="Avg. Rating"
          value={avgRating.toFixed(1)}
          icon={<Star className="h-5 w-5 text-white" />}
          color="from-yellow-500 to-amber-600"
          trend={getTrend(avgRating)}
        />
      </div>

      {/* Two‑column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary flex items-center gap-2">
              <BarChart3 size={20} className="text-secondary" />
              Category Performance
            </h3>
            <span className="text-xs text-gray-400">Revenue & bookings</span>
          </div>
          <div className="mt-5 space-y-4">
            {categoryPerformance.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No category data yet</p>
            ) : (
              categoryPerformance.map((cat) => (
                <CategoryBar
                  key={cat.name}
                  name={cat.name}
                  revenue={cat.revenue}
                  bookings={cat.bookings}
                  maxRevenue={maxRevenue}
                />
              ))
            )}
          </div>
        </div>

        {/* Quick Management */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition hover:shadow-md">
          <h3 className="text-lg font-semibold text-secondary flex items-center gap-2">
            <Package size={20} className="text-secondary" />
            Quick Management
          </h3>
          <p className="text-sm text-gray-500 mt-1">Jump to key administration sections</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {quickLinks.map((item) => (
              <button
                key={item.tab}
                onClick={() => onNavigate(item.tab)}
                className={`flex items-center gap-2 rounded-xl border border-gray-200 p-3 hover:bg-gray-50 hover:border-secondary/30 transition-all active:scale-95 ${
                  item.colSpan ? "col-span-2" : ""
                }`}
              >
                <item.icon className="h-5 w-5 text-secondary/70 group-hover:text-secondary" />
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}