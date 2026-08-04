// src/components/admin/service-management/ComplianceManagement.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  FileText,
  Eye,
  Clock,
  ChevronDown,
  User,
  Mail,
  Calendar,
  FileDigit,
  StickyNote,
} from "lucide-react";
import type { ComplianceRecord } from "../../../mock/serviceApi";
import {
  fetchComplianceRecords,
  updateComplianceStatus,
} from "../../../mock/serviceApi";
import { Toast } from "../../ui/Toast";
import { useToast } from "../../../hooks/useToast";

const skeleton = (
  <div className="animate-pulse h-64 bg-gray-100 rounded-2xl" />
);

export default function ComplianceManagement({
  readOnly,
}: {
  readOnly?: boolean;
}) {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"customerName" | "lastCheck">(
    "customerName"
  );
  const [sortAsc, setSortAsc] = useState(true);
  const [viewing, setViewing] = useState<ComplianceRecord | null>(null);
  const { toast, showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setRecords(await fetchComplianceRecords());
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatus = async (id: number, status: "verified" | "flagged") => {
    try {
      await updateComplianceStatus(id, status);
      showToast("success", `Status updated to ${status}`);
      // Refresh the detail modal if open
      if (viewing && viewing.id === id) {
        setViewing({ ...viewing, status });
      }
      load();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  // Summary stats
  const total = records.length;
  const verified = records.filter((r) => r.status === "verified").length;
  const pending = records.filter((r) => r.status === "pending").length;
  const flagged = records.filter((r) => r.status === "flagged").length;

  // Filter & sort
  const filtered = useMemo(() => {
    let list = records;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.customerName.toLowerCase().includes(s) ||
          r.email.toLowerCase().includes(s) ||
          r.documentType.toLowerCase().includes(s)
      );
    }
    return list.sort((a, b) => {
      let valA: any, valB: any;
      if (sortField === "customerName") {
        valA = a.customerName.toLowerCase();
        valB = b.customerName.toLowerCase();
      } else {
        valA = new Date(a.lastCheck).getTime();
        valB = new Date(b.lastCheck).getTime();
      }
      return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [records, search, sortField, sortAsc]);

  const statusBadge = (status: ComplianceRecord["status"]) => {
    const classes = {
      verified: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      flagged: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          classes[status]
        }`}
      >
        {status === "verified" && <CheckCircle size={12} className="mr-1" />}
        {status === "flagged" && <AlertTriangle size={12} className="mr-1" />}
        {status === "pending" && <Clock size={12} className="mr-1" />}
        {status}
      </span>
    );
  };

  if (loading) return skeleton;

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Checks</p>
          <p className="text-2xl font-bold text-secondary">{total}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="text-2xl font-bold text-emerald-600">{verified}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Flagged</p>
          <p className="text-2xl font-bold text-rose-600">{flagged}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or document type..."
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
            setSortField("customerName");
            setSortAsc(!sortAsc);
          }}
          className={`px-2 py-0.5 rounded-full ${
            sortField === "customerName"
              ? "bg-secondary/10 text-secondary font-medium"
              : "hover:bg-gray-100"
          }`}
        >
          Customer {sortField === "customerName" && (sortAsc ? "↑" : "↓")}
        </button>
        <button
          onClick={() => {
            setSortField("lastCheck");
            setSortAsc(!sortAsc);
          }}
          className={`px-2 py-0.5 rounded-full ${
            sortField === "lastCheck"
              ? "bg-secondary/10 text-secondary font-medium"
              : "hover:bg-gray-100"
          }`}
        >
          Last Check {sortField === "lastCheck" && (sortAsc ? "↑" : "↓")}
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50">
          <Shield className="h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-500">
            No compliance records found
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Document
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Last Check
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
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-gray-100 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-medium text-xs">
                        {r.customerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {r.customerName}
                        </p>
                        <p className="text-xs text-gray-500">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.documentType}
                    {r.documentNumber && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({r.documentNumber})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(r.lastCheck).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {statusBadge(r.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewing(r)}
                        className="p-1.5 text-gray-400 hover:text-secondary rounded-lg hover:bg-secondary/10"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {!readOnly && (
                        <>
                          <button
                            onClick={() => handleStatus(r.id, "verified")}
                            disabled={r.status === "verified"}
                            className="p-1.5 text-green-600 hover:text-green-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-green-50"
                            title="Verify"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleStatus(r.id, "flagged")}
                            disabled={r.status === "flagged"}
                            className="p-1.5 text-rose-500 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-red-50"
                            title="Flag"
                          >
                            <AlertTriangle size={16} />
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Compliance Details
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
                <User size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {viewing.customerName}
                  </p>
                  <p className="text-xs text-gray-500">{viewing.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {viewing.documentType}
                  </p>
                  {viewing.documentNumber && (
                    <p className="text-xs text-gray-500">
                      Number: {viewing.documentNumber}
                    </p>
                  )}
                </div>
              </div>

              {viewing.expiryDate && (
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-gray-400" />
                  <p className="text-sm text-gray-700">
                    Expires:{" "}
                    {new Date(viewing.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Shield size={18} className="text-gray-400" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Status:</span>
                  {statusBadge(viewing.status)}
                </div>
              </div>

              {viewing.notes && (
                <div className="flex items-start gap-3">
                  <StickyNote size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Notes</p>
                    <p className="text-sm text-gray-600">{viewing.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock size={18} className="text-gray-400" />
                <p className="text-sm text-gray-500">
                  Last checked:{" "}
                  {new Date(viewing.lastCheck).toLocaleDateString()}
                </p>
              </div>
            </div>

            {!readOnly && (
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => handleStatus(viewing.id, "verified")}
                  disabled={viewing.status === "verified"}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleStatus(viewing.id, "flagged")}
                  disabled={viewing.status === "flagged"}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                >
                  Flag
                </button>
                <button
                  onClick={() => setViewing(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            )}
            {readOnly && (
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