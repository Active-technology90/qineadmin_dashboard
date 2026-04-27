
import { useState } from 'react';


import { useAuth } from '../../context/authContext';
import { useCompanySelection } from '../../hooks/useCompanySelection';
import { useCompanyUsers } from '../../hooks/useCompanyUsers';

import { CompanySelector } from './company-products/CompanySelector';
import { NoCompanyView } from './company-products/NoCompanyView';
import { ErrorView } from '../ui/ErrorView';
import { Search, Edit, Trash2, UserPlus } from 'lucide-react';
import { useAddCompanyUser } from "../../hooks/useAddCompanyUser";
import { useUpdateUserRole } from "../../hooks/useUpdateUserRole";
import { useDeleteCompanyUser } from "../../hooks/useDeleteCompanyUser";
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
const companyName = selectedCompany?.name ?? '';

const { users, loading, error, refetch } = useCompanyUsers(companySlug);

const { addUser } = useAddCompanyUser();

const [showModal, setShowModal] = useState(false);
const [selectedEmail, setSelectedEmail] = useState("");
const [selectedRole, setSelectedRole] = useState<"admin" | "staff" | "viewer">("staff");
const [adding, setAdding] = useState(false);
const { updateUserRole } = useUpdateUserRole();

const [editingUser, setEditingUser] = useState<any>(null);
const [deletingUser, setDeletingUser] = useState<any>(null);
const [deleting, setDeleting] = useState(false);
const [newRole, setNewRole] = useState<"admin" | "staff" | "viewer">("staff");
const [updating, setUpdating] = useState(false);
const { deleteUser } = useDeleteCompanyUser();
 
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
     <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
       <h2 className="text-xl font-bold text-gray-900">
  Company Users
</h2>

<p className="text-sm text-gray-500 mt-1">
  Managing: <span className="text-indigo-600 font-medium">{companyName}</span>
</p>
<div className="flex items-center gap-2">
      <button
  onClick={resetCompany}
  className="px-4 py-2 rounded-full border text-gray-700 hover:bg-gray-50 flex items-center gap-2"
>
  Switch
</button> 

       <button
  onClick={() => setShowModal(true)}
className="px-4 py-2 rounded-full bg-secondary text-white hover:opacity-90 flex items-center gap-2 shadow-sm"
>
          <UserPlus className="h-4 w-4" /> Add User
        </button>
  
</div>
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
                  <button
  onClick={() => {
    setEditingUser(user);
    setNewRole(user.role || "staff");
  }}
  className="text-indigo-600 hover:text-indigo-900 mr-3"
>
  <Edit className="h-4 w-4" />
</button>
                 <button
 onClick={() => {
  setDeletingUser(user);
}}
  className="text-red-600 hover:text-red-900"
>
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
    <div className="bg-white w-[420px] p-6 rounded-2xl shadow-lg">

     <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Add User to Company
      </h2>

      {/* USER SELECT */}
  <input
  type="email"
  placeholder="Enter user email"
  value={selectedEmail}
  onChange={(e) => setSelectedEmail(e.target.value)}
  className="w-full border px-3 py-2 rounded-full mb-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
/>

      {/* ROLE SELECT */}
      <select
        className="w-full border px-3 py-2 rounded-full mb-4 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as any)}
      >
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
        <option value="viewer">Viewer</option>
      </select>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => setShowModal(false)}
         className="px-4 py-2 rounded-full border text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={handleAddUser}
          disabled={adding}
         className="px-4 py-2 rounded-full bg-secondary text-white hover:opacity-90"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  </div>
)}
{editingUser && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[400px] p-6 rounded-2xl shadow-lg">

      <h2 className="text-lg font-semibold mb-4">
        Edit Role for {editingUser.first_name}
      </h2>

      <select
        value={newRole}
        onChange={(e) => setNewRole(e.target.value as any)}
        className="w-full border px-3 py-2 rounded-full mb-4"
      >
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
        <option value="viewer">Viewer</option>
      </select>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setEditingUser(null)}
          className="px-4 py-2 border rounded-full"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            if (!companySlug) return;

            try {
              setUpdating(true);

              await updateUserRole(
                companySlug,
                editingUser.id,
                newRole
              );

              setEditingUser(null);

              await refetch(); // 🔥 refresh list
            } catch (err) {
              console.error(err);
            } finally {
              setUpdating(false);
            }
          }}
          className="px-4 py-2 bg-secondary text-white rounded-full"
        >
          {updating ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  </div>
)}
{deletingUser && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[400px] p-6 rounded-2xl shadow-lg">

      <h2 className="text-lg font-semibold mb-4">
        Delete User
      </h2>

      <p className="text-gray-600 mb-6">
        Are you sure you want to delete{" "}
        <span className="font-semibold">
          {deletingUser.first_name} {deletingUser.last_name}
        </span>?
      </p>

      <div className="flex justify-end gap-3">

        <button
          onClick={() => setDeletingUser(null)}
          className="px-4 py-2 border rounded-full"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            if (!companySlug) return;

            try {
              setDeleting(true);

              await deleteUser(companySlug, deletingUser.id);

              setDeletingUser(null);

              await refetch();
            } catch (err) {
              console.error(err);
            } finally {
              setDeleting(false);
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-full"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>

      </div>
    </div>
  </div>
)}
    </div>
  );
}
