import {  Edit, Trash2, Loader2, User as UserIcon } from "lucide-react";
// import { TableControls } from "../../ui/TableControls";

interface CompanyUsersTableProps {
  users: any[];
  loading: boolean;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
  isAdmin: boolean;
  currentUser: any;
}

export function CompanyUsersTable({
  users,
  loading,
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
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="min-w-[640px] sm:min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm z-10">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  User
                </span>
              </th>
              <th className="px-6 py-4 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Email
                </span>
              </th>
              <th className="px-6 py-4 text-left text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Role
                </span>
              </th>
              {isAdmin && (
                <th className="px-6 py-4 text-right text-[10px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Actions
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 sm:py-12">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto text-indigo-500" />
                  <p className="mt-2 text-xs sm:text-sm text-gray-500">Loading users...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 sm:py-12 text-gray-500">
                  <UserIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs sm:text-sm">No users found</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-indigo-600 font-semibold text-[10px] sm:text-sm">
                            {user.first_name?.[0] ||
                              user.email[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                        {user.username || `${user.first_name} ${user.last_name}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {isAdmin && (
                      <button
                        onClick={() => onEdit(user)}
                        className="text-indigo-600 hover:text-indigo-800 mr-2 sm:mr-3 transition p-1 rounded-md hover:bg-indigo-50"
                        title="Edit role"
                      >
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(user)}
                        disabled={isSelf(user)}
                        className={`transition p-1 rounded-md ${
                          isSelf(user)
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-red-600 hover:text-red-800 hover:bg-red-50"
                        }`}
                        title={
                          isSelf(user)
                            ? "You cannot delete yourself"
                            : "Remove user"
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
