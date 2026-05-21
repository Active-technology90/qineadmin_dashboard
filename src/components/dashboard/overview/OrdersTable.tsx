// src/components/admin/overview/components/OrdersTable.tsx
import { SkeletonChart, EmptyState } from "./LoadingStates";
import { formatCurrency, formatDate, statusClass, paymentStatusClass } from "./uiHelpers";

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: string;
  paymentStatus: string;
  vendors: string;
  date: string;
}

interface OrdersTableProps {
  loading: boolean;
  recentOrders: Order[];
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
        bg-white
        rounded-xl sm:rounded-2xl
        p-3 sm:p-4 lg:p-5
        shadow-sm border border-gray-100
        w-full min-w-0
      "
    >
      {loading ? (
        <SkeletonChart height="h-[280px] sm:h-[320px]" />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-sm font-semibold text-gray-700">
              Recent Orders
            </h3>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(isSuperAdmin ? "masterOrders" : "companyOrders")
              }
              className="
                text-xs font-medium text-[#6750A4]
                hover:underline cursor-pointer
                self-start sm:self-auto
              "
            >
              View all
            </button>
          </div>

          {/* Table */}
          {hasRecentOrdersData ? (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="min-w-[700px] sm:min-w-full w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 pr-3 text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Order
                    </th>
                    <th className="text-left py-2.5 px-3 text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Customer
                    </th>
                    <th className="text-left py-2.5 px-3 text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Amount
                    </th>
                    <th className="text-left py-2.5 px-3 text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left py-2.5 px-3 text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Payment
                    </th>
                    <th className="text-left py-2.5 px-3 text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Companies
                    </th>
                    <th className="text-right py-2.5 pl-3 text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <span className="text-xs sm:text-sm font-semibold text-indigo-600 whitespace-nowrap">
                          {order.id}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                        {order.customer}
                      </td>

                      <td className="py-2.5 px-3 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(order.amount)}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full ${statusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full ${paymentStatusClass(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                        {order.vendors}
                      </td>

                      <td className="py-2.5 pl-3 text-right text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(order.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              compact
              title="No recent orders"
              description="New orders will appear here as soon as customers start placing them."
            />
          )}
        </>
      )}
    </div>
  );
}