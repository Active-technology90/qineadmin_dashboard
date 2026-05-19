import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, Search } from "lucide-react";

export function CompanySelect({
  scopeOptions,
  company,
  handleCompanyChange,
}: any) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isAllCompanies = !company?.slug;

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Reset when opened */
  useEffect(() => {
    if (open) {
      setSearch("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* Filtered list */
  const filtered = scopeOptions.filter((opt: any) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  /* Reset active index when filter changes */
  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  /* Keyboard navigation */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev === 0 ? filtered.length - 1 : prev - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const selected = filtered[activeIndex];
      if (selected) {
        handleCompanyChange(selected.value);
        setOpen(false);
      }
    }

    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  /* Selected label resolver (Stripe style) */
  const selectedLabel =
    company?.label || company?.name || "All Companies";

  const selectedLogo = company?.logo;

  return (
    <div ref={ref} className="relative w-[360px]">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="
          w-full flex items-center justify-between gap-3
          px-4 py-3 bg-white border border-gray-200
          rounded-xl shadow-sm
          hover:border-[#6750A4]/60 hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-[#6750A4]/20
          transition-all
        "
      >
        <div className="flex items-center gap-3 min-w-0">
          {selectedLogo ? (
            <img
              src={selectedLogo}
              className="w-7 h-7 rounded-full object-cover border"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-gray-500" />
            </div>
          )}

          <span className="text-sm font-semibold text-gray-800 truncate">
            {selectedLabel}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 m-2 rounded-xl bg-gray-50 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {/* List */}
          <div className="max-h-90 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-gray-400 text-center">
                No companies found
              </div>
            ) : (
              filtered.map((opt: any, index: number) => {
                const isSelected = opt.value === company?.slug;
                const isActive = index === activeIndex;

                return (
                  <div
                    key={opt.value}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      handleCompanyChange(opt.value);
                      setOpen(false);
                    }}
                    className={`
                      flex items-start gap-3 px-4 py-3 cursor-pointer
                      transition
                      ${isActive ? "bg-gray-100" : ""}
                      ${isSelected ? "bg-gray-50" : ""}
                      hover:bg-gray-100
                    `}
                  >
                    {/* Logo */}
                    {opt.logo ? (
                      <img
                        src={opt.logo}
                        className="w-7 h-7 rounded-full object-cover border mt-0.5"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                        <Building2 className="w-4 h-4 text-gray-500" />
                      </div>
                    )}

                    {/* Text */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-gray-800 break-words">
                        {opt.label}
                      </span>

                      {opt.subLabel && (
                        <span className="text-xs text-gray-400">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}