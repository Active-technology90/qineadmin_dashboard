import React, { useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
};

export const FormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  submitting = false,
  children,
  maxWidth = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Scroll lock + ESC
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Auto focus first input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Click outside
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onMouseDown={handleOutsideClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`
          w-full ${maxWidthClasses[maxWidth]}
          bg-white rounded-2xl shadow-2xl
          flex flex-col max-h-[90vh]
          animate-in fade-in zoom-in-95
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2
            id="modal-title"
            className="text-lg sm:text-xl font-semibold text-gray-800"
          >
            {title}
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Content */}
          <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto">
            {/* 👇 First input should use this ref */}
            <div ref={firstInputRef as any} />
            {children}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t bg-white sticky bottom-0">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Cancel */}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#6750A4] text-white py-2.5 rounded-lg font-medium hover:bg-[#5a458c] disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};