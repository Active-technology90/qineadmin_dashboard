import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  // NEW (optional advanced features)
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];

  className?: string;
  enableUrlSync?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = "",
  enableUrlSync = true,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const [jumpPage, setJumpPage] = useState("");

  // ===============================
  // URL SYNC (page + pageSize)
  // ===============================
  useEffect(() => {
    if (!enableUrlSync) return;

    const url = new URL(window.location.href);
    url.searchParams.set("page", String(currentPage));
    url.searchParams.set("pageSize", String(pageSize));

    window.history.replaceState({}, "", url.toString());
  }, [currentPage, pageSize, enableUrlSync]);

  // ===============================
  // KEYBOARD NAVIGATION
  // ===============================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        if (currentPage > 1) onPageChange(currentPage - 1);
      }
      if (e.key === "ArrowRight") {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPage, totalPages, onPageChange]);

  // ===============================
  // SAFE PAGE CHANGE
  // ===============================
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  // ===============================
  // SMART PAGE LIST
  // ===============================
  const pages = useMemo(() => {
    const items: (number | "...")[] = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      const isEdge = i === 1 || i === totalPages;
      const isNear = Math.abs(i - currentPage) <= delta;

      if (isEdge || isNear) {
        items.push(i);
      } else if (items[items.length - 1] !== "...") {
        items.push("...");
      }
    }

    return items;
  }, [currentPage, totalPages]);

  // ===============================
  // JUMP TO PAGE
  // ===============================
  const handleJump = () => {
    const page = Number(jumpPage);
    if (!page || isNaN(page)) return;

    goToPage(page);
    setJumpPage("");
  };

 return (
  <div
    className={`flex flex-col lg:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-white ${className}`}
  >
    {/* LEFT: INFO + PAGE SIZE */}
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <span>
        Page{" "}
        <span className="font-semibold text-gray-800">{currentPage}</span> /{" "}
        {totalPages}
      </span>

      {onPageSizeChange && (
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border rounded-md px-2 py-1 text-sm cursor-pointer hover:border-gray-400 transition"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      )}
    </div>

    {/* CENTER: PAGINATION */}
    <div className="flex items-center gap-1">
      {/* Prev */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9 flex items-center justify-center border rounded-md
                   cursor-pointer hover:bg-gray-100 active:scale-95
                   disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Pages */}
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-2 text-gray-400 select-none">
              ...
            </span>
          ) : (
            <button
              key={i}
              onClick={() => goToPage(p)}
              className={`h-9 min-w-9 px-2 rounded-md text-sm border transition
                cursor-pointer active:scale-95
                ${
                  currentPage === p
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
            >
              {p}
            </button>
          ),
        )}
      </div>

      {/* Next */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 flex items-center justify-center border rounded-md
                   cursor-pointer hover:bg-gray-100 active:scale-95
                   disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRight size={16} />
      </button>
    </div>

    {/* RIGHT: JUMP TO PAGE */}
    <div className="flex items-center gap-2 text-sm">
      <input
        value={jumpPage}
        onChange={(e) => setJumpPage(e.target.value)}
        placeholder="Go to page"
        className="w-28 border rounded-md px-2 py-1 text-sm
                   focus:outline-none focus:ring-2 focus:ring-black/20
                   hover:border-gray-400 transition"
      />
      <button
        onClick={handleJump}
        className="px-3 py-1 bg-black text-white rounded-md text-sm
                   cursor-pointer hover:bg-gray-900 active:scale-95 transition"
      >
        Go
      </button>
    </div>
  </div>
);
}