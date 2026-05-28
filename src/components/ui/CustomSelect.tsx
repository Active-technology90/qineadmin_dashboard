import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  maxHeight?: number;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  maxHeight = 260,
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Update dropdown position based on trigger
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4, // small gap
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Toggle open/close and recalc position
  const toggleOpen = () => {
    if (!open) {
      updatePosition();
    }
    setOpen((prev) => !prev);
  };

  // Close when clicking outside (trigger + portal)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedOnTrigger = wrapperRef.current?.contains(target);
      const clickedOnDropdown = dropdownRef.current?.contains(target);
      if (!clickedOnTrigger && !clickedOnDropdown) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // Recalculate position on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => updatePosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* TRIGGER BUTTON */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        className="
          w-full flex items-center justify-between
          px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl
          border border-secondary
          bg-gray-50
          hover:bg-white hover:border-secondary hover:shadow-sm
          focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary
          transition-all duration-200
          active:scale-[0.99]
        "
      >
        <div className="flex items-center gap-2 text-sm text-secondary truncate">
          {selected?.icon}
          <span className="truncate">{selected?.label || placeholder}</span>
        </div>

        <ChevronDown
          className={`h-3 w-3 text-secondary transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* PORTAL DROPDOWN */}
      {open &&
        dropdownPos &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 99999,
            }}
            className="
              bg-white
              border border-secondary
              rounded-xl
              shadow-xl
              overflow-hidden
              origin-top
              animate-in slide-in-from-top-2 fade-in duration-200
            "
          >
            <div className="overflow-y-auto py-1" style={{ maxHeight }}>
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  No options found
                </div>
              ) : (
                options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-2
                      px-3 py-1.5 text-sm
                      transition-all duration-150
                      hover:bg-secondary/10 hover:pl-4
                      text-left
                      ${
                        value === opt.value
                          ? "bg-secondary/10 text-secondary font-semibold"
                          : "text-secondary"
                      }
                    `}
                  >
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};