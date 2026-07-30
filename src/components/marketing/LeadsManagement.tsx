import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  Building2,
  Star,
  FileDown,
} from "lucide-react";
import { TableControls } from "../ui/TableControls";
import { SearchInput } from "../ui/SearchInput";
import { Pagination } from "../ui/Pagination";
import { CustomSelect } from "../ui/CustomSelect";
import FilterSortSheet from "../ui/FilterSortSheet";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../ui/Toast";
import { FormModal } from "../ui/FormModal";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";

// Types
interface Lead {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  status: "new" | "contacted" | "interested" | "converted" | "lost";
  source: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  assigned_to: number;
}

// Mock data (replace with API call)
const mockLeads: Lead[] = [
  {
    id: 1,
    company_name: "Abyssinia Trading PLC",
    contact_name: "Abebe Kebede",
    email: "abebe@abyssinia.com",
    phone: "+251 911 234 567",
    status: "new",
    source: "Website",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z",
    assigned_to: 4,
  },
  {
    id: 2,
    company_name: "Ethio Telecom Solutions",
    contact_name: "Tigist Haile",
    email: "tigist@ethiotelecom.com",
    phone: "+251 922 345 678",
    status: "contacted",
    source: "Referral",
    created_at: "2025-01-14T14:20:00Z",
    updated_at: "2025-01-14T14:20:00Z",
    assigned_to: 4,
  },
  {
    id: 3,
    company_name: "Zemen Bank S.C",
    contact_name: "Dawit Girma",
    email: "dawit@zemenbank.com",
    phone: "+251 933 456 789",
    status: "interested",
    source: "LinkedIn",
    created_at: "2025-01-13T09:15:00Z",
    updated_at: "2025-01-13T09:15:00Z",
    assigned_to: 4,
  },
  {
    id: 4,
    company_name: "Habesha Foods PLC",
    contact_name: "Meron Ayele",
    email: "meron@habeshafoods.com",
    phone: "+251 944 567 890",
    status: "converted",
    source: "Trade Show",
    created_at: "2025-01-12T16:45:00Z",
    updated_at: "2025-01-12T16:45:00Z",
    assigned_to: 4,
  },
  {
    id: 5,
    company_name: "Sheba Tech Hub",
    contact_name: "Yonas Tesfaye",
    email: "yonas@shebatech.com",
    phone: "+251 955 678 901",
    status: "lost",
    source: "Social Media",
    created_at: "2025-01-11T11:00:00Z",
    updated_at: "2025-01-11T11:00:00Z",
    assigned_to: 4,
  },
];

const statusConfig: Record<Lead["status"], { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="h-3 w-3" /> },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Mail className="h-3 w-3" /> },
  interested: { label: "Interested", color: "bg-purple-100 text-purple-700 border-purple-200", icon: <Star className="h-3 w-3" /> },
  converted: { label: "Converted", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle className="h-3 w-3" /> },
  lost: { label: "Lost", color: "bg-red-100 text-red-700 border-red-200", icon: <AlertCircle className="h-3 w-3" /> },
};

// ─── Skeleton Components ──────────────────────────────────
const SkeletonLeadRow: React.FC = () => (
  <tr className="group transition-all duration-150 border-b border-gray-100/80 animate-pulse">
    <td className="py-3.5 px-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-300/70"></div>
        <div>
          <div className="h-4 w-24 bg-gray-300/70 rounded mb-1"></div>
          <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
        </div>
      </div>
    </td>
    <td className="py-3.5 px-5">
      <div className="space-y-0.5">
        <div className="h-3 w-32 bg-gray-300/70 rounded"></div>
        <div className="h-3 w-24 bg-gray-300/70 rounded"></div>
      </div>
    </td>
    <td className="py-3.5 px-5"><div className="h-6 w-16 bg-gray-300/70 rounded-full"></div></td>
    <td className="py-3.5 px-5"><div className="h-4 w-20 bg-gray-300/70 rounded"></div></td>
    <td className="py-3.5 px-5"><div className="h-4 w-24 bg-gray-300/70 rounded"></div></td>
    <td className="py-3.5 px-5 text-right">
      <div className="flex items-center justify-end gap-1.5">
        <div className="h-8 w-8 rounded-full bg-gray-300/70"></div>
        <div className="h-8 w-8 rounded-full bg-gray-300/70"></div>
        <div className="h-8 w-8 rounded-full bg-gray-300/70"></div>
      </div>
    </td>
  </tr>
);

