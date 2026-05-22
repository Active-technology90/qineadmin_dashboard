// src/components/shared/MobileActionBar.tsx
import React from "react";
import { Filter, SlidersHorizontal } from "lucide-react";

interface MobileActionBarProps {
  activeFilterCount: number;
  sortLabel: string;
  onOpenFilters: () => void;
  onOpenSort: () => void;
  showFilterButton?: boolean;
  className?: string;
}

const MobileActionBar: React.FC<MobileActionBarProps> = ({
  activeFilterCount,
  sortLabel,
  onOpenFilters,
  onOpenSort,
  showFilterButton = true,
  className = "",
}) => {
  return (
    <div
      className={`
        md:hidden
        fixed bottom-0 left-0 right-0
        z-40
        border-t border-gray-200/70
        bg-white/85 backdrop-blur-2xl
        shadow-[0_-8px_30px_rgba(0,0,0,0.08)]
        px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)]
        ${className}
      `}
    >
      <div className="flex items-center gap-3 max-w-screen-sm mx-auto">
        {showFilterButton && (
          <button
            onClick={onOpenFilters}
            className="
              group
              relative
              flex-1
              min-h-[56px]
              flex items-center justify-center gap-2.5
              rounded-2xl
              bg-gradient-to-b from-gray-50 to-gray-100
              border border-gray-200/80
              text-sm font-semibold text-gray-700
              shadow-sm
              active:scale-[0.97]
              hover:shadow-md
              hover:border-[#6750A4]/30
              hover:bg-[#F7F4FF]
              transition-all duration-200
              touch-manipulation
              select-none
            "
          >
            <Filter className="w-[18px] h-[18px] transition-transform group-hover:scale-110" />

            <span>Filters</span>

            {activeFilterCount > 0 && (
              <span
                className="
                  absolute top-2 right-2
                  min-w-[20px] h-5
                  px-1.5
                  flex items-center justify-center
                  rounded-full
                  bg-[#6750A4]
                  text-white
                  text-[11px]
                  font-bold
                  shadow-sm
                "
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onOpenSort}
          className="
            group
            relative
            flex-1
            min-h-[56px]
            flex items-center justify-center gap-2.5
            rounded-2xl
            bg-gradient-to-b from-gray-50 to-gray-100
            border border-gray-200/80
            text-sm font-semibold text-gray-700
            shadow-sm
            active:scale-[0.97]
            hover:shadow-md
            hover:border-[#6750A4]/30
            hover:bg-[#F7F4FF]
            transition-all duration-200
            touch-manipulation
            select-none
          "
        >
          <SlidersHorizontal className="w-[18px] h-[18px] transition-transform group-hover:rotate-12 group-hover:scale-110" />

          <span className="truncate max-w-[120px]">{sortLabel}</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(MobileActionBar);