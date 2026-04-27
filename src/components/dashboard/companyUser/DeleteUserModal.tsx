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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Remove User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-700">
                Are you sure you want to remove{" "}
                <span className="font-semibold">{user.first_name} {user.last_name}</span> from this company?
              </p>
              <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 border rounded-full text-gray-700 hover:bg-gray-100">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Removing..." : "Remove User"}
          </button>
        </div>
      </div>
    </div>
  );
}