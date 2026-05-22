import { useEffect, useMemo } from "react";
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



  return (
    <div
      className={`
        w-full
        flex flex-col sm:flex-row
        items-center justify-between
        gap-3 sm:gap-4
        px-3 sm:px-5 py-3 sm:py-4
        border-t border-gray-200
        bg-gray-50
        ${className}
      `}
    >
      {/* LEFT - Page info hidden on mobile, visible on tablet/desktop */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
        <div className="hidden sm:block px-2 sm:px-3 py-1 sm:py-1.5 bg-white rounded-full text-xs sm:text-sm text-gray-700 shadow-sm">
          Page{" "}
          <span className="font-semibold text-gray-900">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </div>

        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="
              px-2 sm:px-3 py-1 sm:py-1.5
              rounded-full
              border
              bg-white
              text-xs sm:text-sm
              shadow-sm
              hover:border-gray-400
              focus:outline-none
              focus:ring-2
              focus:ring-gray-300
              transition
              cursor-pointer
            "
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>

      {/* CENTER */}
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 bg-white rounded-full px-1 sm:px-2 py-1 shadow-sm">
        {/* Prev */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            h-7 w-7 sm:h-9 sm:w-9
            flex items-center justify-center
            rounded-full
            hover:bg-gray-100
            active:scale-95
            disabled:opacity-40
            disabled:cursor-not-allowed
            transition
          "
        >
          <ChevronLeft size={14} className="sm:w-[18px] sm:h-[18px]" />
        </button>

        {/* Pages */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-1 sm:px-2 text-gray-400 text-[11px] sm:text-sm">
              ...
            </span>
          ) : (
            <button
              key={i}
              onClick={() => goToPage(p)}
              className={`
                min-w-[28px] sm:min-w-[36px]
                h-7 sm:h-9
                px-1.5 sm:px-3
                text-[11px] sm:text-sm
                rounded-full
                font-medium
                transition
                active:scale-95

                ${
                  currentPage === p
                    ? `
                       bg-black/75
                      text-white
                      shadow
                    `
                    : `
                      text-gray-700
                      hover:bg-gray-100
                    `
                }
              `}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="
            h-7 w-7 sm:h-9 sm:w-9
            flex items-center justify-center
            rounded-full
            hover:bg-gray-100
            active:scale-95
            disabled:opacity-40
            disabled:cursor-not-allowed
            transition
          "
        >
          <ChevronRight size={14} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>

      {/* RIGHT */}
      {/* <div className="flex items-center gap-2 text-sm">
        <input
  value={jumpPage}
  onChange={(e) =>
    setJumpPage(e.target.value)
  }
  placeholder="page no"
  className="
    w-18
    px-2 py-1
    rounded-full
    border border-gray-400
    bg-white
    text-sm
    shadow-sm
    focus:outline-none
    focus:ring-1
    focus:ring-gray-300
    hover:border-gray-300
    transition
  "
/> */}

      {/* <button
          onClick={handleJump}
          className="
            px-4 py-1.5
            rounded-full
            bg-black
            text-white
            text-sm
            font-medium
            shadow-sm
            hover:bg-gray-900
            active:scale-95
            transition
          "
        >
          Go
        </button>
      </div> */}
    </div>
  );
}
