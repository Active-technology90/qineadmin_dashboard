import { X, Trash2 } from 'lucide-react';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: any;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteUserModal({
  isOpen,
  user,
  deleting,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6" onClick={onClose}>
      <div className="bg-white w-full max-w-[90%] sm:max-w-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Remove User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 pb-2 sm:pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-gray-700">
                Are you sure you want to remove{" "}
                <span className="font-semibold">{user.first_name} {user.last_name}</span> from this company?
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">This action cannot be undone.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-end gap-3 p-3 sm:p-4 bg-gray-50 rounded-b-xl sm:rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {deleting ? "Removing..." : "Remove User"}
          </button>
        </div>
      </div>
    </div>
  );
}