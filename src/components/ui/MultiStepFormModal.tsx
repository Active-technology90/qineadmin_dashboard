// src/components/ui/MultiStepFormModal.tsx

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

import {
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export interface FormStep {
  id: string;
  title: string;
  description?: string;
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
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  showStepIndicator?: boolean;
  closeOnBackdrop?: boolean;
  preventCloseWhileSubmitting?: boolean;
  autoSave?: {
    data: Record<string, any>;
    save: (data: Record<string, any>) => void;
  };
}

const maxWidthClasses = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-3xl",
  "2xl": "sm:max-w-5xl",
};

const useFocusTrap = (
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) => {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const focusable = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

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

    window.addEventListener("keydown", handleTab);

    return () => {
      window.removeEventListener("keydown", handleTab);
    };
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
  maxWidth = "xl",
  showStepIndicator = true,
  closeOnBackdrop = true,
  preventCloseWhileSubmitting = true,
  autoSave,
}) => {
  const [currentStep, setCurrentStep] = useState(() => initialStep);
  const [isValidating, setIsValidating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, isOpen);

  const current = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setAnimateOut(false);

      // reset step when opening
      setCurrentStep(initialStep);

      document.body.style.overflow = "hidden";
    } else if (mounted) {
      // play close animation before unmount
      setAnimateOut(true);

      const timer = window.setTimeout(() => {
        setMounted(false);
        setAnimateOut(false);
      }, 220);

      document.body.style.overflow = "";

      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialStep, mounted]);

  // useEffect(() => {
  //   if (isOpen) {
  //     setCurrentStep(initialStep);
  //   }
  // }, [initialStep, isOpen]);

  useEffect(() => {
    if (autoSave && isOpen) {
      autoSave.save({
        ...autoSave.data,
        currentStep,
      });
    }
  }, [currentStep]);

  const handleClose = () => {
    if (preventCloseWhileSubmitting && submitting) return;

    onClose();
  };

  const nextStep = useCallback(async () => {
    const step = steps[currentStep];

    if (step.validate) {
      setIsValidating(true);

      try {
        const valid = await step.validate();

        if (!valid) return;
      } catch (err) {
        console.error(err);
        return;
      } finally {
        setIsValidating(false);
      }
    }

    setDirection("next");

    setTimeout(() => {
      const next = currentStep + 1;

      setCurrentStep(next);
      onStepChange?.(next);

      setDirection(null);

      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }, 150);
  }, [currentStep, steps]);

  const prevStep = useCallback(() => {
    setDirection("prev");

    setTimeout(() => {
      const prev = currentStep - 1;

      setCurrentStep(prev);
      onStepChange?.(prev);

      setDirection(null);

      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }, 150);
  }, [currentStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    onSubmit(e);
  };

  const contentAnimation =
    direction === "next"
      ? "animate-slide-left"
      : direction === "prev"
        ? "animate-slide-right"
        : "animate-fade-in";

  const stepIndicator = useMemo(() => {
    if (!showStepIndicator || steps.length <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-5">
        {steps.map((step, index) => {
          const active = currentStep === index;
          const completed = index < currentStep;

          return (
            <button
              key={step.id}
              disabled={index > currentStep}
              onClick={() => {
                if (index <= currentStep) {
                  setCurrentStep(index);
                }
              }}
              className={`
                relative transition-all duration-300
                ${
                  active
                    ? "w-10 bg-[#6750A4]"
                    : completed
                      ? "w-3 bg-[#6750A4]/40"
                      : "w-3 bg-gray-300"
                }
                h-3 rounded-full
              `}
            />
          );
        })}
      </div>
    );
  }, [currentStep, steps, showStepIndicator]);

  if (!mounted && !isOpen) return null;

  return (
    <>
      <div
        onClick={() => {
          if (closeOnBackdrop) {
            handleClose();
          }
        }}
        className={`
          fixed inset-0 z-50
          transition-all duration-200
          flex items-end sm:items-center justify-center
          px-0 sm:px-6
          ${
            animateOut
              ? "bg-black/0 backdrop-blur-0"
              : "bg-black/60 backdrop-blur-sm"
          }
        `}
      >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className={`
            w-full bg-white
            rounded-t-[32px] sm:rounded-[32px]
            shadow-[0_20px_60px_rgba(0,0,0,0.2)]
            flex flex-col overflow-hidden
            max-h-[100dvh] sm:max-h-[92vh]
            ${maxWidthClasses[maxWidth]}
            transition-all duration-300
            ${
              animateOut
                ? "translate-y-full sm:translate-y-10 opacity-0 scale-[0.98]"
                : "translate-y-0 opacity-100 scale-100"
            }
          `}
        >
          {/* HEADER */}
          <div className="sticky top-0 z-20 bg-[#6750A4]/30 backdrop-blur-xl border-b border-[#6750A4]/30">
            <div className="px-5 sm:px-7 pt-2 pb-2">
              <div className="flex items-start justify-between">
                <div className="pr-4">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#6750A4] bg-[#6750A4]/10 px-2 py-0.5 rounded-full mb-1.5">
                    Step {currentStep + 1} of {steps.length}
                  </div>

                  <h2 className="text-lg font-bold tracking-tight text-gray-900">
                    {current.title}
                  </h2>

                  {current.description && (
                    <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                      {current.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="
                    h-8 w-8 rounded-full
                    flex items-center justify-center
                    bg-red-50 hover:bg-red-100
                    text-red-500 hover:text-red-700
                    transition-all duration-200
                    disabled:opacity-50
                    group
                  "
                >
                  <X size={16} className="transition-transform group-hover:scale-110" />
                </button>
              </div>
            </div>
          </div>

          {/* PROGRESS & STEP INDICATOR - Outside header */}
          <div className="px-5 sm:px-7 pt-3 pb-4 bg-white/50 border-b border-gray-100">
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
              <div
                className="
                  h-full rounded-full
                  bg-gradient-to-r from-[#6750A4] to-[#8B5CF6]
                  transition-all duration-500 ease-out
                "
                style={{ width: `${progress}%` }}
              />
            </div>
            {stepIndicator}
          </div>

          {/* CONTENT */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div
              ref={contentRef}
              className="
                flex-1 overflow-y-auto
                scrollbar-thin scrollbar-thumb-gray-300
              "
            >
              <div className={`p-5 sm:p-7 ${contentAnimation}`}>
                {current.content}
              </div>
            </div>

            {/* FOOTER */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-5 py-3 sm:px-7">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                {!isFirst ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={submitting || isValidating}
                    className="
                      h-9 px-4 rounded-xl
                      border border-gray-300
                      text-gray-700 font-medium text-sm
                      hover:bg-gray-50
                      transition-all duration-200
                      disabled:opacity-50
                      flex items-center justify-center gap-1.5
                    "
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {!isLast ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={isValidating}
                    className="
                      px-5 h-9 rounded-xl
                      bg-[#6750A4]
                      hover:bg-[#5B4294]
                      text-white font-medium text-sm
                      transition-all duration-200
                      disabled:opacity-50
                      flex items-center justify-center gap-1.5
                      shadow-md shadow-[#6750A4]/20
                    "
                  >
                    {isValidating && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Continue
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || isValidating}
                    className="
                      px-5 h-9 rounded-xl
                      bg-[#6750A4]
                      hover:bg-[#5B4294]
                      text-white font-medium text-sm
                      transition-all duration-200
                      disabled:opacity-50
                      flex items-center justify-center gap-1.5
                      shadow-md shadow-[#6750A4]/20
                    "
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit
                        <CheckCircle2 size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slideLeft {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-left {
          animation: slideLeft 220ms ease;
        }

        .animate-slide-right {
          animation: slideRight 220ms ease;
        }

        .animate-fade-in {
          animation: fadeIn 250ms ease;
        }
      `}</style>
    </>
  );
};
