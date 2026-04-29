// src/components/ui/MultiStepFormModal.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { X, Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

export interface FormStep {
  id: string;
  title: string;
  content: ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface MultiStepFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: FormStep[];
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  initialStep?: number;
  onStepChange?: (stepIndex: number) => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showStepIndicator?: boolean;
  autoSave?: {
    data: Record<string, any>;
    save: (data: Record<string, any>) => void;
  };
}

const maxWidthClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-4xl',
};

// Focus trap – fixed type to accept null
const useFocusTrap = (containerRef: React.RefObject<HTMLElement | null>, active: boolean) => {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusableElements[0] as HTMLElement;
    const last = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (first) first.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [active, containerRef]);
};

export const MultiStepFormModal: React.FC<MultiStepFormModalProps> = ({
  isOpen,
  onClose,
  steps,
  onSubmit,
  submitting = false,
  initialStep = 0,
  onStepChange,
  maxWidth = 'xl',
  showStepIndicator = true,
  autoSave,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isValidating, setIsValidating] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [stepTransition, setStepTransition] = useState<'next' | 'prev' | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousOpen = useRef(isOpen);

  // Focus trap – now modalRef is compatible
  useFocusTrap(modalRef, isOpen && !animateOut);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !previousOpen.current) {
      setAnimateOut(false);
      setCurrentStep(initialStep);
      setStepTransition(null);
    }
    previousOpen.current = isOpen;
  }, [isOpen, initialStep]);

  useEffect(() => {
    if (autoSave && !submitting && isOpen) {
      autoSave.save({ ...autoSave.data, lastStep: currentStep });
    }
  }, [currentStep, autoSave, submitting, isOpen]);

  const handleClose = () => {
    setAnimateOut(true);
    setTimeout(() => {
      onClose();
      setAnimateOut(false);
    }, 200);
  };

  const goToNext = useCallback(async () => {
    const step = steps[currentStep];
    if (step.validate) {
      setIsValidating(true);
      try {
        const valid = await step.validate();
        if (!valid) return;
      } catch (err) {
        console.error('Validation error', err);
        return;
      } finally {
        setIsValidating(false);
      }
    }
    setStepTransition('next');
    setTimeout(() => {
      const next = currentStep + 1;
      setCurrentStep(next);
      onStepChange?.(next);
      setStepTransition(null);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }, 150);
  }, [currentStep, steps, onStepChange]);

  const goToPrev = useCallback(() => {
    setStepTransition('prev');
    setTimeout(() => {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      onStepChange?.(prev);
      setStepTransition(null);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }, 150);
  }, [currentStep, onStepChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    onSubmit(e);
  };

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const currentStepObj = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderStepIndicator = useMemo(() => {
    if (!showStepIndicator || steps.length <= 1) return null;
    return (
      <div className="flex justify-center gap-2 mt-4">
        {steps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (idx < currentStep) {
                setCurrentStep(idx);
                onStepChange?.(idx);
              }
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentStep
                ? 'w-6 bg-[#6750A4]'
                : idx < currentStep
                ? 'w-2 bg-[#6750A4]/40'
                : 'w-2 bg-gray-300'
            }`}
            aria-label={`Go to step ${idx + 1}`}
            disabled={idx > currentStep}
          />
        ))}
      </div>
    );
  }, [currentStep, steps.length, showStepIndicator, onStepChange]);

  const contentAnimationClass =
    stepTransition === 'next'
      ? 'animate-slide-left-out'
      : stepTransition === 'prev'
      ? 'animate-slide-right-out'
      : 'animate-slide-in';

  if (!isOpen && !animateOut) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-200 ${
        animateOut ? 'bg-black/0 backdrop-blur-0' : 'bg-black/50 backdrop-blur-sm'
      }`}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`
          w-full bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl
          flex flex-col max-h-[95vh] sm:max-h-[90vh] transition-all duration-300
          ${maxWidthClasses[maxWidth]}
          ${animateOut ? 'translate-y-full sm:scale-95 opacity-0' : 'translate-y-0 sm:scale-100 opacity-100'}
        `}
      >
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-gray-100">
          <div className="px-5 pt-5 pb-3 sm:px-7 sm:pt-6 sm:pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 id="modal-title" className="text-xl sm:text-2xl font-bold text-gray-900">
                  {currentStepObj.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>
            <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6750A4] to-[#9f7aea] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {renderStepIndicator}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto" ref={contentRef}>
            <div className={`p-5 sm:p-7 ${contentAnimationClass}`}>
              {currentStepObj.content}
            </div>
          </div>
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 sm:p-6 rounded-b-3xl">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              {!isFirst && (
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={isValidating || submitting}
                  className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 rounded-xl
                             text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-[#6750A4]/40
                             disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="inline mr-1" size={18} />
                  Back
                </button>
              )}
              {!isLast ? (
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={isValidating}
                  className="flex-1 bg-[#6750A4] text-white rounded-xl py-2.5 px-6
                             font-medium hover:bg-[#5a3e8e] focus:ring-2 focus:ring-[#6750A4]/40
                             disabled:opacity-50 disabled:cursor-not-allowed transition
                             flex items-center justify-center gap-2"
                >
                  {isValidating && <Loader2 className="animate-spin h-4 w-4" />}
                  Continue
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || isValidating}
                  className="flex-1 bg-[#6750A4] text-white rounded-xl py-2.5 px-6
                             font-medium hover:bg-[#5a3e8e] focus:ring-2 focus:ring-[#6750A4]/40
                             disabled:opacity-50 disabled:cursor-not-allowed transition
                             flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="animate-spin h-4 w-4" />}
                  {submitting ? 'Submitting...' : 'Submit'}
                  {!submitting && <CheckCircle size={18} />}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Regular style tag – no 'jsx' attribute */}
      <style>{`
        @keyframes slideLeftOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-20px); opacity: 0; }
        }
        @keyframes slideRightOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(20px); opacity: 0; }
        }
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-left-out {
          animation: slideLeftOut 150ms ease forwards;
        }
        .animate-slide-right-out {
          animation: slideRightOut 150ms ease forwards;
        }
        .animate-slide-in {
          animation: slideIn 200ms ease-out;
        }
      `}</style>
    </div>
  );
};