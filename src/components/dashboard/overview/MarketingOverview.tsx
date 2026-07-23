// src/components/dashboard/overview/MarketingOverview.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  CreditCard,
  Award,
  Activity,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { getMarketingPerformance } from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";

interface Agent {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_marketing: boolean;
  daily_target: number;
  weekly_target: number;
}

interface TargetProgress {
  registered_today: number;
  daily_target: number;
  daily_progress_percentage: number;
  registered_this_week: number;
  weekly_target: number;
  weekly_progress_percentage: number;
}

interface CompanyInfo {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  is_active: boolean;
  created_at: string;
  business_type: string;
}

interface SubscriptionInfo {
  id: number;
  company_name: string;
  company_slug: string;
  plan_name: string;
  price: number;
  start_date: string;
  is_active: boolean;
}

interface DailyHistory {
  date: string;
  companies_registered_count: number;
  companies: CompanyInfo[];
  subscriptions_started: SubscriptionInfo[];
}

interface PerformanceData {
  agent: Agent;
  target_progress: TargetProgress;
  total_companies_registered: number;
  active_subscriptions_count: number;
  registrations_by_plan: Record<string, number>;
  daily_performance: DailyHistory[];
}

export default function MarketingOverview({ agentId }: { agentId?: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<PerformanceData | null>(null);
  const { toast } = useToast();

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError("");
      
      let res;
      if (agentId) {
        // If agentId is provided, we are superadmin auditing a specific agent
        const { getAdminMarketingAgentPerformance } = await import("../../../services/api");
        res = await getAdminMarketingAgentPerformance(agentId);
      } else {
        // Otherwise, marketing agent viewing their own dashboard
        res = await getMarketingPerformance();
      }
      
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load performance metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [agentId]);

  // Transform daily history data for charting (limit to past 7 active days or show all)
  const chartData = useMemo(() => {
    if (!data?.daily_performance) return [];
    return [...data.daily_performance]
      .reverse() // chronological order
      .map((day) => ({
        date: day.date,
        Registrations: day.companies_registered_count,
        Subscriptions: day.subscriptions_started.length,
      }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-semibold text-gray-500">Loading performance data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center max-w-lg mx-auto mt-12 bg-red-50 rounded-2xl border border-red-100">
        <h3 className="text-red-800 font-bold text-lg mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600 text-sm">{error || "No data returned"}</p>
        <button
          onClick={fetchPerformance}
          className="mt-4 px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { agent, target_progress, total_companies_registered, active_subscriptions_count, registrations_by_plan, daily_performance } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans bg-gray-50/50 min-h-screen">
      <Toast toast={toast} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
            Performance & Targets Hub
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Tracking onboarding registrations and started subscriptions for{" "}
            <span className="font-bold text-secondary">{agent.first_name || agent.username}</span>
          </p>
        </div>
        
        {/* Sync Badge */}
        <div className="inline-flex self-start sm:self-center items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Live Metrics
          </span>
        </div>
      </div>

      {/* Targets Tracking Meters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Target Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden group hover:shadow-md transition duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Calendar className="w-24 h-24 text-secondary" />
          </div>
          
          {/* Gauge Widget */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="#F3F4F6" strokeWidth="8" fill="transparent" />
              <circle
                cx="56"
                cy="56"
                r="48"
                stroke="url(#dailyGrad)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - Math.min(100, target_progress.daily_progress_percentage) / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="dailyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#674FA3" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-gray-900">{target_progress.registered_today}</span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">of {target_progress.daily_target}</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-2.5 py-1 rounded-full">
              Today's Goal
            </span>
            <h3 className="text-lg font-bold text-gray-800 mt-2.5">Daily Company Onboardings</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
              You have registered <strong className="text-secondary">{target_progress.registered_today}</strong> companies today. 
            </p>
            <div className="mt-4 flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-extrabold text-secondary">{target_progress.daily_progress_percentage}%</span>
              <span className="text-xs text-gray-400 font-medium">completed</span>
              {target_progress.registered_today >= target_progress.daily_target && target_progress.daily_target > 0 && (
                <Award className="h-4 w-4 text-amber-500 animate-bounce" />
              )}
            </div>
          </div>
        </div>

        {/* Weekly Target Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden group hover:shadow-md transition duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Award className="w-24 h-24 text-emerald-600" />
          </div>
          
          {/* Gauge Widget */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="#F3F4F6" strokeWidth="8" fill="transparent" />
              <circle
                cx="56"
                cy="56"
                r="48"
                stroke="url(#weeklyGrad)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - Math.min(100, target_progress.weekly_progress_percentage) / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="weeklyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-gray-900">{target_progress.registered_this_week}</span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">of {target_progress.weekly_target}</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-2.5 py-1 rounded-full">
              Weekly Quota
            </span>
            <h3 className="text-lg font-bold text-gray-800 mt-2.5">Weekly Company Onboardings</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
              Onboarded <strong className="text-emerald-600">{target_progress.registered_this_week}</strong> companies since Monday.
            </p>
            <div className="mt-4 flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-extrabold text-emerald-600">{target_progress.weekly_progress_percentage}%</span>
              <span className="text-xs text-gray-400 font-medium">completed</span>
              {target_progress.registered_this_week >= target_progress.weekly_target && target_progress.weekly_target > 0 && (
                <ShieldCheck className="h-4 w-4 text-emerald-500 animate-bounce" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Counters (Overview Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Companies Registered</p>
            <h3 className="text-3xl font-black text-gray-900 mt-2">{total_companies_registered}</h3>
            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-2">
              All time registrations
            </span>
          </div>
          <div className="h-12 w-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Subscriptions</p>
            <h3 className="text-3xl font-black text-gray-900 mt-2">{active_subscriptions_count}</h3>
            <span className="text-[10px] font-bold text-green-600 flex items-center gap-1 mt-2">
              Currently generating revenue
            </span>
          </div>
          <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3 (Plan Breakdown overview) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition sm:col-span-2 lg:col-span-1">
          <div className="w-full">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Subscriptions Breakdown</p>
            <div className="mt-3 space-y-2 max-h-[64px] overflow-y-auto">
              {Object.keys(registrations_by_plan).length === 0 ? (
                <span className="text-xs text-gray-400 font-medium">No company subscriptions active</span>
              ) : (
                Object.entries(registrations_by_plan).map(([planName, count]) => (
                  <div key={planName} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-600">{planName}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full font-bold text-gray-700">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Registration & Subscription Trends</h3>
              <p className="text-xs text-gray-400 mt-0.5">Timeline overview of onboarding history</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> Registrations
              </span>
              <span className="flex items-center gap-1.5 text-green-600">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Subscriptions
              </span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#674FA3" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#674FA3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px" }}
                  labelStyle={{ fontWeight: "bold", color: "#374151" }}
                />
                <Area type="monotone" dataKey="Registrations" stroke="#674FA3" strokeWidth={3} fillOpacity={1} fill="url(#colorRegs)" />
                <Area type="monotone" dataKey="Subscriptions" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSubs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Daily Breakdown Grid */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Daily Historical Activity</h3>
          <p className="text-xs text-gray-400 mt-0.5">Chronological audit log of registrations and active subscription changes</p>
        </div>

        {daily_performance.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm font-semibold">
            No activity history found. Start registering companies to view logs!
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {daily_performance.map((day) => (
              <div
                key={day.date}
                className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition"
              >
                {/* Day Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200/60 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-gray-500" />
                    <span className="text-sm font-bold text-gray-800">{day.date}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-extrabold uppercase">
                    <span className="bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full">
                      {day.companies_registered_count} {day.companies_registered_count === 1 ? "Registration" : "Registrations"}
                    </span>
                    <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full border border-green-200">
                      {day.subscriptions_started.length} {day.subscriptions_started.length === 1 ? "Subscription" : "Subscriptions"} started
                    </span>
                  </div>
                </div>

                {/* Day Details */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Companies Onboarded list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Companies</h4>
                    {day.companies.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No companies registered on this day</p>
                    ) : (
                      <div className="space-y-1.5">
                        {day.companies.map((company) => (
                          <div key={company.id} className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2.5">
                              {company.logo ? (
                                <img src={company.logo} alt={company.name} className="w-7 h-7 rounded-full object-cover border border-gray-100" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center text-[10px] font-bold text-secondary">
                                  {company.name[0]}
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-gray-800">{company.name}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-semibold">{company.business_type}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${company.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"}`}>
                              {company.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subscriptions Started list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subscription Activities</h4>
                    {day.subscriptions_started.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No subscriptions started on this day</p>
                    ) : (
                      <div className="space-y-1.5">
                        {day.subscriptions_started.map((sub) => (
                          <div key={sub.id} className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                            <div>
                              <p className="text-xs font-bold text-gray-800">{sub.company_name}</p>
                              <p className="text-[10px] text-green-600 font-bold">Plan: {sub.plan_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-extrabold text-gray-900">{sub.price} ETB</p>
                              <p className="text-[9px] text-gray-400">Monthly Cycle</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
