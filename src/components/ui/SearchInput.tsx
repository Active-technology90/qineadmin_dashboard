import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
} from "react";
import { Search, X, Loader2 } from "lucide-react";

export interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  showClearButton?: boolean;
  name?: string;
  id?: string;

  /** NEW */
  loading?: boolean;
  onSubmit?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: externalValue,
      onChange,
      placeholder = "Search...",
      debounceMs = 300,
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
    const [internalValue, setInternalValue] = useState(
      externalValue || ""
    );
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const isControlled = externalValue !== undefined;

    // Merge refs
    const setRefs = (node: HTMLInputElement) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    // Sync controlled value
    useEffect(() => {
      if (isControlled && externalValue !== undefined) {
        setInternalValue(externalValue);
      }
    }, [externalValue, isControlled]);

    // Debounce handler
    const handleChange = useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue);
        }

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          onChange?.(newValue);
        }, debounceMs);
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

    // Keyboard UX
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        clearSearch();
      }

      if (e.key === "Enter") {
        onSubmit?.(internalValue);
      }
    };

    // Cleanup
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    const inputId = id || "search-input";

    return (
      <div className={`relative w-full group ${className}`}>
        {/* LEFT ICON */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        {/* INPUT */}
        <input
          ref={setRefs}
          type="search"
          id={inputId}
          name={name}
          value={internalValue}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label={placeholder}
          aria-busy={loading}
          className={`
            w-full pl-10 pr-10 py-2.5
            border border-gray-300
            rounded-xl
            bg-white
            text-sm
            transition-all duration-200

            focus:outline-none
            focus:ring-2 focus:ring-purple-500
            focus:border-purple-500
            focus:shadow-sm

            group-hover:border-gray-400

            disabled:bg-gray-100
            disabled:cursor-not-allowed

            ${loading ? "pr-10" : ""}
          `}
        />

        {/* CLEAR BUTTON */}
        {showClearButton && internalValue && !disabled && (
          <button
            type="button"
            onClick={clearSearch}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              text-gray-400 hover:text-gray-600
              transition
              rounded-full p-1
              focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
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