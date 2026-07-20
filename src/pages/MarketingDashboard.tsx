import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../context/NotificationsContext";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Edit, Trash2, FileText, FileSpreadsheet } from "lucide-react";
import {
  Building2,
  Calendar,
  Users,
  TrendingUp,
  Plus,
  Eye,
  Search,
  Filter,
  Download,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Package,  
  Activity,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Target,
  Zap,
  Award,
} from "lucide-react";

interface RegisteredCompany {
  id: number;
  name: string;
  name_am: string;
  slug: string;
  category: number;
  sub_category: number;
  business_type: string;
  address: string;
  description: string;
  registered_at: string;
  registered_by: string;
  marketer_name: string;
  status: "Active" | "Inactive" | "Pending";
  subscription_plan: string;
  subscription_status: "Active" | "Expired" | "Pending";
  plan_start_date: string;
  plan_end_date: string | null;
}

export default function MarketingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = useNotifications(); // ADDED
  const [companies, setCompanies] = useState<RegisteredCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<RegisteredCompany | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<string>("registered_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAnalytics, setShowAnalytics] = useState(true);
  const currentMarketer = "Marketer 1"; // Will come from auth later

// Redirect if not a marketer
useEffect(() => {
  const isMarketer = user?.role === "marketer" || localStorage.getItem("forceMarketerMode") === "true";
  if (user && !isMarketer) {
    navigate("/dashboard");
  }
}, [user, navigate]);
// Handle edit company
const handleEditCompany = (company: RegisteredCompany) => {
  // Navigate to edit page or open edit modal
  navigate(`/register-company?edit=${company.id}`);
};

// Handle delete company
const handleDeleteCompany = (id: number) => {
  if (window.confirm("Are you sure you want to delete this company?")) {
    const company = companies.find(c => c.id === id);
    const updated = companies.filter(c => c.id !== id);
    setCompanies(updated);
    
    // Update localStorage
    const allCompanies = JSON.parse(localStorage.getItem("registeredCompanies") || "[]");
    const filtered = allCompanies.filter((c: any) => c.id !== id);
    localStorage.setItem("registeredCompanies", JSON.stringify(filtered));
    
    // Add notification
    if (company) {
      // We'll use the existing notification system via refetch
      // The backend will handle the notification
      refetch();
    }
  }
};

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("registeredCompanies");
    if (saved) {
      const allCompanies = JSON.parse(saved);
      // Filter companies registered by this marketer
      const myCompanies = allCompanies.filter(
        (c: any) => c.registered_by === currentMarketer
      );
      setCompanies(myCompanies);
    } else {
      // Add mock data for marketers
      const mockData: RegisteredCompany[] = [
        {
          id: 1,
          name: "ABC Electronics",
          name_am: "ኤቢሲ ኤሌክትሮኒክስ",
          slug: "abc-electronics",
          category: 1,
          sub_category: 5,
          business_type: "brand",
          address: "Bole, Addis Ababa",
          description: "Leading electronics provider",
          registered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          registered_by: "Marketer 1",
          marketer_name: "Marketer 1",
          status: "Active",
          subscription_plan: "Professional",
          subscription_status: "Active",
          plan_start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
          plan_end_date: new Date(Date.now() + 86400000 * 335).toISOString(),
        },
        {
          id: 2,
          name: "ADMATIS Stationary",
          name_am: "አድማቲስ ስቴሽነሪ",
          slug: "admatis-stationary",
          category: 3,
          sub_category: 8,
          business_type: "store",
          address: "Megenagna, Addis Ababa",
          description: "Quality stationary products",
          registered_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          registered_by: "Marketer 1",
          marketer_name: "Marketer 1",
          status: "Active",
          subscription_plan: "Basic",
          subscription_status: "Active",
          plan_start_date: new Date(Date.now() - 86400000 * 20).toISOString(),
          plan_end_date: new Date(Date.now() + 86400000 * 345).toISOString(),
        },
        {
          id: 3,
          name: "Ethio Tech Solutions",
          name_am: "ኢትዮ ቴክ መፍትሄዎች",
          slug: "ethio-tech",
          category: 1,
          sub_category: 2,
          business_type: "service",
          address: "4 Kilo, Addis Ababa",
          description: "IT solutions provider",
          registered_at: new Date().toISOString(),
          registered_by: "Marketer 1",
          marketer_name: "Marketer 1",
          status: "Pending",
          subscription_plan: "Free",
          subscription_status: "Pending",
          plan_start_date: new Date().toISOString(),
          plan_end_date: null,
        },
      ];
      localStorage.setItem("registeredCompanies", JSON.stringify(mockData));
      setCompanies(mockData);
    }
  }, []);

  // Statistics with trends
  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.status === "Active").length;
    const pending = companies.filter((c) => c.status === "Pending").length;
    const inactive = companies.filter((c) => c.status === "Inactive").length;
    const today = companies.filter(
      (c) => new Date(c.registered_at).toDateString() === new Date().toDateString()
    ).length;
    const thisWeek = companies.filter((c) => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return new Date(c.registered_at) >= weekAgo;
    }).length;
    const lastWeek = companies.filter((c) => {
      const now = new Date();
      const weekAgo = new Date(now);
      const twoWeeksAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      twoWeeksAgo.setDate(now.getDate() - 14);
      return new Date(c.registered_at) >= twoWeeksAgo && new Date(c.registered_at) < weekAgo;
    }).length;
    
    const growthRate = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : thisWeek > 0 ? 100 : 0;
    
    return { total, active, pending, inactive, today, thisWeek, lastWeek, growthRate };
  }, [companies]);

  // Filter companies with sorting
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term) ||
          c.description?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((c) => c.status === filterStatus);
    }

    if (filterPlan !== "all") {
      result = result.filter((c) => c.subscription_plan === filterPlan);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortField as keyof RegisteredCompany];
      let bVal: any = b[sortField as keyof RegisteredCompany];
      
      if (sortField === "registered_at" || sortField === "plan_start_date" || sortField === "plan_end_date") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, searchTerm, filterStatus, filterPlan, sortField, sortOrder]);

  const toggleRow = (id: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getPlanColor = (plan: string) => {
    const map: Record<string, string> = {
      Free: "bg-gray-100 text-gray-700 border-gray-200",
      Basic: "bg-blue-50 text-blue-700 border-blue-200",
      Professional: "bg-purple-50 text-purple-700 border-purple-200",
      Premium: "bg-amber-50 text-amber-700 border-amber-200",
      Enterprise: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return map[plan] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, { bg: string; text: string; dot: string }> = {
      Active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
      Inactive: { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-400" },
      Pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
      Expired: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    };
    return map[status] || map.Inactive;
  };

  const getPlanIcon = (plan: string) => {
    const map: Record<string, React.ReactNode> = {
      Free: <Package className="w-4 h-4" />,
      Basic: <Package className="w-4 h-4" />,
      Professional: <TrendingUp className="w-4 h-4" />,
      Premium: <Award className="w-4 h-4" />,
      Enterprise: <Zap className="w-4 h-4" />,
    };
    return map[plan] || <Package className="w-4 h-4" />;
  };

  const uniquePlans = [...new Set(companies.map((c) => c.subscription_plan))];

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Companies Report', 14, 20);
    autoTable(doc, {
      head: [['#', 'Company', 'Type', 'Plan', 'Status', 'Date']],
      body: filteredCompanies.map((c, i) => [
        i + 1,
        c.name,
        c.business_type,
        c.subscription_plan,
        c.status,
        new Date(c.registered_at).toLocaleDateString()
      ]),
    });
    doc.save('companies_report.pdf');
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredCompanies.map(c => ({
      'Company': c.name,
      'Slug': c.slug,
      'Type': c.business_type,
      'Plan': c.subscription_plan,
      'Status': c.status,
      'Registered': new Date(c.registered_at).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Companies');
    XLSX.writeFile(wb, 'companies_report.xlsx');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/20" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary">
              Marketing Dashboard
            </h1>
            <p className="text-sm text-secondary/60">
              Monitor and manage your registered companies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/register-company")}
            className="bg-secondary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-secondary-dark transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Register New Company
          </button>
          <div className="relative inline-block">
            <button
              className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
              onMouseEnter={() => document.getElementById('export-dropdown')?.classList.remove('hidden')}
              onMouseLeave={() => {
                setTimeout(() => {
                  const dropdown = document.getElementById('export-dropdown');
                  if (dropdown && !dropdown.matches(':hover')) {
                    dropdown.classList.add('hidden');
                  }
                }, 100);
              }}
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <div 
              id="export-dropdown"
              className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 hidden z-10"
              onMouseEnter={() => document.getElementById('export-dropdown')?.classList.remove('hidden')}
              onMouseLeave={() => document.getElementById('export-dropdown')?.classList.add('hidden')}
            >
              <button
                onClick={exportToPDF}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Export as PDF
              </button>
              <button
                onClick={exportToExcel}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export as Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Enhanced with Growth Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total</span>
            <Building2 className="w-5 h-5 text-secondary/60 group-hover:text-secondary transition" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary/30"></span>
            All companies
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Active</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500/60 group-hover:text-emerald-500 transition" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Pending</span>
            <Clock className="w-5 h-5 text-amber-500/60 group-hover:text-amber-500 transition" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Awaiting approval
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Today</span>
            <Calendar className="w-5 h-5 text-blue-500/60 group-hover:text-blue-500 transition" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.today}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-blue-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Registered today
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">This Week</span>
            <TrendingUp className="w-5 h-5 text-purple-500/60 group-hover:text-purple-500 transition" />
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.thisWeek}</p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            {stats.growthRate > 0 ? (
              <span className="text-emerald-500 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +{Math.round(stats.growthRate)}%
              </span>
            ) : stats.growthRate < 0 ? (
              <span className="text-red-500 flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" /> {Math.round(stats.growthRate)}%
              </span>
            ) : (
              <span className="text-gray-400 flex items-center gap-0.5">
                <Minus className="w-3 h-3" /> 0%
              </span>
            )}
            <span className="text-gray-400">vs last week</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-2xl p-4 border border-secondary/10 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-secondary/60">Conversion</span>
            <Target className="w-5 h-5 text-secondary/60 group-hover:text-secondary transition" />
          </div>
          <p className="text-2xl font-bold text-secondary mt-1">
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-secondary/50">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary"></span>
            Active conversion rate
          </div>
        </div>
      </div>



      {/* Filters with Analytics Toggle */}
      <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search - with reduced width */}
          <div className="flex-1 min-w-[180px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white min-w-[110px]"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Plan Filter */}
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white min-w-[110px]"
          >
            <option value="all">All Plans</option>
            {uniquePlans.map((plan) => (
              <option key={plan} value={plan}>{plan}</option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {(searchTerm || filterStatus !== "all" || filterPlan !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterPlan("all");
              }}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition border border-red-200"
            >
              Clear
            </button>
          )}

          {/* Analytics Toggle Button */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              showAnalytics
                ? 'bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/15'
                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
            }`}
            title={showAnalytics ? 'Hide analytics charts' : 'Show analytics charts'}
          >
            <BarChart3 className={`w-4 h-4 transition-all duration-300 ${showAnalytics ? 'text-secondary' : 'text-gray-400'}`} />
            <span className="hidden sm:inline">{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
            <span className="sm:hidden">{showAnalytics ? '📊' : '📊'}</span>
            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-300 ${showAnalytics ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Analytics Charts - Collapsible (moved here) */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
        showAnalytics ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monthly Registrations Chart */}
          <div className="bg-gradient-to-br from-gray-50/50 to-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-0.5 rounded-full bg-gradient-to-b from-secondary to-secondary/40" />
                <h4 className="text-xs font-bold text-secondary">Monthly Registrations</h4>
              </div>
              <span className="text-[9px] text-gray-400 bg-white px-1.5 py-0.5 rounded-full border border-gray-100">
                Last 6 months
              </span>
            </div>
            <div className="h-40 flex items-end gap-1.5">
              {(() => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                const maxCount = Math.max(...months.map((_, i) => 
                  companies.filter(c => new Date(c.registered_at).getMonth() === i).length
                ), 1);
                return months.map((month, i) => {
                  const count = companies.filter(c => new Date(c.registered_at).getMonth() === i).length;
                  const height = (count / maxCount) * 100;
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-0.5 group/chart">
                      <div className="w-full bg-secondary/10 rounded-t-lg relative" style={{ height: `${Math.max(height, 4)}%` }}>
                        <div 
                          className="absolute bottom-0 w-full bg-gradient-to-t from-secondary to-secondary/60 rounded-t-lg transition-all duration-700 group-hover/chart:from-secondary group-hover/chart:to-secondary/80"
                          style={{ height: `${height}%` }}
                        />
                        {count > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover/chart:opacity-100 transition-opacity">
                            <span className="text-[9px] font-bold text-secondary bg-white px-1 py-0.5 rounded shadow-sm">{count}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-gray-400 font-medium">{month}</span>
                      <span className="text-[9px] font-bold text-gray-600">{count}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Status Distribution Chart */}
          <div className="bg-gradient-to-br from-gray-50/50 to-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-0.5 rounded-full bg-gradient-to-b from-secondary to-secondary/40" />
                <h4 className="text-xs font-bold text-secondary">Status Distribution</h4>
              </div>
              <span className="text-[9px] text-gray-400 bg-white px-1.5 py-0.5 rounded-full border border-gray-100">
                {companies.length} total
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Active', count: companies.filter(c => c.status === 'Active').length, color: 'bg-emerald-500' },
                { label: 'Pending', count: companies.filter(c => c.status === 'Pending').length, color: 'bg-amber-500' },
                { label: 'Inactive', count: companies.filter(c => c.status === 'Inactive').length, color: 'bg-gray-400' },
              ].map((item) => {
                const percentage = companies.length > 0 ? (item.count / companies.length) * 100 : 0;
                return (
                  <div key={item.label} className="space-y-0.5 group/status">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 font-medium">{item.label}</span>
                      <span className="font-bold text-gray-900">
                        {item.count} 
                        <span className="text-[9px] text-gray-400 font-normal ml-0.5">({Math.round(percentage)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 group-hover/status:opacity-80`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm shadow-sm">
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider w-12">#</th>
                <th 
                  className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-secondary/80 transition group"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Company
                    {sortField === "name" && (
                      sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">Slug</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">Type</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider">Plan</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th 
                  className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden xl:table-cell cursor-pointer hover:text-secondary/80 transition group"
                  onClick={() => handleSort("registered_at")}
                >
                  <div className="flex items-center gap-1">
                    Registered
                    {sortField === "registered_at" && (
                      sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Building2 className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No companies registered yet</p>
                      <p className="text-sm text-gray-400 mt-1">Click "Register New Company" to start</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company, index) => (
                  <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-500">{index + 1}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-gray-900">{company.name}</p>
                        {company.name_am && (
                          <p className="text-xs text-gray-500">{company.name_am}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="font-mono text-xs text-gray-500">{company.slug}</span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {company.business_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getPlanColor(company.subscription_plan)}`}>
                        {getPlanIcon(company.subscription_plan)}
                        {company.subscription_plan}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${company.status === "Active" ? "bg-emerald-500" : company.status === "Pending" ? "bg-amber-500" : "bg-red-500"}`}></span>
                        {company.status}
                      </span>
                    </td>
                    <td className="p-4 hidden xl:table-cell text-sm text-gray-500">
                      {new Date(company.registered_at).toLocaleDateString()}
                    </td>
<td className="p-4 text-right">
  <div className="flex items-center justify-end gap-2">
    <button
      onClick={() => {
        setSelectedCompany(company);
        setShowDetailModal(true);
      }}
      className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
      title="View Details"
    >
      <Eye className="w-4 h-4" />
    </button>
    <button
      onClick={() => handleEditCompany(company)}
      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      title="Edit Company"
    >
      <Edit className="w-4 h-4" />
    </button>
    <button
      onClick={() => handleDeleteCompany(company.id)}
      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="Delete Company"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-secondary/5 to-secondary/10 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-secondary">{selectedCompany.name}</h3>
                <p className="text-sm text-gray-500">{selectedCompany.slug}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase">Business Type</p>
                  <p className="text-sm font-bold text-gray-900 mt-1 capitalize">{selectedCompany.business_type}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedCompany.status)}`}>
                    {selectedCompany.status}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase">Subscription Plan</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${getPlanColor(selectedCompany.subscription_plan)}`}>
                    {getPlanIcon(selectedCompany.subscription_plan)}
                    {selectedCompany.subscription_plan}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase">Registered At</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {new Date(selectedCompany.registered_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">Address</p>
                <p className="text-sm text-gray-900 mt-1">{selectedCompany.address || "Not provided"}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
                <p className="text-sm text-gray-900 mt-1">{selectedCompany.description || "No description"}</p>
              </div>

              <div className="bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-xl p-4 border border-secondary/10">
                <p className="text-xs font-medium text-gray-500 uppercase">Subscription Details</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-gray-400">Start Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedCompany.plan_start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">End Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedCompany.plan_end_date
                        ? new Date(selectedCompany.plan_end_date).toLocaleDateString()
                        : "Lifetime"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-secondary text-white rounded-xl font-medium hover:bg-secondary-dark transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}