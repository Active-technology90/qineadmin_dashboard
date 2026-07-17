import React, { useState, useEffect } from "react";
import { Users, Mail, Phone, Calendar, Eye, Edit, Trash2, XCircle, Building2, CheckCircle2, Clock, BarChart3, TrendingUp } from "lucide-react";  // ADDED: XCircle, Building2, CheckCircle2, Clock

interface Marketer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string | null;  
  totalRegistrations: number;
  activeRegistrations: number;
  joinedAt: string;
  lastActive?: string;  
  status: "Active" | "Inactive" | "Pending";
  companies?: Array<{  
    id: number;
    name: string;
    slug: string;
    registered_at: string;
    status: string;
  }>;
}

// ADDED: Interface for the detail modal
interface MarketerDetailModalProps {
  marketer: Marketer | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MarketersManagement() {
  const [marketers, setMarketers] = useState<Marketer[]>([]);
  const [selectedMarketer, setSelectedMarketer] = useState<Marketer | null>(null);  // ADDED
  const [isModalOpen, setIsModalOpen] = useState(false);  // ADDED

  useEffect(() => {
    // Get all companies from localStorage
    const allCompanies = JSON.parse(localStorage.getItem("registeredCompanies") || "[]");
    
    // Get all users from localStorage (for marketer details)
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    
    // Group by marketer
    const marketerMap = new Map();
    allCompanies.forEach((c: any) => {
      const name = c.registered_by || "Unknown";
      if (!marketerMap.has(name)) {
        // Find user details for this marketer
        const user = allUsers.find((u: any) => u.username === name || u.email?.includes(name));
        
        marketerMap.set(name, {
          id: Date.now() + marketerMap.size,
          name: name,
          email: user?.email || `${name.toLowerCase().replace(/\s/g, "")}@example.com`,
          phone: user?.phone || user?.phone_number || null,  // ADDED: Get phone from user
          photo: user?.profile_image || user?.photo || null,  // ADDED: Get photo from user
          totalRegistrations: 0,
          activeRegistrations: 0,
          joinedAt: c.registered_at || new Date().toISOString(),
          lastActive: new Date().toISOString(),  // ADDED: Last active
          status: "Active",
          companies: []
        });
      }
      const data = marketerMap.get(name);
      data.totalRegistrations += 1;
      if (c.status === "Active") data.activeRegistrations += 1;
      data.lastActive = c.registered_at > data.lastActive ? c.registered_at : data.lastActive;
      data.companies.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        registered_at: c.registered_at,
        status: c.status
      });
    });
    
    setMarketers(Array.from(marketerMap.values()));
  }, []);

  // ADDED: Handle view marketer details
  const handleViewMarketer = (marketer: Marketer) => {
    setSelectedMarketer(marketer);
    setIsModalOpen(true);
  };

  // ADDED: Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMarketer(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/20" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary">Marketers Management</h1>
          <p className="text-sm text-secondary/60">View and manage all marketers and their registrations</p>
        </div>
      </div>

      {/* Stats Cards - Modern Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl p-6 border border-secondary/10 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary/60">Total Marketers</p>
              <p className="text-3xl font-bold text-secondary mt-1">{marketers.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-secondary/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {marketers.filter(m => m.status === "Active").length} Active
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Registrations</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">
                {marketers.reduce((sum, m) => sum + m.totalRegistrations, 0)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-blue-500">
            Across all marketers
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Active Marketers</p>
              <p className="text-3xl font-bold text-emerald-700 mt-1">
                {marketers.filter(m => m.status === "Active").length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-emerald-500">
            {Math.round((marketers.filter(m => m.status === "Active").length / (marketers.length || 1)) * 100)}% of total
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/30 rounded-2xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Avg Registrations</p>
              <p className="text-3xl font-bold text-purple-700 mt-1">
                {marketers.length > 0 ? Math.round(marketers.reduce((sum, m) => sum + m.totalRegistrations, 0) / marketers.length) : 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-purple-500">
            Per marketer
          </div>
        </div>
      </div>

      {/* Table - Modern Design with Photo and Phone */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm shadow-sm">
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider">#</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider">Marketer</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">Phone</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider">Registrations</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="p-4 text-xs font-semibold text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {marketers.map((m, idx) => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4 text-sm font-medium text-gray-400">{idx + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-md">
                          {m.photo ? (
                            <img 
                              src={m.photo} 
                              alt={m.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-purple-600">
                              {m.name?.[0] || "?"}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          m.status === "Active" ? "bg-emerald-500" : 
                          m.status === "Pending" ? "bg-amber-500" : "bg-gray-400"
                        }`}></div>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate max-w-[150px]">{m.email}</span>
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{m.phone || "Not provided"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium inline-flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {m.totalRegistrations}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">
                        {m.activeRegistrations} active
                      </span>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      m.status === "Active" ? "bg-emerald-100 text-emerald-700" : 
                      m.status === "Pending" ? "bg-amber-100 text-amber-700" : 
                      "bg-gray-100 text-gray-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        m.status === "Active" ? "bg-emerald-500" : 
                        m.status === "Pending" ? "bg-amber-500" : 
                        "bg-gray-400"
                      }`}></span>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleViewMarketer(m)}
                        className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                        title="View marketer details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit marketer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADDED: Marketer Detail Modal - Modern Design with Full Profile */}
      {/* ADDED: Marketer Detail Modal - Secondary Color Theme */}
      {isModalOpen && selectedMarketer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-secondary/10">
            {/* Modal Header with Secondary Color Banner */}
            <div className="relative">
              {/* Gradient Banner - Secondary Colors */}
              <div className="h-28 bg-gradient-to-r from-secondary-dark via-secondary to-secondary-light"></div>
              
              {/* Profile Section - Overlapping the banner */}
              <div className="absolute -bottom-12 left-6 flex items-end gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl ring-2 ring-secondary/20">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center overflow-hidden">
                      {selectedMarketer.photo ? (
                        <img 
                          src={selectedMarketer.photo} 
                          alt={selectedMarketer.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-secondary">
                          {selectedMarketer.name?.[0] || "?"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                    selectedMarketer.status === "Active" ? "bg-emerald-500" : 
                    selectedMarketer.status === "Pending" ? "bg-amber-500" : "bg-gray-400"
                  }`}></div>
                </div>
                <div className="pb-2">
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg">{selectedMarketer.name}</h3>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>{selectedMarketer.email}</span>
                  </div>
                </div>
              </div>

              {/* Close Button - Secondary Color */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white backdrop-blur-sm"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 pt-16 overflow-y-auto space-y-6">
              {/* Contact Info Cards - Secondary Theme */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-secondary/5 rounded-xl p-3 text-center border border-secondary/10 hover:bg-secondary/10 transition">
                  <p className="text-xs text-secondary/60">Phone</p>
                  <p className="text-sm font-semibold text-secondary mt-1">
                    {selectedMarketer.phone || "Not provided"}
                  </p>
                </div>
                <div className="bg-secondary/5 rounded-xl p-3 text-center border border-secondary/10 hover:bg-secondary/10 transition">
                  <p className="text-xs text-secondary/60">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    selectedMarketer.status === "Active" ? "bg-emerald-100 text-emerald-700" : 
                    selectedMarketer.status === "Pending" ? "bg-amber-100 text-amber-700" : 
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {selectedMarketer.status}
                  </span>
                </div>
                <div className="bg-secondary/5 rounded-xl p-3 text-center border border-secondary/10 hover:bg-secondary/10 transition">
                  <p className="text-xs text-secondary/60">Joined</p>
                  <p className="text-sm font-semibold text-secondary mt-1">
                    {new Date(selectedMarketer.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-secondary/5 rounded-xl p-3 text-center border border-secondary/10 hover:bg-secondary/10 transition">
                  <p className="text-xs text-secondary/60">Last Active</p>
                  <p className="text-sm font-semibold text-secondary mt-1">
                    {selectedMarketer.lastActive ? new Date(selectedMarketer.lastActive).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              {/* Stats Grid - Secondary Theme */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-4 text-center border border-secondary/10">
                  <p className="text-3xl font-bold text-secondary">{selectedMarketer.totalRegistrations}</p>
                  <p className="text-xs text-secondary/60">Total Registrations</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-xl p-4 text-center border border-emerald-100">
                  <p className="text-3xl font-bold text-emerald-700">{selectedMarketer.activeRegistrations}</p>
                  <p className="text-xs text-emerald-500">Active</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-xl p-4 text-center border border-gray-100">
                  <p className="text-3xl font-bold text-gray-600">
                    {selectedMarketer.totalRegistrations - selectedMarketer.activeRegistrations}
                  </p>
                  <p className="text-xs text-gray-400">Inactive</p>
                </div>
              </div>

              {/* Companies Registered - Secondary Theme */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-secondary flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-secondary" />
                    Companies Registered ({selectedMarketer.companies?.length || 0})
                  </h4>
                  <span className="text-xs text-secondary/60">
                    {selectedMarketer.companies?.filter(c => c.status === "Active").length || 0} active
                  </span>
                </div>
                {selectedMarketer.companies && selectedMarketer.companies.length > 0 ? (
                  <div className="bg-secondary/5 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto border border-secondary/10">
                    {selectedMarketer.companies.map((company) => (
                      <div key={company.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition border border-secondary/5 hover:border-secondary/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-secondary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{company.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">{company.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            company.status === "Active" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {company.status}
                          </span>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date(company.registered_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-secondary/5 rounded-xl p-8 text-center border border-secondary/10 border-dashed">
                    <Building2 className="w-12 h-12 text-secondary/20 mx-auto mb-2" />
                    <p className="text-sm text-secondary/40">No companies registered yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Secondary Theme */}
            <div className="p-6 border-t border-secondary/10 bg-secondary/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button className="p-2 text-secondary/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete marketer">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-secondary/40 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors" title="Edit marketer">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl font-medium hover:shadow-lg hover:shadow-secondary/20 transition-all"
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