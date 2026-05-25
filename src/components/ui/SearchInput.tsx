// src/components/ui/SearchInput.tsx
import React, { forwardRef, useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";

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
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(externalValue || "");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isControlled = externalValue !== undefined;
    const inputRef = useRef<HTMLInputElement>(null);

    const setRefs = (node: HTMLInputElement) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
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
      [onChange, debounceMs, isControlled]
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
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
            w-full pl-10 pr-10 py-2.5
            border border-gray-300
            rounded-xl
            bg-white
            text-sm
            transition-all duration-200

            focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary
            disabled:bg-gray-100 disabled:cursor-not-allowed
          `}
        />

        {showClearButton && internalValue && !disabled && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-secondary"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";