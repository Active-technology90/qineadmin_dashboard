// src/components/admin/Payments.tsx
import { useEffect, useState, useMemo } from "react";
import { Search, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getMyOrders } from "../../services/api";
import type { MasterOrder } from "../../types";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../ui/Toast";

const ITEMS_PER_PAGE = 10;

interface PaymentDisplay {
  id: number;
  order_number: string;
  amount: number;
  method: string;
  status: "completed" | "pending" | "failed";
  date: string;
  receipt_url?: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<PaymentDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast, showToast } = useToast();

  const mapOrderStatusToPaymentStatus = (orderStatus: string): "completed" | "pending" | "failed" => {
    switch (orderStatus.toLowerCase()) {
      case "completed":
      case "delivered":
        return "completed";
      case "cancelled":
        return "failed";
      default:
        return "pending";
    }
  };

  const formatPaymentMethod = (method: string): string => {
    switch (method) {
      case "chapa": return "Chapa";
      case "bank_transfer": return "Bank Transfer";
      case "cod": return "Cash on Delivery";
      default: return method;
    }
  };

  // Fetch all orders (payments) from all pages
  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      let allOrders: MasterOrder[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const res = await getMyOrders();
        const data = res.data;
        allOrders = [...allOrders, ...data.results];
        hasMore = !!data.next;
        page++;
      }

      // Map orders to payment display format
      const mappedPayments: PaymentDisplay[] = allOrders.map((order) => ({
        id: order.id,
        order_number: `#${order.id}`,
        amount: Number(order.total_amount),
        method: formatPaymentMethod(order.payment_method),
        status: mapOrderStatusToPaymentStatus(order.status),
        date: order.created_at,
      }));

      setPayments(mappedPayments);
    } catch (err: any) {
      setError(err.message || "Failed to load payments");
      showToast("error", "Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  // Filter payments
  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    const term = searchTerm.toLowerCase();
    return payments.filter(
      (p) =>
        p.order_number.toLowerCase().includes(term) ||
        p.method.toLowerCase().includes(term) ||
        p.status.toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

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
    // Placeholder for receipt download
    showToast("info", "Receipt download not yet implemented");
  };

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAllOrders}
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
        <h2 className="text-xl font-bold text-gray-900">Payments</h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by order number, method, or status..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (ETB)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.order_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {payment.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDownloadReceipt()}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Download receipt"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t mt-4">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length)} of{" "}
            {filteredPayments.length} payments
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}