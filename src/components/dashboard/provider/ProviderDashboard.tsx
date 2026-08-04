// src/components/admin/dashboards/ProviderDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  DollarSign,
  Star,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { getProviderStats, fetchProviders } from "../../../mock/serviceApi";
import { CustomSelect } from "../../ui/CustomSelect";

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-secondary">{value}</p>
      </div>
      <div className={`rounded-2xl bg-gradient-to-br ${color} p-3 shadow-sm`}>
        {icon}
      </div>
    </div>
  </div>
);

export default function ProviderDashboard() {
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders().then(data => {
      setProviders(data);
      if (data.length > 0) setSelectedProviderId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedProviderId === null) return;
    setLoading(true);
    const data = getProviderStats(selectedProviderId);
    setStats(data);
    setLoading(false);
  }, [selectedProviderId]);

  if (loading) return <div>Loading provider dashboard...</div>;
  if (!stats) return <div>No data for selected provider</div>;

  const { totalBookings, totalRevenue, avgRating, retentionRate, servicePerformance } = stats;
  const maxRevenue = Math.max(...servicePerformance.map(s => s.revenue), 0);

  return (
    <div className="space-y-6">
      {/* Provider Selector */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <label className="text-sm font-medium text-gray-700">Provider:</label>
        <CustomSelect
          value={selectedProviderId?.toString() || ""}
          onChange={(val) => setSelectedProviderId(parseInt(val))}
          options={providers.map(p => ({ value: p.id.toString(), label: p.businessName }))}
          placeholder="Select a provider"
          className="w-64"
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={totalBookings}
          icon={<ShoppingBag className="h-5 w-5 text-white" />}
          color="from-orange-500 to-amber-600"
        />
        <StatCard
          label="Revenue"
          value={`$${totalRevenue.toFixed(0)}`}
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="from-purple-500 to-violet-600"
        />
        <StatCard
          label="Avg. Rating"
          value={avgRating.toFixed(1)}
          icon={<Star className="h-5 w-5 text-white" />}
          color="from-yellow-500 to-amber-600"
        />
        <StatCard
          label="Customer Retention"
          value={`${retentionRate.toFixed(0)}%`}
          icon={<Users className="h-5 w-5 text-white" />}
          color="from-emerald-500 to-teal-600"
        />
      </div>

      {/* Service Performance */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-secondary flex items-center gap-2">
          <BarChart3 size={20} /> Service Performance
        </h3>
        <div className="mt-4 space-y-3">
          {servicePerformance.length === 0 ? (
            <p className="text-gray-500">No services performed</p>
          ) : (
            servicePerformance.map(svc => (
              <div key={svc.name} className="flex items-center gap-2">
                <span className="w-24 text-sm font-medium text-gray-700 truncate">{svc.name}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full"
                    style={{ width: `${maxRevenue > 0 ? (svc.revenue / maxRevenue) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500">${svc.revenue.toFixed(0)} ({svc.bookings})</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}