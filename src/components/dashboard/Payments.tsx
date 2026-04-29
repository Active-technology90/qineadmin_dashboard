// src/components/admin/Payments.tsx
import { useState, useMemo, useEffect } from "react"; // added useEffect
import { Search, Download, Loader2 } from "lucide-react";
import { useAdminPayouts } from "../../hooks/useAdminPayouts";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../ui/Toast";
// Removed unused imports:
// import { useApprovePayout } from "../../hooks/useApprovePayout";
// import { useRejectPayout } from "../../hooks/useRejectPayout";
import { Pagination } from "../ui/Pagination";
import { TableControls } from "../ui/TableControls";

export default function Payments() {
  const { payouts, loading, error, refetch } = useAdminPayouts();
  // Removed unused destructuring
  // const { approvePayout } = useApprovePayout();
  // const { rejectPayout } = useRejectPayout();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast, showToast } = useToast();

  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payouts;

    const term = searchTerm.toLowerCase();

    return payouts.filter(
      (p) =>
        p.order_number?.toLowerCase().includes(term) ||
        p.method?.toLowerCase().includes(term) ||
        p.status?.toLowerCase().includes(term),
    );
  }, [payouts, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / pageSize);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownloadReceipt = () => {
    showToast("info", "Receipt download not yet implemented");
  };

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <Toast toast={toast} />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#6750A4]">Payments</h2>
      </div>

      {/* Search */}
      <TableControls pageSize={pageSize} onPageSizeChange={setPageSize}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number, method, or status..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl
  focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-[#6750A4] transition"
              />
            </div>
          </div>
        </div>
      </TableControls>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount (ETB)
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
                  <p className="mt-2 text-gray-500">Loading payments...</p>
                </td>
              </tr>
            ) : paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              paginatedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 transition">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.order_number}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                    {Number(payment.amount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                    {payment.method}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <div className="inline-flex gap-2 justify-end items-center">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt()}
                        className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {/* Approve */}

                      {/* <button
                        type="button"
                        onClick={async () => {
                          await approvePayout(payment.id);
                          refetch();
                        }}
                        className="text-green-600 hover:text-green-800 cursor-pointer"
                      >
                        Approve
                      </button> */}

                      {/* Reject */}
                      {/* <button
                        type="button"
                        onClick={async () => {
                          await rejectPayout(payment.id);
                          refetch();
                        }}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Reject
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
}
