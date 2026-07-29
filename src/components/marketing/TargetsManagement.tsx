import React, { useState, useEffect, useMemo } from "react";
import {
  Target,
  Calendar,
  Award,
  Building2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  FileDown,
  User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getMarketingPerformance } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../ui/Toast";

// ─── Copy of ColorfulProgressRing (from MarketingOverview) ───
interface ColorfulProgressRingProps {
  value: number;
  max: number;
  label: string;
  sublabel: string;
  color: string;
  icon: React.ReactNode;
  bgGradient?: string;
  ringBg?: string;
}

const ColorfulProgressRing: React.FC<ColorfulProgressRingProps> = ({
  value,
  max,
  label,
  sublabel,
  color,
  icon,
  bgGradient = "from-white/80 to-gray-50/80",
  ringBg = "#E5E7EB",
}) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (percentage / 100) * circumference;
  const isComplete = percentage >= 100;
  const activeColor = isComplete ? "#22C55E" : color;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${bgGradient} backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-500 group`}>
      <div className={`absolute -inset-1 bg-gradient-to-r ${activeColor}/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500`}></div>
      <div className="relative flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-36 h-36 shrink-0 group-hover:scale-105 transition-transform duration-500">
          <svg className="w-full h-full transform -rotate-90 group-hover:brightness-110 group-hover:saturate-150 transition-all duration-500">
            <circle cx="72" cy="72" r="54" stroke={ringBg} strokeWidth="10" fill="transparent" />
            <circle
              cx="72"
              cy="72"
              r="54"
              stroke={activeColor}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out group-hover:stroke-[12] group-hover:brightness-110 group-hover:saturate-150"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500">
            <span className="text-4xl font-black text-gray-800 group-hover:text-gray-900 transition-colors duration-500">{value}</span>
            <span className="text-[11px] font-semibold text-gray-400 group-hover:text-gray-500 transition-colors duration-500">/ {max}</span>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`} style={{ backgroundColor: activeColor }}></span>
            <span className={`relative inline-flex rounded-full h-4 w-4`} style={{ backgroundColor: activeColor }}></span>
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all duration-500 group-hover:scale-105" style={{ backgroundColor: `${activeColor}20`, color: activeColor }}>
              {label}
            </span>
            {percentage >= 100 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300/50">
                <CheckCircle2 className="h-3 w-3" /> Achieved!
              </span>
            )}
            {percentage >= 80 && percentage < 100 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300/50">
                <TrendingUp className="h-3 w-3" /> Almost there!
              </span>
            )}
            {percentage < 80 && percentage > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-300/50">
                <Clock className="h-3 w-3" /> In progress
              </span>
            )}
            {max === 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-500 bg-gray-100/80 px-2.5 py-1 rounded-full border border-gray-300/50">
                <AlertCircle className="h-3 w-3" /> No target set
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-500">{sublabel}</h3>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-500 group-hover:text-gray-600 transition-colors duration-500">Progress</span>
              <span className="text-sm font-bold transition-all duration-500 group-hover:scale-105" style={{ color: activeColor }}>{max > 0 ? Math.round(percentage) : 0}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner group-hover:shadow-md transition-shadow duration-500">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative group-hover:brightness-110 group-hover:saturate-150"
                style={{
                  width: `${max > 0 ? percentage : 0}%`,
                  background: `linear-gradient(90deg, ${activeColor}88, ${activeColor})`,
                  boxShadow: `0 0 20px ${activeColor}40`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5 group-hover:text-gray-600 transition-colors duration-500">
            {percentage >= 100 ? '🎉 Target achieved! Outstanding performance!' :
             percentage >= 80 ? '🔥 On fire! Keep pushing to the finish line!' :
             percentage >= 50 ? '💪 Making solid progress. Keep going!' :
             percentage > 0 ? '🚀 Getting started. Every step counts!' :
             '📋 No target set. Contact your admin to set goals.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Copy of VibrantGradientCard (from MarketingOverview) ───
interface VibrantGradientCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  subtitle?: string;
  trend?: number;
  progress?: number;
  progressLabel?: string;
  progressColor?: string;
  textColor?: string;
}

const VibrantGradientCard: React.FC<VibrantGradientCardProps> = ({
  title,
  value,
  icon,
  gradient,
  iconBg,
  subtitle,
  trend,
  progress,
  progressLabel,
  progressColor = "bg-gray-700",
  textColor = "text-white",
}) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${gradient} shadow-sm hover:shadow transition-all duration-500 hover:scale-[1.02] group`}>
    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
    <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full animate-pulse"></div>
    <div className="relative z-10">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-medium uppercase tracking-wider ${textColor === 'text-white' ? 'text-white/80 group-hover:text-secondary/80' : 'text-gray-500 group-hover:text-secondary/80'} transition-colors duration-300`}>{title}</span>
            {trend !== undefined && (
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                trend >= 0 ? 'bg-green-400/30 text-green-200 group-hover:bg-secondary/30 group-hover:text-secondary' : 'bg-red-400/30 text-red-200 group-hover:bg-secondary/30 group-hover:text-secondary'
              } transition-colors duration-300`}>
                {trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          <p className={`text-3xl font-black tracking-tight ${textColor} group-hover:text-secondary transition-colors duration-300`}>{value.toLocaleString()}</p>
          {subtitle && <p className={`text-[11px] mt-0.5 ${textColor === 'text-white' ? 'text-white/70 group-hover:text-secondary/70' : 'text-gray-400 group-hover:text-secondary/70'} transition-colors duration-300`}>{subtitle}</p>}
        </div>
        <div className={`h-12 w-12 rounded-2xl ${iconBg} backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform duration-300 border border-white/20 shadow-sm group-hover:border-secondary/50`}>
          <div className={`${textColor === 'text-white' ? 'text-white group-hover:text-secondary' : 'text-gray-700 group-hover:text-secondary'} transition-colors duration-300`}>{icon}</div>
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] ${textColor === 'text-white' ? 'text-white/80 group-hover:text-secondary/80' : 'text-gray-500 group-hover:text-secondary/80'} transition-colors duration-300`}>{progressLabel || 'Progress'}</span>
            <span className={`text-xs font-bold ${textColor} group-hover:text-secondary transition-colors duration-300`}>{Math.round(progress)}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden backdrop-blur-sm ${textColor === 'text-white' ? 'bg-white/20' : 'bg-gray-200/80'}`}>
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-1000 ease-out shadow-sm group-hover:bg-secondary`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────
// ─── Skeleton Components ──────────────────────────────────
const SkeletonProgressRing: React.FC = () => (
  <div className="relative overflow-hidden bg-gradient-to-br from-gray-200/60 to-gray-100/60 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50 animate-pulse">
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="relative w-36 h-36 shrink-0">
        <div className="w-full h-full rounded-full bg-gray-300/70"></div>
      </div>
      <div className="flex-1 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2 mb-2.5">
          <div className="h-4 w-16 bg-gray-300/70 rounded-full"></div>
        </div>
        <div className="h-6 w-32 bg-gray-300/70 rounded mb-2"></div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
            <div className="h-3 w-8 bg-gray-300/70 rounded"></div>
          </div>
          <div className="w-full h-2.5 bg-gray-300/70 rounded-full"></div>
        </div>
        <div className="h-3 w-40 bg-gray-300/70 rounded mt-3"></div>
      </div>
    </div>
  </div>
);

const SkeletonSummaryCard: React.FC = () => (
  <div className="relative overflow-hidden rounded-2xl p-6 bg-gray-200/60 shadow-sm animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="h-3 w-24 bg-gray-300/70 rounded mb-1"></div>
        <div className="h-8 w-16 bg-gray-300/70 rounded"></div>
        <div className="h-3 w-32 bg-gray-300/70 rounded mt-1"></div>
      </div>
      <div className="h-12 w-12 rounded-2xl bg-gray-300/70"></div>
    </div>
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
        <div className="h-3 w-8 bg-gray-300/70 rounded"></div>
      </div>
      <div className="w-full h-2 bg-gray-300/70 rounded-full"></div>
    </div>
  </div>
);

export default function TargetsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPerformance = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await getMarketingPerformance(); // for logged-in marketing agent
      setData(res.data);
      if (showRefresh) {
        toast.showToast("success", "Targets refreshed ✨");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load targets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  // Export CSV
  const handleExport = () => {
    if (!data) return;
    const { agent, target_progress, total_companies_registered } = data;
    const headers = ["Metric", "Value"];
    const rows = [
      ["Agent", `${agent.first_name || ''} ${agent.last_name || ''}`],
      ["Username", agent.username],
      ["Daily Target", target_progress.daily_target],
      ["Registered Today", target_progress.registered_today],
      ["Daily Progress", `${Math.round(target_progress.daily_progress_percentage)}%`],
      ["Weekly Target", target_progress.weekly_target],
      ["Registered This Week", target_progress.registered_this_week],
      ["Weekly Progress", `${Math.round(target_progress.weekly_progress_percentage)}%`],
      ["Total Companies", total_companies_registered],
    ];
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `targets_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.showToast("success", "Export successful");
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans bg-gray-50/50 min-h-screen animate-pulse">
        {/* ─── Header Skeleton ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-gray-300/70 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-300/70 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 bg-gray-300/70 rounded-xl"></div>
          </div>
        </div>

        {/* ─── Agent Summary Skeleton ────────────────────────── */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gray-300/70"></div>
            <div>
              <div className="h-4 w-12 bg-gray-300/70 rounded mb-1"></div>
              <div className="h-6 w-48 bg-gray-300/70 rounded"></div>
              <div className="h-3 w-24 bg-gray-300/70 rounded mt-1"></div>
            </div>
            <div className="ml-auto grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-3 w-16 bg-gray-300/70 rounded mx-auto"></div>
                <div className="h-6 w-12 bg-gray-300/70 rounded mt-1 mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-3 w-16 bg-gray-300/70 rounded mx-auto"></div>
                <div className="h-6 w-12 bg-gray-300/70 rounded mt-1 mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-3 w-16 bg-gray-300/70 rounded mx-auto"></div>
                <div className="h-6 w-12 bg-gray-300/70 rounded mt-1 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Progress Rings Skeleton ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonProgressRing key={i} />
          ))}
        </div>

        {/* ─── Summary Cards Skeleton ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonSummaryCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 rounded-2xl border border-red-100">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium">{error || "No data available"}</p>
        <button onClick={() => fetchPerformance()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm">Retry</button>
      </div>
    );
  }

  const { agent, target_progress, total_companies_registered } = data;

  // Monthly target = weekly * 4 (approx)
  const monthlyTarget = target_progress.weekly_target * 4;
  const monthlyProgress = monthlyTarget > 0 ? (total_companies_registered / monthlyTarget) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans bg-gray-50/50 min-h-screen">
      <Toast toast={toast} />

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-secondary tracking-tight flex items-center gap-2.5">
            <Target className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
            Targets & Goals
          </h1>
          <p className="text-xs sm:text-sm text-secondary-light/80 mt-1">
            Track your performance against daily, weekly, and monthly targets
          </p>
        </div>

      </div>

      {/* Agent Summary */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary to-purple-700 flex items-center justify-center shadow-sm shadow-secondary/30">
            <User className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Agent</p>
            <h2 className="text-xl font-bold text-gray-900">
              {agent.first_name || agent.username} {agent.last_name}
            </h2>
            <p className="text-xs text-gray-400">@{agent.username}</p>
          </div>
          <div className="ml-auto grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-400">Daily Target</p>
              <p className="text-lg font-bold text-secondary">{target_progress.daily_target}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Weekly Target</p>
              <p className="text-lg font-bold text-secondary">{target_progress.weekly_target}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Total Companies</p>
              <p className="text-lg font-bold text-emerald-600">{total_companies_registered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Rings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ColorfulProgressRing
          value={target_progress.registered_today}
          max={target_progress.daily_target}
          label="Daily Goal"
          sublabel="Today's Progress"
          color="#7C3AED"
          icon={<Target className="h-5 w-5" />}
          bgGradient="from-purple-100/80 via-indigo-50/80 to-white/80"
          ringBg="#E5E7EB"
        />
        <ColorfulProgressRing
          value={target_progress.registered_this_week}
          max={target_progress.weekly_target}
          label="Weekly Quota"
          sublabel="Weekly Progress"
          color="#8B5CF6"
          icon={<Calendar className="h-5 w-5" />}
          bgGradient="from-blue-100/80 via-indigo-50/80 to-white/80"
          ringBg="#E5E7EB"
        />
        <ColorfulProgressRing
          value={total_companies_registered}
          max={monthlyTarget}
          label="Monthly Target"
          sublabel="Monthly Progress"
          color="#EC4899"
          icon={<Award className="h-5 w-5" />}
          bgGradient="from-pink-100/80 via-rose-50/80 to-white/80"
          ringBg="#E5E7EB"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VibrantGradientCard
          title="Daily Achievement"
          value={Math.round(target_progress.daily_progress_percentage)}
          icon={<TrendingUp className="h-6 w-6" />}
          gradient="from-indigo-100 via-purple-100 to-pink-100"
          iconBg="bg-white/50"
          subtitle={`${target_progress.registered_today} / ${target_progress.daily_target}`}
          progress={target_progress.daily_progress_percentage}
          progressLabel="Progress"
          progressColor="bg-indigo-500"
          textColor="text-gray-800"
        />
        <VibrantGradientCard
          title="Weekly Achievement"
          value={Math.round(target_progress.weekly_progress_percentage)}
          icon={<Award className="h-6 w-6" />}
          gradient="from-blue-100 via-cyan-100 to-teal-100"
          iconBg="bg-white/50"
          subtitle={`${target_progress.registered_this_week} / ${target_progress.weekly_target}`}
          progress={target_progress.weekly_progress_percentage}
          progressLabel="Progress"
          progressColor="bg-blue-500"
          textColor="text-gray-800"
        />
        <VibrantGradientCard
          title="Total Companies"
          value={total_companies_registered}
          icon={<Building2 className="h-6 w-6" />}
          gradient="from-emerald-100 via-green-100 to-teal-100"
          iconBg="bg-white/50"
          subtitle="All time registrations"
          progress={monthlyTarget > 0 ? (total_companies_registered / monthlyTarget) * 100 : 0}
          progressLabel="Monthly progress"
          progressColor="bg-emerald-500"
          textColor="text-gray-800"
        />
      </div>
    </div>
  );
}