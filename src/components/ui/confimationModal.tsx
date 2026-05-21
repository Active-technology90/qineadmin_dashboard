import { Loader2 } from "lucide-react";

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  loading = false,
  autoClose = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  autoClose?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-[90%] sm:max-w-md p-4 sm:p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">{description}</p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 w-full sm:w-auto"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              if (autoClose) onClose();
            }}
            disabled={loading}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition flex items-center justify-center gap-2 ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-secondary hover:bg-secondary"
            } disabled:opacity-50 w-full sm:w-auto`}
          >
            {loading && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};