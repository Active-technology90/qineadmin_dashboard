import { Search, Edit, Trash2, Loader2, User as UserIcon } from "lucide-react";
import { TableControls } from "../../ui/TableControls";

interface CompanyUsersTableProps {
  users: any[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;

  pageSize: number;
  onPageSizeChange: (size: number) => void;

  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
  currentUser: any;
  isAdmin: boolean;
}

export function CompanyUsersTable({
  users,
  loading,
  search,
  onSearchChange,

  pageSize,
  onPageSizeChange,

  onEdit,
  onDelete,
  currentUser,
  isAdmin,
}: CompanyUsersTableProps) {
  // const filteredUsers = (users || []).filter((u) =>
  //   `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
  //   u.email.toLowerCase().includes(search.toLowerCase())
  // );

  // ✅ Compare actual user_id (not the membership id)
  const isSelf = (user: any) => user.user_id === currentUser?.id;

  return (
    <>
     {/* <div className="mt-5">
  <TableControls
    pageSize={pageSize}
    onPageSizeChange={onPageSizeChange} */}
  {/* > */}
    {/* SEARCH INSIDE CHILDREN */}
    {/* <div className="relative">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="
          w-full pl-10 pr-4 py-2.5
          border border-gray-200
          rounded-xl
          focus:outline-none
          focus:ring-2 focus:ring-[#6750A4]
          focus:border-[#6750A4]
        "
      />
    </div> */}
  {/* </TableControls>
</div> */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                  <p className="mt-2 text-gray-500">Loading users...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-500">
                  <UserIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No users found</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-indigo-600 font-semibold text-sm">
                            {user.first_name?.[0] ||
                              user.email[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {user.username || `${user.first_name} ${user.last_name}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isAdmin && (
                      <button
                        onClick={() => onEdit(user)}
                        className="text-indigo-600 hover:text-indigo-800 mr-3 transition"
                        title="Edit role"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(user)}
                        disabled={isSelf(user)}
                        className={`transition ${
                          isSelf(user)
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-red-600 hover:text-red-800"
                        }`}
                        title={
                          isSelf(user)
                            ? "You cannot delete yourself"
                            : "Remove user"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
