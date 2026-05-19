import { X, Mail, Shield, Loader2, User, AtSign, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    phone_number: string;
    role: 'admin' | 'staff' | 'viewer';
    profile_image?: string;
  };
  onClose: () => void;
  onSave: (updatedUser: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    role: string;
  }) => void;
  updating: boolean;
}

export function EditUserModal({
  isOpen,
  user,
  onClose,
  onSave,
  updating,
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    username: user?.username || '',
    role: user?.role || 'staff',
  });

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role,
      });
    }
  }, [user]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll('button, input, select');
      if (focusable.length) (focusable[0] as HTMLElement).focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave({
      id: user.id,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200" onClick={onClose}>
      <div
        ref={modalRef}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-xl transform transition-all duration-200 scale-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#6750A4]/20 bg-[#6750A4]/20 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#6750A4] to-[#8B6BB5] bg-clip-text text-transparent">Edit Profile & Role</h2>
            <p className="text-sm text-gray-500 mt-0.5">Update user information and permissions</p>
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

          {/* Editable Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition"
                />
              </div>
            </div>

            {/* Phone Number – DISABLED & RESTRICTED */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number <span className="text-xs text-gray-400 ml-1">(restricted)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={user.phone_number}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  title="Phone number cannot be changed for security reasons"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Phone number cannot be edited</p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none bg-white appearance-none cursor-pointer"
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
            </div>
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
            onClick={handleSubmit}
            disabled={updating}
            className="px-5 py-2.5 bg-secondary text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm font-medium flex items-center gap-2"
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}