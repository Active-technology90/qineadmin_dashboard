// src/components/admin/companyUser/CompanyUsers.tsx
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useCompanyUsers } from "../../../hooks/useCompanyUsers";
import { useAddCompanyUser } from "../../../hooks/useAddCompanyUser";
import { useUpdateUserRole } from "../../../hooks/useUpdateUserRole";
import { useDeleteCompanyUser } from "../../../hooks/useDeleteCompanyUser";
import { searchUsers } from "../../../services/api";
import { useDebounce } from "../../../hooks/useDebounce";
import type { User } from "../../../types";
import { UserPlus } from "lucide-react";
import { Pagination } from "../../ui/Pagination";
import { ErrorView } from "../../ui/ErrorView";
import { CompanyUsersTable } from "./CompanyUsersTable";
import { AddUserModal } from "./AddUserModal";
import { EditUserModal } from "./EditUserModal";
import { DeleteUserModal } from "./DeleteUserModal";
import { CompanySelector } from "../company-products/CompanySelector";
import { useReadOnly } from "../AdminDashboard";

export default function CompanyUsers() {
  const { user: currentUser } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();
  const readOnly = useReadOnly(); // true for viewers

  // Company from context
  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";

  const isSuperAdmin = !currentUser?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  // Derive the current user’s role for the selected company
  const currentUserRole = useMemo(() => {
    if (!currentUser || !companySlug) return null;
    if (isSuperAdmin) return "superAdmin";
    const membership = currentUser.memberships?.find(
      (m: any) => m.company_slug === companySlug,
    );
    return membership?.role || null;
  }, [currentUser, companySlug, isSuperAdmin]);

  // Viewers can see the user list, but cannot manage (add/edit/delete)
  const canViewUsers =
    isSuperAdmin ||
    currentUserRole === "admin" ||
    currentUserRole === "staff" ||
    readOnly;
  const canManageUsers =
    (isSuperAdmin || currentUserRole === "admin") && !readOnly;

  // Company users hook
  const { users, loading, error, refetch } = useCompanyUsers(companySlug);
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredUsers = (users || []).filter(
    (u: any) =>
      `${u.first_name} ${u.last_name}`
        .toLowerCase()
        .includes(tableSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(tableSearch.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const { addUser } = useAddCompanyUser();
  const { updateUserRole } = useUpdateUserRole();
  const { deleteUser } = useDeleteCompanyUser();

  // Add user modal state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "staff" | "viewer" | "delivery"
  >("staff");
  const [showAddModal, setShowAddModal] = useState(false);
  const debouncedQuery = useDebounce(searchTerm, 500);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<"admin" | "staff" | "viewer">("staff");
  const [updating, setUpdating] = useState(false);

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleAddUser = async () => {
    if (!companySlug || !selectedUser) return;
    setAdding(true);
    try {
      await addUser(companySlug, selectedUser.email, selectedRole);
      setShowAddModal(false);
      setSelectedUser(null);
      setSearchTerm("");
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

  // Permission guard for viewing – if user cannot even view, show access denied.
  if (!canViewUsers) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="text-red-600 mb-2">Access Denied</div>
        <p className="text-gray-500">
          You do not have permission to view company users.
        </p>
      </div>
    );
  }

  if (showSelector) {
    return (
      <CompanySelector
        companies={companies}
        subtitle="Select a company to manage users"
        isLoading={isLoadingCompanies}
        onSelect={(slug, name) => {
          const membership = currentUser?.memberships?.find(
            (m: any) => m.company_slug === slug,
          );
          const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");
          switchCompany({ slug, name, role });
        }}
        onBack={clearCompany}
      />
    );
  }

  if (error && !companySlug) {
    return <ErrorView error={error} onRetry={() => refetch?.()} />;
  }

  if (!companySlug) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        No company selected. Please select a company to manage users.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#6750A4]">Company Users</h2>
          <p className="text-sm text-gray-500 mt-1">
            Managing:{" "}
            <span className="text-indigo-600 font-medium">{companyName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {isSuperAdmin && (
            <button
              onClick={clearCompany}
              className="px-4 py-2 rounded-full border text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
            >
              Switch
            </button>
          )}
          {canManageUsers && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-full bg-secondary text-white hover:opacity-90 flex items-center gap-2 shadow-sm transition"
            >
              <UserPlus className="h-4 w-4" /> Add User
            </button>
          )}
        </div>
      </div>

      <CompanyUsersTable
        users={paginatedUsers}
        loading={loading}
        search={tableSearch}
        onSearchChange={(value) => {
          setTableSearch(value);
          setCurrentPage(1);
        }}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        isAdmin={canManageUsers} // edit/delete controls only for managers
        currentUser={currentUser}
        onEdit={(user) => {
          setEditingUser(user);
          setNewRole(user.role || "staff");
        }}
        onDelete={setDeletingUser}
      />

      <AddUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedUser(null);
          setSearchTerm("");
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

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