const SkeletonLeadTable: React.FC<{ rowCount?: number }> = ({ rowCount = 5 }) => (
  <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden animate-pulse">
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 border-b border-gray-200/60">
            {["Company / Contact", "Contact Info", "Status", "Source", "Created", "Actions"].map((h) => (
              <th key={h} className="text-left py-3.5 px-5">
                <div className="h-4 w-16 bg-gray-300/70 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rowCount)].map((_, i) => (
            <SkeletonLeadRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
    {/* Mobile skeleton cards */}
    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-gray-300/70"></div>
            <div className="flex-1">
              <div className="h-4 w-24 bg-gray-300/70 rounded mb-1"></div>
              <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
            </div>
            <div className="h-5 w-16 bg-gray-300/70 rounded-full"></div>
          </div>
          <div className="space-y-0.5">
            <div className="h-3 w-32 bg-gray-300/70 rounded"></div>
            <div className="h-3 w-24 bg-gray-300/70 rounded"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
            <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
            <div className="h-6 w-6 rounded-full bg-gray-300/70"></div>
            <div className="h-6 w-6 rounded-full bg-gray-300/70"></div>
            <div className="h-6 w-6 rounded-full bg-gray-300/70"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function LeadsManagement() {
  const { toast, showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("name|asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sheet state for mobile filters
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modal state for Add Lead
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    status: "new",
    source: "",
    notes: "",
  });

  // State for View, Edit, Delete
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

  // Edit form data (pre‑filled from editingLead)
  const [editFormData, setEditFormData] = useState<Partial<Lead>>({});

  // Fetch leads (replace with real API)
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLeads(mockLeads);
        setError(null);
      } catch (err) {
        setError("Failed to load leads.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  // Filtering and sorting
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.company_name.toLowerCase().includes(term) ||
          l.contact_name.toLowerCase().includes(term) ||
          l.email.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }

    // Sort
    const [field, order] = sort.split("|");
    result.sort((a, b) => {
      let valA = a[field as keyof Lead] as string;
      let valB = b[field as keyof Lead] as string;
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (order === "asc") return valA > valB ? 1 : valA < valB ? -1 : 0;
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    });

    return result;
  }, [leads, searchTerm, statusFilter, sort]);

  // Pagination
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sort, pageSize]);

  // Sort options for dropdown
  const sortOptions = [
    { label: "Company (A-Z)", value: "company_name|asc" },
    { label: "Company (Z-A)", value: "company_name|desc" },
    { label: "Contact (A-Z)", value: "contact_name|asc" },
    { label: "Contact (Z-A)", value: "contact_name|desc" },
    { label: "Newest First", value: "created_at|desc" },
    { label: "Oldest First", value: "created_at|asc" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    ...Object.entries(statusConfig).map(([key, val]) => ({
      label: val.label,
      value: key,
    })),
  ];

  // Export CSV (reuse from your agents page)
  const handleExport = () => {
    const headers = ["Company", "Contact", "Email", "Phone", "Status", "Source", "Created"];
    const rows = filteredLeads.map((l) => [
      l.company_name,
      l.contact_name,
      l.email,
      l.phone,
      statusConfig[l.status].label,
      l.source,
      new Date(l.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Export successful");
  };

  // Add new lead
  const handleAddLead = () => {
    if (!newLead.company_name?.trim() || !newLead.contact_name?.trim()) {
      showToast("error", "Company name and contact name are required");
      return;
    }
    const lead: Lead = {
      id: Math.max(...leads.map((l) => l.id), 0) + 1,
      company_name: newLead.company_name,
      contact_name: newLead.contact_name,
      email: newLead.email || "",
      phone: newLead.phone || "",
      status: (newLead.status as Lead["status"]) || "new",
      source: newLead.source || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: newLead.notes || "",
      assigned_to: 4,
    };
    setLeads([lead, ...leads]);
    setIsModalOpen(false);
    setNewLead({
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      status: "new",
      source: "",
      notes: "",
    });
    showToast("success", "Lead added successfully");
  };

  // View Lead
  const handleView = (lead: Lead) => {
    setViewingLead(lead);
  };

  // Edit Lead - open modal with pre‑filled data
  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setEditFormData({
      company_name: lead.company_name,
      contact_name: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      source: lead.source,
      notes: lead.notes || "",
    });
  };

  // Update Lead
  const handleUpdateLead = () => {
    if (!editingLead) return;
    if (!editFormData.company_name?.trim() || !editFormData.contact_name?.trim()) {
      showToast("error", "Company name and contact name are required");
      return;
    }

    const updatedLead: Lead = {
      ...editingLead,
      company_name: editFormData.company_name,
      contact_name: editFormData.contact_name,
      email: editFormData.email || "",
      phone: editFormData.phone || "",
      status: (editFormData.status as Lead["status"]) || editingLead.status,
      source: editFormData.source || "",
      notes: editFormData.notes || "",
      updated_at: new Date().toISOString(),
    };

    setLeads(leads.map((l) => (l.id === editingLead.id ? updatedLead : l)));
    setEditingLead(null);
    setEditFormData({});
    showToast("success", "Lead updated successfully");
  };

  // Delete Lead
  const handleDelete = (lead: Lead) => {
    setDeletingLead(lead);
  };

  const handleConfirmDelete = () => {
    if (!deletingLead) return;
    setLeads(leads.filter((l) => l.id !== deletingLead.id));
    setDeletingLead(null);
    showToast("success", "Lead deleted successfully");
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans bg-gray-50/50 min-h-screen animate-pulse">
        {/* ─── Header Skeleton ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-32 bg-gray-300/70 rounded mb-2"></div>
            <div className="h-4 w-64 bg-gray-300/70 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 bg-gray-300/70 rounded-xl"></div>
            <div className="h-10 w-28 bg-gray-300/70 rounded-xl"></div>
          </div>
        </div>

        {/* ─── Table Controls Skeleton ────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-3 w-full items-start md:items-center">
          <div className="w-full md:flex-1 h-10 bg-gray-300/70 rounded-xl"></div>
          <div className="hidden md:flex flex-col sm:flex-row items-center gap-2">
            <div className="w-48 h-10 bg-gray-300/70 rounded-xl"></div>
            <div className="w-40 h-10 bg-gray-300/70 rounded-xl"></div>
            <div className="w-10 h-10 bg-gray-300/70 rounded-xl"></div>
          </div>
        </div>

        {/* ─── Table Skeleton ────────────────────────────────── */}
        <SkeletonLeadTable rowCount={pageSize} />

        {/* ─── Pagination Skeleton ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="h-6 w-24 bg-gray-300/70 rounded-full"></div>
            <div className="h-8 w-24 bg-gray-300/70 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-8 bg-gray-300/70 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 rounded-2xl border border-red-100">
        <p className="text-red-600">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 font-sans bg-gray-50/50 min-h-screen">
      <Toast toast={toast} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-secondary tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
            Leads
          </h1>
          <p className="text-xs sm:text-sm text-secondary-light/80 mt-1">
            Manage your sales pipeline and potential clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm"
          >
            <FileDown className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-xl text-sm font-bold hover:shadow-lg transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Table Controls with search, sort, filter */}
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
            placeholder="Search leads by company, contact, email..."
            debounceMs={300}
            showClearButton={true}
            showMobileFilter={true}
            onMobileFilterClick={() => setFilterSheetOpen(true)}
            activeFilterCount={statusFilter !== "all" ? 1 : 0}
            className="w-full md:flex-1"
          />
          <div className="hidden md:flex flex-col sm:flex-row items-center gap-2">
            <CustomSelect
              value={sort}
              onChange={(val) => {
                setSort(val);
                setCurrentPage(1);
              }}
              options={sortOptions}
              placeholder="Sort by..."
              className="w-full sm:w-48"
            />
            <CustomSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={statusOptions}
              placeholder="Status..."
              className="w-full sm:w-40"
            />
            {/* Clear filters button */}
            {(statusFilter !== "all" || searchTerm.trim() !== "" || sort !== "company_name|asc") && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSort("company_name|asc");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-100 hover:bg-red-200 transition text-red-600 shadow-sm flex-shrink-0"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </TableControls>

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No leads found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 border-b border-gray-200/60">
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Company / Contact
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-right py-3.5 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`group transition-all duration-150 ${index !== paginatedLeads.length - 1 ? "border-b border-gray-100/80" : ""
                      } hover:bg-gray-50/60`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary/10 to-purple-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{lead.company_name}</p>
                          <p className="text-xs text-gray-500">{lead.contact_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[lead.status].color}`}
                      >
                        {statusConfig[lead.status].icon}
                        {statusConfig[lead.status].label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-gray-600">{lead.source}</td>
                    <td className="py-3.5 px-5 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleView(lead)}
                          className="p-1.5 rounded-full hover:bg-gray-100 transition"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-gray-400 hover:text-secondary" />
                        </button>
                        <button
                          onClick={() => handleEdit(lead)}
                          className="p-1.5 rounded-full hover:bg-gray-100 transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-gray-400 hover:text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead)}
                          className="p-1.5 rounded-full hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {paginatedLeads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary/10 to-purple-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{lead.company_name}</p>
                    <p className="text-xs text-gray-500 truncate">{lead.contact_name}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig[lead.status].color}`}
                  >
                    {statusConfig[lead.status].icon}
                    {statusConfig[lead.status].label}
                  </span>
                </div>
                <div className="space-y-0.5 text-xs">
                  <p className="text-gray-600 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {lead.email}
                  </p>
                  <p className="text-gray-600 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {lead.phone}
                  </p>
                </div>
                <div className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
                  <span>{lead.source}</span>
                  <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button className="p-1 rounded-full hover:bg-gray-100 transition"><Eye className="h-4 w-4 text-gray-400" /></button>
                  <button className="p-1 rounded-full hover:bg-gray-100 transition"><Edit className="h-4 w-4 text-gray-400" /></button>
                  <button className="p-1 rounded-full hover:bg-red-50 transition"><Trash2 className="h-4 w-4 text-gray-400" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredLeads.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredLeads.length / pageSize)}
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

      {/* Mobile Filter Sheet */}
      <FilterSortSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        sortOptions={sortOptions}
        tempSort={sort}
        onTempSortChange={(val) => setSort(val)}
        categoryOptions={statusOptions}
        tempCategory={statusFilter}
        onTempCategoryChange={(val) => setStatusFilter(val)}
        categoryNameMap={Object.fromEntries(
          Object.entries(statusConfig).map(([k, v]) => [k, v.label])
        )}
        onApply={() => {
          setFilterSheetOpen(false);
          setCurrentPage(1);
        }}
        onClearAll={() => {
          setSort("company_name|asc");
          setStatusFilter("all");
          setSearchTerm("");
          setFilterSheetOpen(false);
          setCurrentPage(1);
        }}
      />

      {/* Add Lead Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewLead({
            company_name: "",
            contact_name: "",
            email: "",
            phone: "",
            status: "new",
            source: "",
            notes: "",
          });
        }}
        title="Add New Lead"
        onSubmit={handleAddLead}
        submitting={false}
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newLead.company_name || ""}
              onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="e.g. Abyssinia Trading PLC"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newLead.contact_name || ""}
              onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="e.g. Abebe Kebede"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={newLead.email || ""}
              onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="contact@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Phone
            </label>
            <input
              type="text"
              value={newLead.phone || ""}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="+251 911 234 567"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={newLead.status || "new"}
              onChange={(e) => setNewLead({ ...newLead, status: e.target.value as Lead["status"] })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Source
            </label>
            <input
              type="text"
              value={newLead.source || ""}
              onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="Website, Referral, LinkedIn, etc."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              value={newLead.notes || ""}
              onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-none"
              placeholder="Additional notes about this lead..."
              rows={2}
            />
          </div>
        </div>
      </FormModal>
      {/* View Lead Modal */}
      {viewingLead && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Lead Details</h2>
              <button
                onClick={() => setViewingLead(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{viewingLead.company_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{viewingLead.contact_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>
                <p className="text-sm text-gray-700 mt-0.5">{viewingLead.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</p>
                <p className="text-sm text-gray-700 mt-0.5">{viewingLead.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[viewingLead.status].color}`}>
                  {statusConfig[viewingLead.status].icon}
                  {statusConfig[viewingLead.status].label}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source</p>
                <p className="text-sm text-gray-700 mt-0.5">{viewingLead.source || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</p>
                <p className="text-sm text-gray-700 mt-0.5">{viewingLead.notes || "No notes"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Created</p>
                <p className="text-sm text-gray-700 mt-0.5">{new Date(viewingLead.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Updated</p>
                <p className="text-sm text-gray-700 mt-0.5">{new Date(viewingLead.updated_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingLead(null)}
                className="px-5 py-2 bg-secondary text-white rounded-xl text-sm font-bold hover:shadow-lg transition active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <FormModal
          isOpen={!!editingLead}
          onClose={() => {
            setEditingLead(null);
            setEditFormData({});
          }}
          title="Edit Lead"
          onSubmit={handleUpdateLead}
          submitting={false}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.company_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.contact_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, contact_name: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                required
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
                value={editFormData.phone || ""}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={editFormData.status || "new"}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as Lead["status"] })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Source
              </label>
              <input
                type="text"
                value={editFormData.source || ""}
                onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <textarea
                value={editFormData.notes || ""}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-none"
                rows={2}
              />
            </div>
          </div>
        </FormModal>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingLead}
        title={deletingLead?.company_name || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingLead(null)}
      />
    </div>
  );
}