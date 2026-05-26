// src/components/ui/FormModal.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  closeOnOutsideClick?: boolean;
  showCloseButton?: boolean;
}

const maxWidthClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-4xl',
  xl: 'sm:max-w-5xl',
  '2xl': 'sm:max-w-6xl',
  '3xl': 'sm:max-w-7xl',
};

const useFocusTrap = (containerRef: React.RefObject<HTMLElement | null>, active: boolean) => {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;
    const first = focusableElements[0] as HTMLElement;
    const last = focusableElements[focusableElements.length - 1] as HTMLElement;
    first.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [active, containerRef]);
};

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 12,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  submitting = false,
  children,
  maxWidth = 'md',
  closeOnOutsideClick = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (!isOpen) {
      setShouldRender(false);
      document.body.style.overflow = '';
      return;
    }

    setShouldRender(true);
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

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) {
        (focusable[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  const handleOutsideClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        closeOnOutsideClick &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [closeOnOutsideClick, onClose]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    onSubmit(e);
  };

  if (!shouldRender && !isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4"
          onClick={handleOutsideClick}
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
        >
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              w-full
              max-h-[95vh] sm:max-h-[92vh]
              ${maxWidthClasses[maxWidth]}
              bg-white
              rounded-2xl sm:rounded-3xl
              shadow-2xl
              ring-1 ring-gray-200/30
              flex flex-col
              overflow-hidden
            `}
          >
            <div className="sticky top-0 z-20">
              <div className="flex items-center justify-between px-3 sm:px-5 lg:px-6 py-3 sm:py-4 border-b border-white/20 bg-gradient-to-r from-secondary/10 via-white/80 to-white/60 backdrop-blur-xl">
                <h2
                  id="modal-title"
                  className="text-base sm:text-lg lg:text-xl font-semibold text-secondary truncate"
                >
                  {title}
                </h2>

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/70 hover:bg-white text-red-500 hover:text-red-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    aria-label="Close modal"
                  >
                    <X size={18} className="sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {children}
              </div>

              <div className="sticky bottom-0 border-t border-gray-100 bg-white/90 backdrop-blur-xl px-3 sm:px-5 lg:px-6 py-3 sm:py-4">
                <div className="flex flex-row sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto h-11 sm:h-12 px-4 sm:px-5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-secondary/40 active:scale-[0.98]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto h-11 sm:h-12 px-4 sm:px-5 rounded-xl text-white font-medium transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-secondary/40 active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-secondary to-[#7c63c9] hover:from-[#5a448c] hover:to-[#6d56b3]"
                  >
                    {submitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};