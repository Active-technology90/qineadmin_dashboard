// src/components/admin/service-management/BookingsManagement.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  Eye,
  MoreHorizontal,
  Search,
  Download,
  Plus,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  X,
  Star,
  ShoppingBag,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { DataTable, type Column } from "../../ui/DataTable";
import { SearchInput } from "../../ui/SearchInput";
import { Pagination } from "../../ui/Pagination";
import { CustomSelect } from "../../ui/CustomSelect";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import {
  getBookings,
  type Booking,
  type ApiResponse,
  type BookingFilterParams,
} from "../../../mock/serviceApi";
import BookingDetailDrawer from "./BookingDetailDrawer";

// ─── constants ────────────────────────────────────
const bookingStatuses: Booking["bookingStatus"][] = [
  "pending", "confirmed", "in_progress", "completed", "cancelled", "no_show",
];
const paymentStatuses: Booking["paymentStatus"][] = [
  "pending", "paid", "refunded", "partial_refund", "failed",
];
const providerList = [
  { id: 1, name: "Bekele’s Barbershop" },
  { id: 2, name: "Meron Spa & Wellness" },
  { id: 3, name: "Abebe’s Auto Garage" },
];
const categoryList = [
  { id: 1, name: "Barber" },
  { id: 2, name: "Spa" },
  { id: 3, name: "Auto" },
  { id: 4, name: "Beauty" },
  { id: 5, name: "Cleaning" },
];

// ─── helper components ────────────────────────────
const StatusBadge = ({
  status,
  paymentStatus,
}: {
  status: Booking["bookingStatus"];
  paymentStatus: Booking["paymentStatus"];
}) => {
  const bookingColors: Record<Booking["bookingStatus"], string> = {
    pending: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    in_progress: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    cancelled: "bg-red-50 text-red-700 ring-1 ring-red-200",
    no_show: "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
  };
  const paymentColors: Record<Booking["paymentStatus"], string> = {
    pending: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
    paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    refunded: "bg-red-50 text-red-700 ring-1 ring-red-200",
    partial_refund: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    failed: "bg-red-50 text-red-800 ring-1 ring-red-200",
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bookingColors[status]}`}>
        {status === "completed" && <CheckCircle size={10} />}
        {status === "cancelled" && <AlertCircle size={10} />}
        {status.replace(/_/g, " ")}
      </span>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${paymentColors[paymentStatus]}`}>
        {paymentStatus.replace(/_/g, " ")}
      </span>
    </div>
  );
};

