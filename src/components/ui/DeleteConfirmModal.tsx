import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  deleteTitle?: string
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ isOpen, title, onConfirm, onCancel, deleteTitle="Delete Product" ,}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 sm:p-5 pb-2 sm:pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{deleteTitle}</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Are you sure you want to delete <span className="font-semibold text-gray-800">"{title}"</span>?
              </p>
              <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-end gap-3 p-3 sm:p-4 bg-gray-50 rounded-b-xl sm:rounded-b-2xl">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
