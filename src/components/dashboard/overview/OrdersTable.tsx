import { ArrowRight, ShoppingBag } from "lucide-react";
import { SkeletonChart, EmptyState } from "./LoadingStates";
import {
  formatCurrency,
  formatDate,
  statusClass,
  paymentStatusClass,
} from "./uiHelpers";
import type { AnalyticsRecentOrder } from "../../../types";

// interface Order {
//   id: string;
//   customer: string;
//   amount: number;
//   status: string;
//   paymentStatus: string;
//   vendors: string;
//   date: string;
// }

interface OrdersTableProps {
  loading: boolean;
  recentOrders: AnalyticsRecentOrder[];
  onNavigate?: (tab: any) => void;
  isSuperAdmin: boolean;
}

export default function OrdersTable({
  loading,
  recentOrders,
  onNavigate,
  isSuperAdmin,
}: OrdersTableProps) {
  const hasRecentOrdersData = recentOrders.length > 0;

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-2xl sm:rounded-3xl
        border border-gray-200/60
        bg-white/90
        backdrop-blur-xl
        shadow-[0_10px_40px_rgba(0,0,0,0.06)]
        p-3 sm:p-4 md:p-5 lg:p-6
        w-full min-w-0
      "
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-purple-100 blur-3xl opacity-40 pointer-events-none" />

      {loading ? (
        <SkeletonChart height="h-[260px] sm:h-[320px] lg:h-[360px]" />
      ) : (
        <>
          {/* Header */}
          <div
            className="
              relative
              flex flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-3
              mb-4 sm:mb-5
            "
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="
                    flex items-center justify-center
                    h-9 w-9 sm:h-10 sm:w-10
                    rounded-2xl
                    bg-gradient-to-br
                    from-[#6750A4]
                    to-purple-500
                    shadow-lg shadow-purple-500/20
                  "
                >
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>

                <div className="min-w-0">
                  <h3
                    className="
                      text-sm
                      xs:text-base
                      sm:text-lg
                      md:text-xl
                      font-bold
                      tracking-tight
                      text-gray-900
                    "
                  >
                    Recent Orders
                  </h3>

                  <p
                    className="
                      text-[11px]
                      xs:text-xs
                      sm:text-sm
                      text-gray-500
                      mt-0.5
                    "
                  >
                    Latest customer purchases and transactions
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  isSuperAdmin ? "masterOrders" : "companyOrders"
                )
              }
              className="
                group
                inline-flex items-center gap-2
                self-start sm:self-auto
                px-4 py-2
                rounded-xl
                bg-purple-50
                hover:bg-[#6750A4]
                text-[#6750A4]
                hover:text-white
                text-xs sm:text-sm
                font-semibold
                transition-all duration-200
                active:scale-95
              "
            >
              View all

              <ArrowRight
                className="
                  h-4 w-4
                  transition-transform duration-200
                  group-hover:translate-x-1
                "
              />
            </button>
          </div>

          {/* MOBILE CARDS */}
          <div className="flex flex-col gap-3 md:hidden">
            {hasRecentOrdersData ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="
                    rounded-2xl
                    border border-gray-100
                    bg-gradient-to-br from-white to-gray-50/60
                    p-4
                    shadow-sm
                    hover:shadow-md
                    transition-all duration-200
                  "
                >
                  {/* Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="
                          text-xs
                          font-bold
                          text-[#6750A4]
                          truncate
                        "
                      >
                        {order.id}
                      </p>

                      <h4
                        className="
                          mt-1
                          text-sm
                          font-semibold
                          text-gray-900
                          truncate
                        "
                      >
                        {order.customer}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className="
                          text-sm
                          font-bold
                          text-gray-900
                        "
                      >
                        {formatCurrency(order.amount)}
                      </p>

                      <p
                        className="
                          text-[11px]
                          text-gray-500
                          mt-0.5
                        "
                      >
                        {formatDate(order.date)}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span
                      className={`
                        inline-flex items-center
                        px-2.5 py-1
                        rounded-full
                        text-[11px]
                        font-semibold
                        ${statusClass(order.status)}
                      `}
                    >
                      {order.status}
                    </span>

                    <span
                      className={`
                        inline-flex items-center
                        px-2.5 py-1
                        rounded-full
                        text-[11px]
                        font-semibold
                        ${paymentStatusClass(order.paymentStatus)}
                      `}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>

                  {/* Companies */}
                  <div className="mt-4">
                    <p className="text-[11px] uppercase text-gray-400 font-semibold tracking-wide">
                      Companies
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-gray-600
                        line-clamp-2
                      "
                    >
                      {order.vendors}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                compact
                title="No recent orders"
                description="New orders will appear here as soon as customers start placing them."
              />
            )}
          </div>

          {/* TABLET + DESKTOP TABLE */}
          {hasRecentOrdersData && (
            <div
              className="
                hidden md:block
                overflow-hidden
                rounded-2xl
                border border-gray-100
              "
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr
                      className="
                        bg-gradient-to-r
                        from-gray-50
                        to-purple-50/40
                        border-b border-gray-100
                      "
                    >
                      {[
                        "Order",
                        "Customer",
                        "Amount",
                        "Status",
                        "Payment",
                        "Companies",
                        "Date",
                      ].map((head) => (
                        <th
                          key={head}
                          className="
                            text-left
                            px-4 lg:px-5
                            py-4
                            text-[11px]
                            lg:text-xs
                            font-bold
                            tracking-wider
                            uppercase
                            text-gray-500
                            whitespace-nowrap
                          "
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="
                          group
                          hover:bg-purple-50/30
                          transition-all duration-200
                        "
                      >
                        <td className="px-4 lg:px-5 py-4">
                          <span
                            className="
                              text-sm lg:text-[15px]
                              font-bold
                              text-[#6750A4]
                              whitespace-nowrap
                            "
                          >
                            {order.id}
                          </span>
                        </td>

                        <td
                          className="
                            px-4 lg:px-5 py-4
                            text-sm lg:text-[15px]
                            font-medium
                            text-gray-800
                            whitespace-nowrap
                          "
                        >
                          {order.customer}
                        </td>

                        <td
                          className="
                            px-4 lg:px-5 py-4
                            text-sm lg:text-[15px]
                            font-bold
                            text-gray-900
                            whitespace-nowrap
                          "
                        >
                          {formatCurrency(order.amount)}
                        </td>

                        <td className="px-4 lg:px-5 py-4 whitespace-nowrap">
                          <span
                            className={`
                              inline-flex items-center
                              px-3 py-1
                              rounded-full
                              text-xs
                              font-semibold
                              ${statusClass(order.status)}
                            `}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td className="px-4 lg:px-5 py-4 whitespace-nowrap">
                          <span
                            className={`
                              inline-flex items-center
                              px-3 py-1
                              rounded-full
                              text-xs
                              font-semibold
                              ${paymentStatusClass(order.paymentStatus)}
                            `}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>

                        <td
                          className="
                            px-4 lg:px-5 py-4
                            text-sm
                            text-gray-600
                            max-w-[220px]
                            truncate
                          "
                        >
                          {order.vendors}
                        </td>

                        <td
                          className="
                            px-4 lg:px-5 py-4
                            text-right
                            text-sm
                            text-gray-500
                            whitespace-nowrap
                          "
                        >
                          {formatDate(order.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}