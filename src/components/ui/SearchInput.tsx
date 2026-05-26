// src/components/ui/SearchInput.tsx
import React, { forwardRef, useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, Filter } from "lucide-react";

export interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms (default 150) – set 0 for instant */
  debounceMs?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  showClearButton?: boolean;
  name?: string;
  id?: string;
  loading?: boolean;
  onSubmit?: (value: string) => void;
  /** Show filter button inside search input (mobile only) */
  showMobileFilter?: boolean;
  /** Callback when mobile filter button is clicked */
  onMobileFilterClick?: () => void;
  /** Number of active filters to show badge */
  activeFilterCount?: number;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: externalValue,
      onChange,
      placeholder = "Search...",
      debounceMs = 150,
      disabled = false,
      autoFocus = false,
      className = "",
      showClearButton = true,
      name,
      id,
      loading = false,
      onSubmit,
      showMobileFilter = false,
      onMobileFilterClick,
      activeFilterCount = 0,
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(externalValue || "");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isControlled = externalValue !== undefined;
    const inputRef = useRef<HTMLInputElement>(null);

    const setRefs = (node: HTMLInputElement) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    // Sync external value changes
    useEffect(() => {
      if (isControlled && externalValue !== undefined) {
        setInternalValue(externalValue);
      }
    }, [externalValue, isControlled]);

    // Debounced change handler
    const handleChange = useCallback(
      (newValue: string) => {
        if (!isControlled) setInternalValue(newValue);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (debounceMs > 0) {
          timerRef.current = setTimeout(() => onChange?.(newValue), debounceMs);
        } else {
          onChange?.(newValue);
        }
      },
      [onChange, debounceMs, isControlled],
    );

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e.target.value);
    };

    const clearSearch = () => {
      handleChange("");
      inputRef.current?.focus();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") clearSearch();
      if (e.key === "Enter") onSubmit?.(internalValue);
    };

    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    return (
      <div className={`relative w-full ${className}`}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
        </div>

        <input
          ref={setRefs}
          type="search"
          name={name}
          id={id}
          value={internalValue}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full pl-9 pr-9 py-1 sm:py-2

            border border-secondary
            rounded-lg sm:rounded-lg

            bg-white
            text-sm
            transition-all duration-200

            focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary
            disabled:bg-gray-100 disabled:cursor-not-allowed
          `}
        />

        {/* Mobile Filter Button - ONLY visible on mobile, inside search input */}
        {showMobileFilter && onMobileFilterClick && !internalValue && (
          <button
            type="button"
            onClick={onMobileFilterClick}
            className="absolute right-2 top-1/2 -translate-y-1/2 lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all duration-200"
            aria-label="Filter"
          >
            <Filter className="w-4 h-4 text-secondary" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] font-bold text-white bg-secondary px-1 py-0.5 rounded-full min-w-[16px] text-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Mobile Filter Button when there IS search text (positioned left of clear button) */}
        {showMobileFilter && onMobileFilterClick && internalValue && (
          <button
            type="button"
            onClick={onMobileFilterClick}
            className="absolute right-10 top-1/2 -translate-y-1/2 lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all duration-200"
            aria-label="Filter"
          >
            <Filter className="w-4 h-4 text-secondary" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] font-bold text-white bg-secondary px-1 py-0.5 rounded-full min-w-[16px] text-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Clear button - always visible when there is text */}
        {showClearButton && internalValue && !disabled && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-[#6750A4]"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
