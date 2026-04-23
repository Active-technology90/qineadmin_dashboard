// src/components/ui/MultiStepFormModal.tsx
import React, { useEffect, useState, useRef } from 'react';
import { X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export interface FormStep {
  id: string;
  title: string;
  content: React.ReactNode;
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
}

const maxWidthClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
};

export const MultiStepFormModal: React.FC<MultiStepFormModalProps> = ({
  isOpen,
  onClose,
  steps,
  onSubmit,
  submitting = false,
  initialStep = 0,
  onStepChange,
  maxWidth = 'md',
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isValidating, setIsValidating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll + ESC handler
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        window.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) setCurrentStep(initialStep);
  }, [isOpen, initialStep]);

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleNext = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // critical: prevent any event bubbling

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
    const next = currentStep + 1;
    setCurrentStep(next);
    onStepChange?.(next);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = currentStep - 1;
    setCurrentStep(prev);
    onStepChange?.(prev);
  };

  const handleFinalSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!submitting) {
      // Create a fake synthetic event to match onSubmit signature
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      onSubmit(fakeEvent);
    }
  };

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!isOpen) return null;

  return (
    <div
      onMouseDown={handleOutsideClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3"
    >
      <div
        ref={modalRef}
        className={`w-full ${maxWidthClasses[maxWidth]} bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95`}
      >
        {/* HEADER */}
        <div className="px-4 sm:px-6 py-4 border-b bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {step.title}
              </h3>
              <p className="text-xs text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md">
              <X size={20} />
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* CONTENT - No outer form! */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            {step.content}
          </div>

          {/* FOOTER */}
          <div className="p-4 sm:p-6 border-t bg-white sticky bottom-0">
            <div className="flex gap-3">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 border rounded-lg py-2.5 hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="inline mr-1" size={18} />
                  Back
                </button>
              )}

              {!isLast ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isValidating}
                  className="flex-1 bg-[#6750A4] text-white rounded-lg py-2.5 hover:bg-[#6750A4] flex justify-center items-center gap-2 transition disabled:opacity-50"
                >
                  {isValidating && <Loader2 className="animate-spin h-4 w-4" />}
                  Continue
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="flex-1 bg-[#6750A4] text-white rounded-lg py-2.5 hover:bg-[#6750A4] flex justify-center items-center gap-2 transition disabled:opacity-50"
                >
                  {submitting && <Loader2 className="animate-spin h-4 w-4" />}
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};