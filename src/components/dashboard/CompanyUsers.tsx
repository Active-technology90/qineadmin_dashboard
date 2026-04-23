import { useState } from 'react';

import { useAuth } from '../../context/authContext';
import { useCompanySelection } from '../../hooks/useCompanySelection';
import { useCompanyUsers } from '../../hooks/useCompanyUsers';

import { CompanySelector } from './company-products/CompanySelector';
import { NoCompanyView } from './company-products/NoCompanyView';
import { ErrorView } from '../ui/ErrorView';
import { Search, Edit, Trash2, UserPlus } from 'lucide-react';
import { useAddCompanyUser } from "../../hooks/useAddCompanyUser";

// interface User {
//   id: number;
//   name: string;
//   email: string;
//   role: string;
//   status: 'active' | 'inactive';
// }

export default function CompanyUsers() {
  
  const { user } = useAuth();

const {
  selectedCompany,
  showSelector,
  companies,
  isLoadingCompanies,
  selectCompany,
  resetCompany,
} = useCompanySelection(user);

const companySlug = selectedCompany?.slug ?? null;
// const companyName = selectedCompany?.name ?? '';

const { users, loading, error, refetch } = useCompanyUsers(companySlug);

const { addUser } = useAddCompanyUser();

const [showModal, setShowModal] = useState(false);
const [selectedEmail, setSelectedEmail] = useState("");
const [selectedRole, setSelectedRole] = useState<"admin" | "staff" | "viewer">("staff");
const [adding, setAdding] = useState(false);
 
  const [search, setSearch] = useState('');

const filteredUsers = (users || []).filter(u =>
  `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
  u.email.toLowerCase().includes(search.toLowerCase())
);
if (showSelector) {
  return (
    <CompanySelector
      companies={companies}
      isLoading={isLoadingCompanies}
      onSelect={selectCompany}
      onBack={resetCompany}
    />
  );
}

if (error && !companySlug) {
  return <ErrorView error={error} onRetry={() => window.location.reload()} />;
}

if (!companySlug) {
  return <NoCompanyView onSelectCompany={resetCompany} />;
}

const handleAddUser = async () => {
  if (!companySlug || !selectedEmail) return;

  try {
    setAdding(true);

    await addUser(companySlug, selectedEmail, selectedRole);

    setShowModal(false);
    setSelectedEmail("");
    setSelectedRole("staff");

    await refetch();  
  } catch (err) {
    console.error(err);
  } finally {
    setAdding(false);
  }
};

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Company Users</h2>
       <button
  onClick={() => setShowModal(true)}
  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
>
          <UserPlus className="h-4 w-4" /> Add User
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
  {loading ? (
    <tr>
      <td colSpan={5} className="text-center py-4">
        Loading users...
      </td>
    </tr>
  ) : (
   (filteredUsers || []).map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
               <span
  className={`px-2 inline-flex text-xs font-semibold rounded-full ${
    user.is_active
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }`}
>
  {user.is_active ? 'active' : 'inactive'}
</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))
  )}
          </tbody>
        </table>
      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[400px] p-6 rounded-xl">

      <h2 className="text-lg font-bold mb-4">
        Add User to Company
      </h2>

      {/* USER SELECT */}
  <input
  type="email"
  placeholder="Enter user email"
  value={selectedEmail}
  onChange={(e) => setSelectedEmail(e.target.value)}
  className="w-full border p-2 rounded mb-3"
/>

      {/* ROLE SELECT */}
      <select
        className="w-full border p-2 rounded mb-4"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as any)}
      >
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
        <option value="viewer">Viewer</option>
      </select>

      {/* ACTIONS */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowModal(false)}
          className="px-3 py-1 border rounded"
        >
          Cancel
        </button>

        <button
          onClick={handleAddUser}
          disabled={adding}
          className="px-3 py-1 bg-indigo-600 text-white rounded"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

