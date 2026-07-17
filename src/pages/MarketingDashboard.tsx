// src/pages/MarketingDashboard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Edit, Trash2 } from "lucide-react";
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
  const [companies, setCompanies] = useState<RegisteredCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<RegisteredCompany | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
    const updated = companies.filter(c => c.id !== id);
    setCompanies(updated);
    
    // Update localStorage
    const allCompanies = JSON.parse(localStorage.getItem("registeredCompanies") || "[]");
    const filtered = allCompanies.filter((c: any) => c.id !== id);
    localStorage.setItem("registeredCompanies", JSON.stringify(filtered));
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

  // Statistics
  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.status === "Active").length;
    const pending = companies.filter((c) => c.status === "Pending").length;
    const today = companies.filter(
      (c) => new Date(c.registered_at).toDateString() === new Date().toDateString()
    ).length;
    const thisWeek = companies.filter((c) => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return new Date(c.registered_at) >= weekAgo;
    }).length;
    return { total, active, pending, today, thisWeek };
  }, [companies]);

  // Filter companies
  const filteredCompanies = useMemo(() => {
    let result = companies;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((c) => c.status === filterStatus);
    }

    if (filterPlan !== "all") {
      result = result.filter((c) => c.subscription_plan === filterPlan);
    }

    return result;
  }, [companies, searchTerm, filterStatus, filterPlan]);

  const getPlanColor = (plan: string) => {
    const map: Record<string, string> = {
      Free: "bg-gray-100 text-gray-700",
      Basic: "bg-blue-100 text-blue-700",
      Professional: "bg-purple-100 text-purple-700",
      Premium: "bg-amber-100 text-amber-700",
      Enterprise: "bg-rose-100 text-rose-700",
    };
    return map[plan] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      Active: "bg-emerald-100 text-emerald-700",
      Inactive: "bg-gray-100 text-gray-500",
      Pending: "bg-amber-100 text-amber-700",
      Expired: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-500";
  };

  const getPlanIcon = (plan: string) => {
    const map: Record<string, React.ReactNode> = {
      Free: <Package className="w-4 h-4" />,
      Basic: <Package className="w-4 h-4" />,
      Professional: <TrendingUp className="w-4 h-4" />,
      Premium: <Activity className="w-4 h-4" />,
      Enterprise: <BarChart3 className="w-4 h-4" />,
    };
    return map[plan] || <Package className="w-4 h-4" />;
  };

  const uniquePlans = [...new Set(companies.map((c) => c.subscription_plan))];

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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total</span>
            <Building2 className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Active</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.active}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Pending</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Today</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.today}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">This Week</span>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.thisWeek}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary bg-white"
            >
              <option value="all">All Plans</option>
              {uniquePlans.map((plan) => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
            {(searchTerm || filterStatus !== "all" || filterPlan !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterPlan("all");
                }}
                className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition border border-red-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm shadow-sm">
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider">#</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider">Company</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">Slug</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">Type</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider">Plan</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden xl:table-cell">Registered</th>
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