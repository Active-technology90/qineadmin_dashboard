import { useState } from 'react';
import { Search, Eye } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  customer: string;
  total: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  date: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([
    { id: 1, order_number: 'QINE-1001', customer: 'John Doe', total: 4200, status: 'completed', date: '2024-03-15' },
    { id: 2, order_number: 'QINE-1002', customer: 'Jane Smith', total: 8400, status: 'paid', date: '2024-03-14' },
    { id: 3, order_number: 'QINE-1003', customer: 'Bob Johnson', total: 1200, status: 'pending', date: '2024-03-13' },
  ]);
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.customer.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Orders</h2>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (ETB)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.total.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900">
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}