// KPI Card component
const KPICard = ({
  label,
  value,
  icon,
  iconBg,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center gap-3">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {trend && <p className="text-xs text-emerald-600 mt-0.5">{trend}</p>}
      </div>
    </div>
  </div>
);

// Mobile booking card component
const MobileBookingCard = ({
  booking,
  onView,
}: {
  booking: Booking;
  onView: (id: number) => void;
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img src={booking.customerAvatar} className="h-10 w-10 rounded-full object-cover" alt="" />
        <div>
          <p className="font-medium text-gray-800">{booking.customer}</p>
          <p className="text-xs text-gray-500">{booking.customerEmail}</p>
        </div>
      </div>
      <StatusBadge status={booking.bookingStatus} paymentStatus={booking.paymentStatus} />
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <span className="text-gray-500">Provider</span>
        <p className="font-medium">{booking.provider}</p>
      </div>
      <div>
        <span className="text-gray-500">Service</span>
        <p className="font-medium">{booking.serviceCategory}</p>
      </div>
      <div>
        <span className="text-gray-500">Date/Time</span>
        <p className="font-medium">{new Date(booking.scheduledDate).toLocaleDateString()} at {booking.startTime}</p>
      </div>
      <div>
        <span className="text-gray-500">Amount</span>
        <p className="font-medium">ETB {booking.total}</p>
      </div>
    </div>
    <div className="flex justify-end">
      <button
        onClick={() => onView(booking.id)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-secondary text-white hover:bg-secondary-dark transition"
      >
        <Eye size={14} /> View
      </button>
    </div>
  </div>
);

// ─── main component ─────────────────────────────
export default function BookingsManagement() {
  const { toast, showToast } = useToast();

  // filter states
  const [params, setParams] = useState<BookingFilterParams>({
    page: 1,
    limit: 10,
    sortField: "scheduledDate",
    sortOrder: "desc",
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [providerId, setProviderId] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // data
  const [data, setData] = useState<ApiResponse<Booking[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  // stats
  const [statsData, setStatsData] = useState({
    total: 0,
    completed: 0,
    revenue: 0,
    pending: 0,
    cancelled: 0,
    today: 0,
  });

  // fetch paginated data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBookings({
        ...params,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
        categoryId: categoryId === "all" ? undefined : Number(categoryId),
        providerId: providerId === "all" ? undefined : Number(providerId),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setData(res);
    } catch (err: any) {
      showToast("error", err.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }, [params, search, status, paymentStatus, categoryId, providerId, dateFrom, dateTo, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // fetch stats (once)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getBookings({ limit: 500 });
        const bookings = res.data;
        const todayStr = new Date().toISOString().split("T")[0];
        setStatsData({
          total: bookings.length,
          completed: bookings.filter((b) => b.bookingStatus === "completed").length,
          revenue: bookings.reduce((sum, b) => sum + b.total, 0),
          pending: bookings.filter((b) => b.bookingStatus === "pending").length,
          cancelled: bookings.filter((b) => b.bookingStatus === "cancelled").length,
          today: bookings.filter((b) => b.scheduledDate === todayStr).length,
        });
      } catch {
        /* ignore */
      }
    };
    fetchStats();
  }, []);

  // ── column definitions (same as before) ─────────
  const columns: Column<Booking>[] = useMemo(
    () => [
      {
        key: "bookingNumber",
        header: "Booking #",
        sortable: true,
        render: (b) => <span className="font-mono text-xs text-gray-700">{b.bookingNumber}</span>,
      },
      {
        key: "customer",
        header: "Customer",
        sortable: true,
        render: (b) => (
          <div className="flex items-center gap-2.5">
            <img src={b.customerAvatar} className="h-8 w-8 rounded-full object-cover" alt="" />
            <div>
              <p className="text-sm font-medium text-gray-800">{b.customer}</p>
              <p className="text-xs text-gray-500">{b.customerEmail}</p>
            </div>
          </div>
        ),
      },
      { key: "provider", header: "Provider", sortable: true },
      { key: "serviceCategory", header: "Category", sortable: true },
      {
        key: "scheduledDate",
        header: "Scheduled",
        sortable: true,
        render: (b) => (
          <div className="text-sm">
            <p>{new Date(b.scheduledDate).toLocaleDateString()}</p>
            <p className="text-xs text-gray-500">{b.startTime}</p>
          </div>
        ),
      },
      {
        key: "duration",
        header: "Duration",
        sortable: true,
        render: (b) => `${b.duration}m`,
      },
      {
        key: "total",
        header: "Revenue",
        sortable: true,
        render: (b) => (
          <div className="text-sm">
            <p className="font-medium">ETB {b.total}</p>
            {b.discount > 0 && <p className="text-xs text-gray-500">-ETB {b.discount} disc.</p>}
          </div>
        ),
      },
      {
        key: "bookingStatus",
        header: "Status/Payment Status",
        sortable: true,
        render: (b) => (
          <StatusBadge status={b.bookingStatus} paymentStatus={b.paymentStatus} />
        ),
      },
      {
        key: "rating",
        header: "Rating",
        sortable: true,
        render: (b) =>
          b.rating ? (
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-400 fill-current" />
              <span className="text-sm">{b.rating}</span>
            </div>
          ) : (
            "—"
          ),
      },
      {
        key: "actions",
        header: "",
        sortable: false,
        render: (b) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setSelectedBookingId(b.id)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
              title="View details"
            >
              <Eye size={16} />
            </button>
            <div className="relative group">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                <MoreHorizontal size={16} />
              </button>
              <div className="absolute right-0 top-8 w-40 bg-white border rounded-xl shadow-xl hidden group-hover:block z-10">
                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">View</button>
                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Edit</button>
                <button className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Cancel</button>
              </div>
            </div>
          </div>
        ),
      },
    ],
    []
  );

  // ── UI ─────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bookings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage customer appointments, payments, and service providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast("info", "Export CSV")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
            title="Export CSV"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
            title="Refresh data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {/* <button className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary-dark transition">
            <Plus size={18} />
            <span className="hidden sm:inline">Create Booking</span>
            <span className="sm:hidden">New</span>
          </button> */}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          label="Total Bookings"
          value={String(statsData.total)}
          icon={<ShoppingBag size={18} />}
          iconBg="bg-secondary/10 text-secondary"
        />
        <KPICard
          label="Completed"
          value={String(statsData.completed)}
          icon={<CheckCircle size={18} />}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <KPICard
          label="Revenue"
          value={`ETB ${statsData.revenue.toLocaleString()}`}
          icon={<DollarSign size={18} />}
          iconBg="bg-green-100 text-green-600"
        />
        <KPICard
          label="Pending"
          value={String(statsData.pending)}
          icon={<AlertCircle size={18} />}
          iconBg="bg-yellow-100 text-yellow-600"
        />
        <KPICard
          label="Cancelled"
          value={String(statsData.cancelled)}
          icon={<X size={18} />}
          iconBg="bg-red-100 text-red-600"
        />
        <KPICard
          label="Today"
          value={String(statsData.today)}
          icon={<Calendar size={18} />}
          iconBg="bg-blue-100 text-blue-600"
        />
      </div>

      {/* Filter Section */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            Filters
          </h3>
          <button
            onClick={() => {
              setSearch("");
              setStatus("all");
              setPaymentStatus("all");
              setCategoryId("all");
              setProviderId("all");
              setDateFrom("");
              setDateTo("");
              setParams((p) => ({ ...p, page: 1 }));
            }}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            Clear all
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <SearchInput
              className="!w-full"
              value={search}
              onChange={(s) => {
                setSearch(s);
                setParams((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Search booking..."
            />
          </div>
          <CustomSelect
            className="!w-full"
            value={status}
            onChange={(s) => {
              setStatus(s);
              setParams((p) => ({ ...p, page: 1 }));
            }}
            options={[
              { value: "all", label: "Booking Status" },
              ...bookingStatuses.map((s) => ({
                value: s,
                label: s.replace(/_/g, " "),
              })),
            ]}
          />
          <CustomSelect
            className="!w-full"
            value={paymentStatus}
            onChange={(s) => {
              setPaymentStatus(s);
              setParams((p) => ({ ...p, page: 1 }));
            }}
            options={[
              { value: "all", label: "Payment Status" },
              ...paymentStatuses.map((s) => ({
                value: s,
                label: s.replace(/_/g, " "),
              })),
            ]}
          />
          <CustomSelect
            className="!w-full"
            value={categoryId}
            onChange={(s) => {
              setCategoryId(s);
              setParams((p) => ({ ...p, page: 1 }));
            }}
            options={[
              { value: "all", label: "Category" },
              ...categoryList.map((c) => ({
                value: String(c.id),
                label: c.name,
              })),
            ]}
          />
          <CustomSelect
            className="!w-full"
            value={providerId}
            onChange={(s) => {
              setProviderId(s);
              setParams((p) => ({ ...p, page: 1 }));
            }}
            options={[
              { value: "all", label: "Provider" },
              ...providerList.map((p) => ({
                value: String(p.id),
                label: p.name,
              })),
            ]}
          />
          {/* <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setParams((p) => ({ ...p, page: 1 }));
              }}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Start date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setParams((p) => ({ ...p, page: 1 }));
              }}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="End date"
            />
          </div> */}
        </div>
      </div>

      {/* Table - visible on medium screens and above */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <DataTable
          data={data?.data || []}
          columns={columns}
          loading={loading}
          emptyMessage="No bookings found"
          sortField={params.sortField}
          sortOrder={params.sortOrder}
          onSort={(field) =>
            setParams((p) => ({
              ...p,
              sortField: field,
              sortOrder: p.sortField === field && p.sortOrder === "asc" ? "desc" : "asc",
            }))
          }
        />
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data && data.data.length > 0 ? (
          data.data.map((booking) => (
            <MobileBookingCard key={booking.id} booking={booking} onView={setSelectedBookingId} />
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-lg font-medium">No bookings found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Pagination with info text */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {data?.meta && data.meta.total > 0
            ? `Showing ${(params.page - 1) * params.limit + 1}–${Math.min(params.page * params.limit, data.meta.total)} of ${data.meta.total} bookings`
            : "No bookings found"}
        </p>
        <Pagination
          currentPage={data?.meta?.page || 1}
          totalPages={data?.meta?.totalPages || 1}
          onPageChange={(page) => setParams((p) => ({ ...p, page }))}
        />
      </div>

      {/* Booking Detail Drawer */}
      {selectedBookingId && (
        <BookingDetailDrawer
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
        />
      )}
    </div>
  );
}