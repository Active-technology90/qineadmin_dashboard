// src/components/dashboard/UserManagement/MarketingAgentsManagement.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Building2,
  Award,
  Eye,
  X,
  Target,
} from "lucide-react";
import { getAdminMarketingAgents } from "../../../services/api";
import MarketingOverview from "../overview/MarketingOverview";

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

export default function MarketingAgentsManagement() {
  const [agents, setAgents] = useState<MarketingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState("");

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
    if (!searchTerm.trim()) return agents;
    const term = searchTerm.toLowerCase();
    return agents.filter(
      (a) =>
        a.username.toLowerCase().includes(term) ||
        (a.first_name && a.first_name.toLowerCase().includes(term)) ||
        (a.last_name && a.last_name.toLowerCase().includes(term)) ||
        a.email.toLowerCase().includes(term)
    );
  }, [agents, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-semibold text-gray-500">Loading agents registry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans bg-gray-50/50 min-h-screen">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
            Marketing Agents registry
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage target quotas and audit onboardings for Qine platform's marketing agents
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="h-5 w-5 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by agent name, username, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none border-none py-1"
        />
      </div>

      {/* Agents Grid List */}
      {error ? (
        <div className="p-6 text-center max-w-md mx-auto bg-red-50 rounded-2xl border border-red-100 text-red-600 text-sm">
          {error}
          <button onClick={fetchAgents} className="block mx-auto mt-4 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition">
            Retry
          </button>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl shadow-sm border border-gray-100 text-gray-400 text-sm font-semibold">
          No marketing agents found matching your query
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition duration-300 relative group overflow-hidden"
            >
              {/* Agent info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {agent.profile_image ? (
                    <img
                      src={agent.profile_image}
                      alt={agent.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-secondary/20 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary text-lg border border-secondary/10">
                      {(agent.first_name?.[0] || agent.username?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">
                      {agent.first_name && agent.last_name
                        ? `${agent.first_name} ${agent.last_name}`
                        : agent.username}
                    </h3>
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">{agent.email}</p>
                    {agent.phone_number && (
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{agent.phone_number}</p>
                    )}
                  </div>
                </div>

                {/* Target indicators */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-purple-50/50 p-2.5 rounded-2xl border border-purple-100/50 flex items-center gap-2">
                    <Target className="h-4 w-4 text-secondary shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Daily Goal</p>
                      <p className="text-xs font-black text-secondary">{agent.daily_target} companies</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-100/50 flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Weekly Goal</p>
                      <p className="text-xs font-black text-emerald-600">{agent.weekly_target} companies</p>
                    </div>
                  </div>
                </div>

                {/* KPI stats */}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> Total Registered:
                  </span>
                  <span className="font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {agent.companies_count}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    setSelectedAgentName(
                      agent.first_name && agent.last_name
                        ? `${agent.first_name} ${agent.last_name}`
                        : agent.username
                    );
                  }}
                  className="w-full bg-secondary text-white py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-[#5b4694] transition text-sm font-semibold shadow-sm"
                >
                  <Eye className="h-4 w-4" />
                  Audit Performance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Modal Overlay */}
      {selectedAgentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-white w-full max-w-6xl h-[90dvh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-secondary px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Auditing Agent: {selectedAgentName}
                </h2>
                <p className="text-purple-100 text-xs mt-0.5">
                  Detailed registration activity and metrics for agent #{selectedAgentId}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedAgentId(null);
                  setSelectedAgentName("");
                }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
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
    </div>
  );
}
