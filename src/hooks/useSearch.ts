// src/hooks/useSearch.ts
import { useState, useEffect, useRef, useCallback } from "react";

export function useSearch<T>(
  fetchFn: (search: string, signal: AbortSignal) => Promise<T[]>,
  debounceMs = 300
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), debounceMs);
    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Fetch effect with cancellation
  useEffect(() => {
    if (!debouncedTerm && debouncedTerm !== "") return; // optional: fetch all? skip for now.

    const fetchData = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn(debouncedTerm, controller.signal);
        setData(result);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedTerm, fetchFn]);

  return { searchTerm, setSearchTerm, data, loading, error };
}