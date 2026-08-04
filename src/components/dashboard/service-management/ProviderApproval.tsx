// src/components/admin/service-management/ProviderApproval.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  X,
  Eye,
  Clock,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  User,
} from "lucide-react";
import type { ProviderApprovalUser } from "../../../mock/serviceApi";
import {
  fetchProviderApprovals,
  updateProviderStatus,
} from "../../../mock/serviceApi";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";

const skeleton = (
  <div className="flex h-64 items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-4 border-secondary border-t-transparent" />
  </div>
);

export default function ProviderApproval() {
  const [approvals, setApprovals] = useState<ProviderApprovalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"businessName" | "submittedAt">(
    "businessName"
  );
  const [sortAsc, setSortAsc] = useState(true);
  const [viewing, setViewing] = useState<ProviderApprovalUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { toast, showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchProviderApprovals();
      setApprovals(data);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (
    id: number,
    status: "approved" | "rejected"
  ) => {
    try {
      await updateProviderStatus(
        id,
        status,
        status === "rejected" ? rejectReason : undefined
      );
      showToast(
        "success",
        `Provider ${status}${status === "rejected" && rejectReason ? " with reason" : ""}`
      );
      setRejectReason("");
      // Refresh detail modal if open
      if (viewing && viewing.id === id) {
        setViewing((prev) => prev ? { ...prev, status, rejectionReason: status === "rejected" ? rejectReason : undefined } : null);
      }
      load();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Summary stats
  const pending = approvals.filter((p) => p.status === "pending").length;
  const approved = approvals.filter((p) => p.status === "approved").length;
  const rejected = approvals.filter((p) => p.status === "rejected").length;

  // Filter & sort
  const filtered = useMemo(() => {
    let list = approvals;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.businessName.toLowerCase().includes(s) ||
          p.name.toLowerCase().includes(s) ||
          p.email.toLowerCase().includes(s)
      );
    }
    return list.sort((a, b) => {
      let valA: any, valB: any;
      if (sortField === "businessName") {
        valA = a.businessName.toLowerCase();
        valB = b.businessName.toLowerCase();
      } else {
        valA = new Date(a.submittedAt).getTime();
        valB = new Date(b.submittedAt).getTime();
      }
      return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [approvals, search, sortField, sortAsc]);

  const statusBadge = (status: ProviderApprovalUser["status"]) => {
    const classes = {
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      pending: "bg-yellow-100 text-yellow-700",
    };
    const icons = {
      approved: CheckCircle,
      rejected: XCircle,
      pending: Clock,
    };
    const Icon = icons[status];
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes[status]}`}
      >
        <Icon size={12} className="mr-1" />
        {status}
      </span>
    );
  };

  if (loading) return skeleton;

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-emerald-600">{approved}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-rose-600">{rejected}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by business, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm shadow-sm transition focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Sort by:</span>
        <button
          onClick={() => {
            setSortField("businessName");
            setSortAsc(!sortAsc);
          }}
          className={`px-2 py-0.5 rounded-full ${
            sortField === "businessName"
              ? "bg-secondary/10 text-secondary font-medium"
              : "hover:bg-gray-100"
          }`}
        >
          Business {sortField === "businessName" && (sortAsc ? "↑" : "↓")}
        </button>
        <button
          onClick={() => {
            setSortField("submittedAt");
            setSortAsc(!sortAsc);
          }}
          className={`px-2 py-0.5 rounded-full ${
            sortField === "submittedAt"
              ? "bg-secondary/10 text-secondary font-medium"
              : "hover:bg-gray-100"
          }`}
        >
          Submitted {sortField === "submittedAt" && (sortAsc ? "↑" : "↓")}
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
          <Building className="h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-500">No providers found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Business
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Submitted
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-100 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">
                      {p.businessName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{p.name}</div>
                    <div className="text-xs text-gray-400">{p.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {statusBadge(p.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewing(p)}
                        className="p-1.5 text-gray-400 hover:text-secondary rounded-lg hover:bg-secondary/10"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {p.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleAction(p.id, "approved")
                            }
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleAction(p.id, "rejected")
                            }
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Provider Details
              </h3>
              <button
                onClick={() => setViewing(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {viewing.businessName}
                  </p>
                  {viewing.businessAddress && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} /> {viewing.businessAddress}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {viewing.name}
                  </p>
                  <p className="text-xs text-gray-500">{viewing.email}</p>
                </div>
              </div>

              {viewing.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-400" />
                  <p className="text-sm text-gray-700">{viewing.phone}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock size={18} className="text-gray-400" />
                <p className="text-sm text-gray-700">
                  Submitted:{" "}
                  {new Date(viewing.submittedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400" />
                <span className="text-sm text-gray-700">Status:</span>
                {statusBadge(viewing.status)}
              </div>

              {viewing.documents && viewing.documents.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Documents
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {viewing.documents.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-gray-200 overflow-hidden hover:shadow transition"
                      >
                        <img
                          src={url}
                          alt={`Document ${idx + 1}`}
                          className="h-20 w-full object-cover"
                        />
                        <span className="block text-xs text-gray-500 p-1">
                          Doc {idx + 1}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {viewing.status === "rejected" && viewing.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700">
                  Rejection reason: {viewing.rejectionReason}
                </div>
              )}
            </div>

            {viewing.status === "pending" && (
              <div className="mt-6 pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection reason (optional)
                </label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  placeholder="Explain why this provider was rejected..."
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => handleAction(viewing.id, "rejected")}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(viewing.id, "approved")}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}
            {viewing.status !== "pending" && (
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setViewing(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}