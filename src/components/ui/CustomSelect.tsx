import React, { useEffect, useRef, useState } from "react";
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
  maxHeight?: number; // ✅ NEW
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
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // ✅ close on outside click (optimized)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // optional: ESC close (PRO UX)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      
      {/* TRIGGER */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-xl
          border border-gray-200
          bg-white
          hover:bg-gray-50
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-purple-500/20
          active:scale-[0.99]
        "
      >
        <div className="flex items-center gap-2 text-sm text-gray-700 truncate">
          {selected?.icon}
          <span className="truncate">
            {selected?.label || placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute z-50 mt-2 w-full
            bg-white
            border border-gray-200
            rounded-xl
            shadow-xl
            overflow-hidden
            animate-in fade-in zoom-in-95
          "
        >
          {/* SCROLL CONTAINER (LIMIT HEIGHT) */}
          <div
            className="overflow-y-auto py-1"
            style={{ maxHeight }}
          >
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
                    px-4 py-2.5 text-sm
                    transition-all duration-150
                    hover:bg-purple-50
                    text-left
                    ${
                      value === opt.value
                        ? "bg-purple-50 text-purple-700 font-medium"
                        : "text-gray-700"
                    }
                  `}
                >
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};