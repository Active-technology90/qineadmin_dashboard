import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/authContext';
import { useCompanySelection } from '../../../hooks/useCompanySelection';
import { useCompanyUsers } from '../../../hooks/useCompanyUsers';
import { useAddCompanyUser } from '../../../hooks/useAddCompanyUser';
import { useUpdateUserRole } from '../../../hooks/useUpdateUserRole';
import { useDeleteCompanyUser } from '../../../hooks/useDeleteCompanyUser';
import { searchUsers } from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';
import type { User } from '../../../types';
import { UserPlus } from 'lucide-react';
import { ErrorView } from '../../ui/ErrorView';
import { CompanyUsersTable } from './CompanyUsersTable';
import { AddUserModal } from './AddUserModal';
import { EditUserModal } from './EditUserModal';
import { DeleteUserModal } from './DeleteUserModal';
import { CompanySelector } from '../company-products/CompanySelector';
import { NoCompanyView } from '../company-products/NoCompanyView';

export default function CompanyUsers() {
  const { user: currentUser } = useAuth();
  const memberships = currentUser?.memberships || [];
  const isSuperAdmin = memberships.length === 0;
  const isCompanyAdmin = memberships.some((m: any) => m.role === 'admin');
  const isCompanyStaff = memberships.some((m: any) => m.role === 'staff') && !isCompanyAdmin;

  const {
    selectedCompany,
    showSelector,
    companies,
    isLoadingCompanies,
    selectCompany,
    resetCompany,
  } = useCompanySelection(currentUser);

  const companySlug = selectedCompany?.slug ?? null;
  const companyName = selectedCompany?.name ?? '';

  const { users, loading, error, refetch } = useCompanyUsers(companySlug);
  const { addUser } = useAddCompanyUser();
  const { updateUserRole } = useUpdateUserRole();
  const { deleteUser } = useDeleteCompanyUser();

  // Add user modal state – live search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "staff" | "viewer">("staff");
  const [showAddModal, setShowAddModal] = useState(false);
  const debouncedQuery = useDebounce(searchTerm, 500);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<"admin" | "staff" | "viewer">("staff");
  const [updating, setUpdating] = useState(false);

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const [tableSearch, setTableSearch] = useState('');

  // Fetch search results when debounced query changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await searchUsers(debouncedQuery);
        setSearchResults(res.data.results || []);
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };
    fetchSearchResults();
  }, [debouncedQuery]);

  // Permission guard: only super admin or company admin can access
  if (!isSuperAdmin && !isCompanyAdmin) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="text-red-600 mb-2">Access Denied</div>
        <p className="text-gray-500">You do not have permission to manage company users.</p>
      </div>
    );
  }

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
    if (!companySlug || !selectedUser) return;
    setAdding(true);
    try {
      await addUser(companySlug, selectedUser.email, selectedRole);
      setShowAddModal(false);
      setSelectedUser(null);
      setSearchTerm('');
      setSelectedRole("staff");
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleEditUser = async () => {
    if (!companySlug || !editingUser) return;
    setUpdating(true);
    try {
      await updateUserRole(companySlug, editingUser.user_id, newRole);
      setEditingUser(null);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!companySlug || !deletingUser) return;
    setDeleting(true);
    try {
      await deleteUser(companySlug, deletingUser.user_id);
      setDeletingUser(null);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Company Users</h2>
          <p className="text-sm text-gray-500 mt-1">
            Managing: <span className="text-indigo-600 font-medium">{companyName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={resetCompany}
              className="px-4 py-2 rounded-full border text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
            >
              Switch
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-full bg-secondary text-white hover:opacity-90 flex items-center gap-2 shadow-sm transition"
          >
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      <CompanyUsersTable
        users={users}
        loading={loading}
        search={tableSearch}
        onSearchChange={setTableSearch}
        onEdit={(user) => {
          setEditingUser(user);
          setNewRole(user.role || "staff");
        }}
        onDelete={setDeletingUser}
        currentUser={currentUser}
        isAdmin={isCompanyAdmin}
      />

      <AddUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedUser(null);
          setSearchTerm('');
        }}
        searching={searching}
        searchResults={searchResults}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        adding={adding}
        onAdd={handleAddUser}
      />

      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        newRole={newRole}
        onRoleChange={setNewRole}
        updating={updating}
        onClose={() => setEditingUser(null)}
        onSave={handleEditUser}
      />

      <DeleteUserModal
        isOpen={!!deletingUser}
        user={deletingUser}
        deleting={deleting}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}