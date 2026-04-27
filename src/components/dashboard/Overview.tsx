// src/components/admin/Overview.tsx
import { Package, Users, ShoppingBag, CreditCard, TrendingUp, TrendingDown } from "lucide-react";

export default function Overview() {
  // Static analytics data (replace with real numbers later)
  const data = {
    products: 1247,
    users: 342,
    orders: 856,
    payments: {
      total: 2847500,
      change: 12.5,
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount);
  };

  const cards = [
    {
      title: "Total Products",
      value: data.products.toLocaleString(),
      icon: Package,
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Company Users",
      value: data.users.toLocaleString(),
      icon: Users,
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      title: "Total Orders",
      value: data.orders.toLocaleString(),
      icon: ShoppingBag,
      bgLight: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Total Payments",
      value: formatCurrency(data.payments.total),
      icon: CreditCard,
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
      trend: data.payments.change,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, idx) => (
          <div
            key={idx}
           className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
           <div className={`${card.bgLight} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className={`h-6 w-6 ${card.textColor}`} />
            </div>
           <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {card.title}
            </h3>
            <div className="flex items-baseline justify-between mt-2">
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              {card.trend !== undefined && (
                <span className={`flex items-center text-[11px] font-medium ${card.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {card.trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(card.trend)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}