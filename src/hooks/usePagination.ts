// src/hooks/usePagination.ts
import { useState, useMemo, useCallback } from 'react';

export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  // Compute totalPages safely – always a number
  const totalPages = useMemo(() => {
    const total = Math.ceil(items.length / itemsPerPage);
    return Math.max(1, total); // at least 1 page
  }, [items, itemsPerPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  // Use useCallback to avoid recreating function unnecessarily
  const goToPage = useCallback((page: number) => {
    const target = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(target);
  }, [totalPages]);

  const resetPage = useCallback(() => setCurrentPage(1), []);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    resetPage,
    itemsPerPage,
  };
}