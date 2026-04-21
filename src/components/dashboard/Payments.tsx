import { useState } from 'react';
import { Search, Download } from 'lucide-react';

interface Payment {
  id: number;
  order_number: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([
    { id: 1, order_number: 'QINE-1001', amount: 4200, method: 'Chapa', status: 'completed', date: '2024-03-15' },
    { id: 2, order_number: 'QINE-1002', amount: 8400, method: 'Bank Transfer', status: 'completed', date: '2024-03-14' },
    { id: 3, order_number: 'QINE-1003', amount: 1200, method: 'Cash on Delivery', status: 'pending', date: '2024-03-13' },
  ]);
  const [search, setSearch] = useState('');

  const filteredPayments = payments.filter(p =>
    p.order_number.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Payments</h2>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search payments..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (ETB)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.order_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.amount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.method}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900">
                    <Download className="h-4 w-4" />
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