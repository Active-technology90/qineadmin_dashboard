import { X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ isOpen, title, onConfirm, onCancel }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">Confirm Delete</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm break-words">
          Are you sure you want to delete "<strong className="break-words">{title}</strong>"? This action cannot be undone.
        </p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm sm:text-base w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base w-full sm:w-auto"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}