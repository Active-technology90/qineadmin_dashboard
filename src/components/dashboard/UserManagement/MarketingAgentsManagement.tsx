import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Users,
  Building2,
  Award,
  Eye,
  Edit,
  X,
  Target,
  Mail,
  Phone,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Filter,
   User,
   ZoomIn,
     FileDown,
  AlertTriangle,
} from "lucide-react";
import AgentPersonalInfoModal from "./AgentPersonalInfoModal";
import { getAdminMarketingAgents, updateUser } from "../../../services/api";
import MarketingOverview from "../overview/MarketingOverview";
import { SearchInput } from "../../ui/SearchInput";
import { Pagination } from "../../ui/Pagination";
import { TableControls } from "../../ui/TableControls";
import { CustomSelect } from "../../ui/CustomSelect";
import BottomSheet from "../../ui/BottomSheet";
import FilterSortSheet from "../../ui/FilterSortSheet";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { FormModal } from "../../ui/FormModal";

interface MarketingAgent {
  id: number;
  username: string;
  email: string;
  phone_number: string | null;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  companies_count: number;
  daily_target: number;
  weekly_target: number;
  is_active: boolean;
}

// ============================================================
// Stat Card Component
// ============================================================
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  gradient,
  subtitle,
}) => (
  <div
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 sm:p-5 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-white/70 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-white mt-2">
          {value}
        </p>
        {subtitle && (
          <p className="text-[10px] text-white/60 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
        {icon}
      </div>
    </div>
  </div>
);

// ============================================================
// Skeleton Card (for loading) - matches real stat card exactly
// ============================================================
const SkeletonStatCard: React.FC = () => (
  <div className="bg-gray-200/60 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200/40 animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-3 w-20 bg-gray-300/70 rounded"></div>
        <div className="h-8 w-16 bg-gray-300/70 rounded mt-2"></div>
        <div className="h-3 w-24 bg-gray-300/70 rounded mt-1"></div>
      </div>
      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-300/70 rounded-2xl"></div>
    </div>
  </div>
);

// ============================================================
// Main Component
// ============================================================
export default function MarketingAgentsManagement() {
  const { toast, showToast } = useToast();
  const [agents, setAgents] = useState<MarketingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  // ... (keep all existing states)
  const [editingAgent, setEditingAgent] = useState<MarketingAgent | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MarketingAgent>>({});
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
const [personalModalAgent, setPersonalModalAgent] = useState<MarketingAgent | null>(null);
const [zoomImageAgent, setZoomImageAgent] = useState<MarketingAgent | null>(null);   
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter/Sort Sheet state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [tempSort, setTempSort] = useState("name|asc");
  const [tempCategory, setTempCategory] = useState("all");
  
  const sortOptions = [
    { label: "Name (A-Z)", value: "name|asc", icon: <Users className="h-4 w-4" /> },
    { label: "Name (Z-A)", value: "name|desc", icon: <Users className="h-4 w-4" /> },
    { label: "Most Companies", value: "companies_count|desc", icon: <Building2 className="h-4 w-4" /> },
    { label: "Least Companies", value: "companies_count|asc", icon: <Building2 className="h-4 w-4" /> },
    { label: "Highest Daily Target", value: "daily_target|desc", icon: <Target className="h-4 w-4" /> },
    { label: "Highest Weekly Target", value: "weekly_target|desc", icon: <Award className="h-4 w-4" /> },
  ];
  
  const categoryOptions = [
    { label: "All Agents", value: "all", icon: <Users className="h-4 w-4" /> },
    { label: "Active", value: "active", icon: <CheckCircle className="h-4 w-4" /> },
    { label: "Inactive", value: "inactive", icon: <X className="h-4 w-4" /> },
  ];
  
  const categoryNameMap: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAdminMarketingAgents();
      setAgents(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load marketing agents list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    let result = [...agents];
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.username.toLowerCase().includes(term) ||
          (a.first_name && a.first_name.toLowerCase().includes(term)) ||
          (a.last_name && a.last_name.toLowerCase().includes(term)) ||
          a.email.toLowerCase().includes(term) ||
          (a.phone_number && a.phone_number.includes(term))
      );
    }
    
    // Category filter (active/inactive)
    if (tempCategory === "active") {
      result = result.filter((a) => a.is_active === true);
    } else if (tempCategory === "inactive") {
      result = result.filter((a) => a.is_active === false);
    }
    
    // Sort
    const [field, order] = tempSort.split("|");
    result.sort((a, b) => {
      let valA: any = a[field as keyof MarketingAgent];
      let valB: any = b[field as keyof MarketingAgent];
      
      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (order === "asc") {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
    
    return result;
  }, [agents, searchTerm, tempCategory, tempSort]);
  
  // Paginated agents
  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredAgents.slice(start, end);
  }, [filteredAgents, currentPage, pageSize]);

  // Stats
  const stats = useMemo(() => {
    const totalAgents = agents.length;
    const totalCompanies = agents.reduce((sum, a) => sum + a.companies_count, 0);
    const activeAgents = agents.filter((a) => a.is_active).length;
    const avgDailyTarget = agents.length > 0 
      ? Math.round(agents.reduce((sum, a) => sum + a.daily_target, 0) / agents.length) 
      : 0;
    return { totalAgents, totalCompanies, activeAgents, avgDailyTarget };
  }, [agents]);

  const getInitials = (firstName: string, lastName: string, username: string): string => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (username) return username[0].toUpperCase();
    return "U";
  };

  const formatPhone = (phone: string | null): string => {
    if (!phone) return "—";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 12 && cleaned.startsWith("251")) {
      return `+251 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
    }
    return phone;
  };
  // ─── Performance Ranking ──────────────────────────────
  const getPerformanceRank = (agent: MarketingAgent) => {
    const weeklyProgress = agent.daily_target > 0
      ? Math.min(100, (agent.companies_count / (agent.daily_target * 7)) * 100)
      : 0;

    if (weeklyProgress >= 80) {
      return {
        label: "Top Performer",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <Award className="h-3 w-3" />,
      };
    }
    if (weeklyProgress >= 50) {
      return {
        label: "On Track",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: <TrendingUp className="h-3 w-3" />,
      };
    }
    if (weeklyProgress > 0) {
      return {
        label: "Needs Attention",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: <TrendingDown className="h-3 w-3" />,
      };
    }
    return {
      label: "No Progress",
      color: "bg-gray-100 text-gray-500 border-gray-200",
      icon: null,
    };
  };

  // ─── Edit Agent ─────────────────────────────────────────
  const openEditModal = (agent: MarketingAgent) => {
    setEditingAgent(agent);
    setEditFormData({
      first_name: agent.first_name || "",
      last_name: agent.last_name || "",
      email: agent.email,
      phone_number: agent.phone_number || "",
      daily_target: agent.daily_target,
      weekly_target: agent.weekly_target,
      is_active: agent.is_active,
    });
  };

  const handleEditSave = async () => {
    if (!editingAgent) return;
    try {
      await updateUser(editingAgent.id, {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        email: editFormData.email,
        phone_number: editFormData.phone_number,
        daily_target: editFormData.daily_target,
        weekly_target: editFormData.weekly_target,
        is_active: editFormData.is_active,
      });
      showToast("success", "Agent updated successfully");
      setEditingAgent(null);
      await fetchAgents(); // refresh
    } catch (err: any) {
      showToast("error", err.message || "Failed to update agent");
    }
  };

  // ─── Loading skeleton renderer ──────────────────────────────
  const renderSkeleton = () => (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans bg-gray-50/50 min-h-screen animate-pulse">
      {/* Title Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-gray-300/70 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-300/70 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 bg-gray-300/70 rounded-md"></div>
          <div className="h-8 w-24 bg-gray-300/70 rounded-full"></div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Table Controls Skeleton */}
      <div className="flex flex-col md:flex-row gap-3 w-full items-start md:items-center">
        <div className="w-full md:flex-1 h-10 bg-gray-300/70 rounded-xl"></div>
        <div className="hidden md:flex flex-col sm:flex-row items-center gap-2">
          <div className="w-48 h-10 bg-gray-300/70 rounded-xl"></div>
          <div className="w-40 h-10 bg-gray-300/70 rounded-xl"></div>
          <div className="w-10 h-10 bg-gray-300/70 rounded-xl"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 border-b border-gray-200/60">
                {["Agent", "Contact", "Targets", "Performance", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3.5 px-5">
                    <div className="h-4 w-16 bg-gray-300/70 rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-100/80">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-300/70"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-300/70 rounded mb-1"></div>
                        <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="space-y-1">
                      <div className="h-3 w-32 bg-gray-300/70 rounded"></div>
                      <div className="h-3 w-24 bg-gray-300/70 rounded"></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex gap-2">
                      <div className="h-5 w-12 bg-gray-300/70 rounded"></div>
                      <div className="h-5 w-12 bg-gray-300/70 rounded"></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="space-y-1">
                      <div className="h-4 w-20 bg-gray-300/70 rounded"></div>
                      <div className="h-2 w-24 bg-gray-300/70 rounded-full"></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="h-6 w-16 bg-gray-300/70 rounded-full"></div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="h-8 w-16 bg-gray-300/70 rounded-xl ml-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile skeleton */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-gray-300/70"></div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-300/70 rounded mb-1"></div>
                  <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
                </div>
                <div className="h-5 w-12 bg-gray-300/70 rounded-full"></div>
              </div>
              <div className="space-y-1">
                <div className="h-3 w-32 bg-gray-300/70 rounded"></div>
                <div className="h-3 w-24 bg-gray-300/70 rounded"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
                <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <div className="h-6 w-6 bg-gray-300/70 rounded-full"></div>
                <div className="h-6 w-6 bg-gray-300/70 rounded-full"></div>
                <div className="h-6 w-6 bg-gray-300/70 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <div className="h-6 w-24 bg-gray-300/70 rounded-full"></div>
          <div className="h-8 w-24 bg-gray-300/70 rounded-full"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-300/70 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-300/70 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-300/70 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-300/70 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-300/70 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-300/70 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return renderSkeleton();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans bg-gray-50/50 min-h-screen">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-secondary tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
            Marketing Agents
          </h1>
          <p className="text-xs sm:text-sm text-secondary-light/80 mt-1">
            Manage target quotas and audit onboardings for Elilita platform's marketing agents
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/*  Export button */}
          <button
            onClick={() => {
              const headers = ["Username", "Email", "Phone", "Companies", "Daily Target", "Weekly Target", "Status"];
              const rows = filteredAgents.map(a => [
                a.username,
                a.email,
                a.phone_number || "",
                a.companies_count,
                a.daily_target,
                a.weekly_target,
                a.is_active ? "Active" : "Inactive"
              ]);
              const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `agents_${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 border border-gray-200 rounded-md transition"
          >
            Export
          </button>
          <div className="bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm font-semibold">
            {agents.length} Agents
          </div>
        </div>
      </div>

      {/* Inactive agents alert banner */}
      {agents.filter(a => !a.is_active).length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <span className="text-amber-700">
            <span className="font-semibold">{agents.filter(a => !a.is_active).length}</span> inactive agents found.
            <button
              onClick={() => { setTempCategory("inactive"); setCurrentPage(1); }}
              className="ml-1 font-medium underline underline-offset-2 hover:text-amber-800 transition"
            >
              View inactive agents
            </button>
          </span>
          <button
            onClick={() => setTempCategory("all")}
            className="ml-auto text-amber-600 hover:text-amber-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Row - Light cards (no animation) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-purple-50/60 rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-100/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                Total Agents
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-700 mt-2">
                {stats.totalAgents}
              </p>
              <p className="text-[10px] text-purple-400 mt-1">Active marketers</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100/50 rounded-2xl flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50/60 rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-100/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                Companies Registered
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-700 mt-2">
                {stats.totalCompanies}
              </p>
              <p className="text-[10px] text-blue-400 mt-1">Total companies onboarded</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100/50 rounded-2xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/60 rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-100/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                Active Agents
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2">
                {stats.activeAgents}
              </p>
              <p className="text-[10px] text-emerald-400 mt-1">
                {stats.totalAgents > 0 ? `${Math.round((stats.activeAgents / stats.totalAgents) * 100)}% active` : '0% active'}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-100/50 rounded-2xl flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-amber-50/60 rounded-2xl p-4 sm:p-5 shadow-sm border border-amber-100/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                Avg Daily Target
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-2">
                {stats.avgDailyTarget}
              </p>
              <p className="text-[10px] text-amber-400 mt-1">Companies per day</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-100/50 rounded-2xl flex items-center justify-center">
              <Target className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Controls - Search, Filter, Sort (desktop) */}
      <TableControls
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      >
        <div className="flex flex-col md:flex-row gap-3 w-full items-start md:items-center">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by agent name, username, or email..."
          debounceMs={300}
          showClearButton={true}
          showMobileFilter={true}
          onMobileFilterClick={() => setFilterSheetOpen(true)}
          activeFilterCount={tempCategory !== "all" ? 1 : 0}
            className="w-full md:flex-1"
          />
          {/* Desktop-only sort & category dropdowns (hidden on mobile) */}
          <div className="hidden md:flex flex-col sm:flex-row items-center gap-2">
            <CustomSelect
              value={tempSort}
              onChange={(val) => {
                setTempSort(val);
                setCurrentPage(1);
              }}
              options={sortOptions}
              placeholder="Sort by..."
              className="w-full sm:w-48"
            />
            <CustomSelect
              value={tempCategory}
              onChange={(val) => {
                setTempCategory(val);
                setCurrentPage(1);
              }}
              options={categoryOptions}
              placeholder="Category..."
              className="w-full sm:w-40"
            />
            {/*  filters button (shows only when filters are active) */}
            {(tempCategory !== "all" || tempSort !== "name|asc" || searchTerm.trim() !== "") && (
              <button
                onClick={() => {
                  setTempCategory("all");
                  setTempSort("name|asc");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-200 hover:bg-red-300 transition text-red-600 shadow-sm flex-shrink-0"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </TableControls>

      {/* Error State */}
      {error ? (
        <div className="p-6 text-center max-w-md mx-auto bg-red-50 rounded-2xl border border-red-100 text-red-600 text-sm">
          {error}
          <button
            onClick={fetchAgents}
            className="block mx-auto mt-4 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl shadow-sm border border-gray-100 text-gray-400 text-sm font-semibold">
          No marketing agents found matching your query
        </div>
      ) : (
        /* ============================================================ */
        /* MODERN TABLE - Desktop & Mobile Responsive                    */
        /* ============================================================ */
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 border-b border-gray-200/60">
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Targets
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAgents.map((agent, index) => (
                  <tr
                    key={agent.id}
                    className={`
                      group transition-all duration-150
                      ${index !== paginatedAgents.length - 1 ? 'border-b border-gray-100/80' : ''}
                      hover:bg-gray-50/60
                    `}
                  >
                    {/* Agent Info */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
{agent.profile_image ? (
  <div className="relative flex-shrink-0">
                          <img
                            src={agent.profile_image}
                            alt={agent.username}
      className="h-10 w-10 rounded-full object-cover border-2 border-secondary/20 shadow-sm cursor-pointer hover:ring-2 hover:ring-secondary/40 transition-all duration-200"
      onClick={() => setZoomImageAgent(agent)}
    />
    <div
      className="absolute -bottom-1 -right-1 bg-secondary text-white rounded-full p-0.5 shadow-md cursor-pointer hover:scale-110 transition-transform"
      onClick={() => setZoomImageAgent(agent)}
    >
      <ZoomIn className="h-3 w-3" />
    </div>
  </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-secondary/10 flex-shrink-0">
                            {getInitials(agent.first_name, agent.last_name, agent.username)}
                          </div>
                        )}
<div className="flex-1">
  <div className="flex items-center gap-0 flex-wrap">
    <p className="font-semibold text-gray-900 text-sm leading-tight truncate max-w-[120px]">
      {agent.first_name && agent.last_name
        ? `${agent.first_name} ${agent.last_name}`
        : agent.username}
    </p>
    {/* Ranking Badge */}
    {(() => {
      const rank = getPerformanceRank(agent);
      return (
        <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${rank.color}`}>
          {rank.icon}
          {rank.label}
        </span>
      );
    })()}
    <button
      onClick={() => setPersonalModalAgent(agent)}
      className="p-1.5 rounded-full bg-secondary/5 border border-secondary/10 hover:bg-secondary/10 hover:ring-2 hover:ring-secondary/20 transition-all flex-shrink-0 group cursor-pointer"
      title="View Profile"
    >
      <User className="h-4 w-4 text-secondary group-hover:text-secondary-dark transition-colors" />
    </button>
  </div>
  <p className="text-xs text-gray-400 font-medium">@{agent.username}</p>
</div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {agent.email}
                        </p>
                        <p className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {formatPhone(agent.phone_number)}
                        </p>
                      </div>
                    </td>

                    {/* Targets */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Target className="h-4 w-4 text-secondary" />
                          <span className="text-sm font-semibold text-gray-700">
                            {agent.daily_target}
                          </span>
                          <span className="text-[10px] text-gray-400">/ day</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-semibold text-gray-700">
                            {agent.weekly_target}
                          </span>
                          <span className="text-[10px] text-gray-400">/ week</span>
                        </div>
                      </div>
                    </td>

                    {/* Performance */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-bold text-gray-800">
                              {agent.companies_count}
                            </span>
                            <span className="text-[10px] text-gray-400">companies</span>
                          </div>
                          <div className="h-6 w-px bg-gray-200" />
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-gray-600">
                              {agent.daily_target > 0
                                ? `${Math.round((agent.companies_count / (agent.daily_target * 7)) * 100)}%`
                                : '—'}
                            </span>
                            <span className="text-[10px] text-gray-400">of weekly</span>
                          </div>
                        </div>
                        {/*  Progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                agent.daily_target > 0
                                  ? (agent.companies_count / (agent.daily_target * 7)) >= 1
                                    ? "bg-emerald-500"
                                    : (agent.companies_count / (agent.daily_target * 7)) >= 0.5
                                    ? "bg-amber-500"
                                    : "bg-red-400"
                                  : "bg-gray-300"
                              }`}
                              style={{
                                width: `${Math.min(100, agent.daily_target > 0 ? (agent.companies_count / (agent.daily_target * 7)) * 100 : 0)}%`
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-gray-500 min-w-[32px] text-right">
                            {agent.daily_target > 0
                              ? `${Math.min(100, Math.round((agent.companies_count / (agent.daily_target * 7)) * 100))}%`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      <span className={`
                        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                        ${agent.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          : 'bg-gray-100 text-gray-500 border border-gray-200/50'
                        }
                      `}>
                        {agent.is_active ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(agent)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-600 hover:text-secondary shadow-sm active:scale-95"
                          title="Edit Agent"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAgentId(agent.id);
                            setSelectedAgentName(
                              agent.first_name && agent.last_name
                                ? `${agent.first_name} ${agent.last_name}`
                                : agent.username
                            );
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl hover:bg-[#5b4694] transition text-sm font-semibold shadow-sm hover:shadow-md active:scale-95"
                        >
                          <Eye className="h-4 w-4" />
                          Audit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards - 2 Column Grid */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {paginatedAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
{agent.profile_image ? (
  <div className="relative flex-shrink-0">
                    <img
                      src={agent.profile_image}
                      alt={agent.username}
      className="h-12 w-12 rounded-full object-cover border-2 border-secondary/20 shadow-sm cursor-pointer hover:ring-2 hover:ring-secondary/40 transition-all duration-200"
      onClick={() => setZoomImageAgent(agent)}
    />
    <div
      className="absolute -bottom-1 -right-1 bg-secondary text-white rounded-full p-0.5 shadow-md cursor-pointer hover:scale-110 transition-transform"
      onClick={() => setZoomImageAgent(agent)}
    >
      <ZoomIn className="h-3.5 w-3.5" />
    </div>
  </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-secondary/10 flex-shrink-0">
                      {getInitials(agent.first_name, agent.last_name, agent.username)}
                    </div>
                  )}
<div className="min-w-0 flex-1">
  <div className="flex items-center gap-0 flex-wrap">
    <p className="font-semibold text-gray-900 text-sm truncate max-w-[120px]">
      {agent.first_name && agent.last_name
        ? `${agent.first_name} ${agent.last_name}`
        : agent.username}
    </p>
    {/* Ranking Badge */}
    {(() => {
      const rank = getPerformanceRank(agent);
      return (
        <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-semibold border ${rank.color}`}>
          {rank.icon}
          {rank.label}
        </span>
      );
    })()}
    <button
      onClick={() => setPersonalModalAgent(agent)}
      className="p-1 rounded-full bg-secondary/5 border border-secondary/10 hover:bg-secondary/10 hover:ring-2 hover:ring-secondary/20 transition-all flex-shrink-0 group cursor-pointer"
      title="View Profile"
    >
      <User className="h-3.5 w-3.5 text-secondary group-hover:text-secondary-dark transition-colors" />
    </button>
  </div>
  <p className="text-xs text-gray-400 truncate">@{agent.username}</p>
</div>
                  <span className={`
                    shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold
                    ${agent.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                    }
                  `}>
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Contact */}
                <div className="space-y-0.5 text-xs">
                  <p className="text-gray-600 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {agent.email}
                  </p>
                  <p className="text-gray-600 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {formatPhone(agent.phone_number)}
                  </p>
                </div>

                {/* Targets & Performance */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-purple-50/50 p-2 rounded-xl border border-purple-100/50">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Daily Goal</p>
                    <p className="text-sm font-black text-secondary">{agent.daily_target} companies</p>
                  </div>
                  <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Weekly Goal</p>
                    <p className="text-sm font-black text-emerald-600">{agent.weekly_target} companies</p>
                  </div>
                </div>

                {/* Registered Companies */}
                <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> Registered:
                  </span>
                  <span className="font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {agent.companies_count} companies
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openEditModal(agent)}
                    className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-600 hover:text-secondary text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setSelectedAgentName(
                        agent.first_name && agent.last_name
                          ? `${agent.first_name} ${agent.last_name}`
                          : agent.username
                      );
                    }}
                    className="w-full bg-secondary text-white py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#5b4694] transition text-sm font-semibold shadow-sm"
                  >
                    <Eye className="h-4 w-4" />
                    Audit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination - Using Pagination component */}
      {filteredAgents.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredAgents.length / pageSize)}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          enableUrlSync={false}
        />
      )}


      {/* Audit Modal Overlay */}
      {selectedAgentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-white w-full max-w-6xl h-[90dvh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-secondary/30 px-6 py-4 flex items-center justify-between z-10 border-b border-secondary/20">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-secondary">
                  Auditing Agent: {selectedAgentName}
                </h2>
                <p className="text-secondary/60 text-xs mt-0.5">
                  Detailed registration activity and metrics for agent #{selectedAgentId}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedAgentId(null);
                  setSelectedAgentName("");
                }}
                className="p-1.5 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Audit Report content */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
              <MarketingOverview agentId={selectedAgentId} />
            </div>
          </div>
        </div>
      )}
      {/* Personal Info Modal - MOVED OUTSIDE the Audit modal */}
      {personalModalAgent && (
        <AgentPersonalInfoModal
          agent={personalModalAgent}
          onClose={() => setPersonalModalAgent(null)}
        />
      )}

      {/* Image Zoom Modal */}
      {zoomImageAgent && zoomImageAgent.profile_image && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setZoomImageAgent(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomImageAgent.profile_image}
              alt={zoomImageAgent.username}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/20"
            />
            <button
              onClick={() => setZoomImageAgent(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors shadow-lg"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm font-medium bg-black/30 py-2 px-4 mx-auto max-w-md rounded-full backdrop-blur-sm">
              {zoomImageAgent.first_name && zoomImageAgent.last_name
                ? `${zoomImageAgent.first_name} ${zoomImageAgent.last_name}`
                : zoomImageAgent.username}
              <span className="mx-2 text-white/40">•</span>
              @{zoomImageAgent.username}
            </div>
          </div>
        </div>
      )}

      {/* Filter & Sort Sheet - Using FilterSortSheet component */}
      <FilterSortSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        sortOptions={sortOptions}
        tempSort={tempSort}
        onTempSortChange={setTempSort}
        categoryOptions={categoryOptions}
        tempCategory={tempCategory}
        onTempCategoryChange={setTempCategory}
        categoryNameMap={categoryNameMap}
        onApply={() => {
          // The filteredAgents useMemo already uses tempSort and tempCategory
          // So we just close the sheet and reset to page 1
          setFilterSheetOpen(false);
          setCurrentPage(1);
        }}
        onClearAll={() => {
          setTempSort("name|asc");
          setTempCategory("all");
          setSearchTerm("");
          setFilterSheetOpen(false);
          setCurrentPage(1);
        }}
      />

      {/* Simple BottomSheet for additional mobile filters if needed */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter Agents"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Search by agent name, username, or email</p>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search agents..."
            debounceMs={300}
            showClearButton={true}
            className="w-full"
          />
          <button
            onClick={() => {
              setSearchTerm("");
              setSheetOpen(false);
              setCurrentPage(1);
            }}
            className="w-full py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
          >
            Reset Filters
          </button>
        </div>
      </BottomSheet>
            {/* Edit Agent Modal */}
      {editingAgent && (
        <FormModal
          isOpen={!!editingAgent}
          onClose={() => {
            setEditingAgent(null);
            setEditFormData({});
          }}
          title="Edit Marketing Agent"
          onSubmit={handleEditSave}
          submitting={false}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={editFormData.first_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={editFormData.last_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={editFormData.email || ""}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Phone
              </label>
              <input
                type="text"
                value={editFormData.phone_number || ""}
                onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Daily Target
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.daily_target || 0}
                onChange={(e) => setEditFormData({ ...editFormData, daily_target: Number(e.target.value) })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Weekly Target
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.weekly_target || 0}
                onChange={(e) => setEditFormData({ ...editFormData, weekly_target: Number(e.target.value) })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.is_active ?? true}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                  className="h-5 w-5 text-secondary focus:ring-secondary focus:ring-2 border-gray-300 rounded cursor-pointer transition-all"
                />
                <span className="text-sm font-semibold text-gray-700">Active Agent</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${editFormData.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {editFormData.is_active ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>
        </FormModal>
      )}

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  );
}