import { X, Mail, Shield, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';


// Reusable Avatar component – kept consistent with AddUserModal
const UserAvatar = ({ user, size = 'md' }: { user: any; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
  };
  const initial = user.first_name?.[0] || user.email[0]?.toUpperCase() || '?';

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0`}>
      {user.profile_image ? (
        <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-secondary font-bold">{initial}</span>
      )}
    </div>
  );
};

interface EditUserModalProps {
  isOpen: boolean;
  user: any;
  newRole: "admin" | "staff" | "viewer";
  onRoleChange: (role: "admin" | "staff" | "viewer") => void;
  updating: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditUserModal({
  isOpen,
  user,
  newRole,
  onRoleChange,
  updating,
  onClose,
  onSave,
}: EditUserModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management: trap focus inside modal when open
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll('button, select, input, a');
      if (focusable.length) (focusable[0] as HTMLElement).focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200" onClick={onClose}>
      <div
        ref={modalRef}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-xl transform transition-all duration-200 scale-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Update user role</h2>
            <p className="text-sm text-gray-500 mt-0.5">Change permissions for this team member</p>
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
          {/* User Info Card */}
          <div className="bg-gradient-to-r from-indigo-50/50 to-white rounded-xl p-4 flex items-center gap-4 border border-indigo-100 shadow-sm">
            <UserAvatar user={user} size="lg" />
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs text-gray-500">Current role: <span className="font-semibold capitalize text-secondary">{user.role}</span></p>
              </div>
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New role <span className="text-red-500">*</span>
            </label>
            <select
              value={newRole}
              onChange={(e) => onRoleChange(e.target.value as any)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none bg-white appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.25rem',
              }}
            >
              <option value="admin">Admin – Full access to company management</option>
              <option value="staff">Staff – Manage products and orders</option>
              <option value="viewer">Viewer – Read‑only access</option>
            </select>
            <p className="text-xs text-gray-400 mt-1.5">The user will immediately get the new permissions.</p>
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
            ref={saveButtonRef}
            onClick={onSave}
            disabled={updating}
            className="px-5 py-2.5 bg-secondary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm font-medium flex items-center gap-2"
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              'Update role'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}