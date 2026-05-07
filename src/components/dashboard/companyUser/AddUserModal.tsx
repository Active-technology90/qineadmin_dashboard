import { X, Loader2, ChevronDown, User as UserIcon } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "../../../types";

// --------------------------------------------------------------
// Avatar component (unchanged)
// --------------------------------------------------------------
const UserAvatar = ({
  user,
  size = "md",
}: {
  user: User;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-xl",
  };
  const initial = user.first_name?.[0] || user.email[0]?.toUpperCase() || "?";
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0`}
    >
      {user.profile_image ? (
        <img
          src={user.profile_image}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-gray-600 font-medium">{initial}</span>
      )}
    </div>
  );
};

// --------------------------------------------------------------
// Main modal component – now supports 'delivery' role
// --------------------------------------------------------------
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  searching: boolean;
  searchResults: User[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  selectedRole: "admin" | "staff" | "viewer" | "delivery"; // ✅ added 'delivery'
  onRoleChange: (role: "admin" | "staff" | "viewer" | "delivery") => void; // ✅
  adding: boolean;
  onAdd: () => void;
}

export function AddUserModal({
  isOpen,
  onClose,
  searching,
  searchResults,
  searchTerm,
  onSearchChange,
  selectedUser,
  onSelectUser,
  selectedRole,
  onRoleChange,
  adding,
  onAdd,
}: AddUserModalProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDropdownIndex(-1);
  }, [searchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || searchResults.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setDropdownIndex((prev) => (prev + 1) % searchResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setDropdownIndex(
          (prev) => (prev - 1 + searchResults.length) % searchResults.length,
        );
      } else if (e.key === "Enter" && dropdownIndex >= 0) {
        e.preventDefault();
        const user = searchResults[dropdownIndex];
        if (user) handleSelectUser(user);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    },
    [showDropdown, searchResults, dropdownIndex],
  );

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    onSearchChange(
      `${user.first_name || ""} ${user.last_name || ""} (${user.email})`.trim(),
    );
    setShowDropdown(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add team member
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Search by email or phone number
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Search input with live suggestions */}
          <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Search user <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Email or phone number..."
                value={searchTerm}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowDropdown(true);
                  onSelectUser(null);
                  setDropdownIndex(-1);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-20 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none"
                aria-autocomplete="list"
                aria-expanded={showDropdown}
              />

              {/* Clear button */}
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange("");
                    onSelectUser(null);
                    setShowDropdown(false);
                  }}
                  className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <ChevronDown
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Dropdown suggestions */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute z-20 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-64 overflow-y-auto"
              >
                {searching ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    <p className="mt-1 text-sm">Searching...</p>
                  </div>
                ) : searchResults.length === 0 && searchTerm.trim() !== "" ? (
                  <div className="p-6 text-center">
                    <UserIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No users found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try a different email or phone
                    </p>
                  </div>
                ) : (
                  searchResults.map((user, idx) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0 ${
                        idx === dropdownIndex
                          ? "bg-indigo-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <UserAvatar user={user} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name || "—"} {user.last_name || ""}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.phone_number && (
                          <p className="text-xs text-gray-400">
                            {user.phone_number}
                          </p>
                        )}
                      </div>
                      {selectedUser?.id === user.id && (
                        <span className="text-secondary text-xs font-medium">
                          Selected
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected user preview */}
          {selectedUser && (
            <div className="bg-gradient-to-r from-indigo-50/50 to-white rounded-xl p-4 flex items-center gap-4 border border-indigo-100 shadow-sm">
              <UserAvatar user={selectedUser} size="lg" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {selectedUser.first_name || "—"}{" "}
                  {selectedUser.last_name || ""}
                </p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                {selectedUser.phone_number && (
                  <p className="text-xs text-gray-400">
                    {selectedUser.phone_number}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  onSelectUser(null);
                  onSearchChange("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                aria-label="Remove selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Role selection – now includes Delivery */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assign role <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value as any)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none bg-white appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "1.25rem",
              }}
            >
              <option value="admin">
                Admin – Full access to company management
              </option>
              <option value="staff">Staff – Manage products and orders</option>
              <option value="delivery">
                Delivery – Manage deliveries
              </option>{" "}
              {/* ✅ Uncommented and added */}
              <option value="viewer">Viewer – Read‑only access</option>
            </select>
            <p className="text-xs text-gray-400 mt-1.5">
              Roles can be changed later without affecting user data.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={!selectedUser || adding}
            className="px-5 py-2.5 bg-secondary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm font-medium flex items-center gap-2"
          >
            {adding && <Loader2 className="h-4 w-4 animate-spin" />}
            {adding ? "Adding..." : "Add user"}
          </button>
        </div>
      </div>
    </div>
  );
}
