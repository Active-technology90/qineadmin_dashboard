import { useState, useMemo, useCallback, useEffect } from "react";

export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage));
  }, [items, itemsPerPage]);

  // ✅ auto-fix invalid page whenever dependencies change
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage, totalPages]);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.min(Math.max(1, page), totalPages));
    },
    [totalPages],
  );

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