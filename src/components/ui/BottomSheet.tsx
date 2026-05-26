// src/components/shared/BottomSheet.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  maxHeight = '90vh',
}) => {
  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[130] flex flex-col bg-white  rounded-t-2xl shadow-2xl transform transition-all duration-300 ease-out"
        style={{ maxHeight }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-3">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="border-t border-gray-100 bg-white p-4 mb-3 flex gap-3 flex-shrink-0 safe-bottom">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(BottomSheet);