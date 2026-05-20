// src/components/admin/overview/components/SummaryCard.tsx
import { type ComponentType } from "react";

export type SummaryCardProps = {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  bgLight: string;
  textColor: string;
  onClick?: () => void;
};

export const SummaryCard = ({
  title,
  value,
  icon: Icon,
  bgLight,
  textColor,
  onClick,
}: SummaryCardProps) => (
  <div 
    onClick={onClick}
    className="
      group relative
      bg-gradient-to-br from-white to-gray-50/80
      backdrop-blur-sm
      rounded-xl sm:rounded-2xl
      p-3 sm:p-4 lg:p-5
      shadow-md border border-white/50
      hover:shadow-lg hover:border-[#6750A4]/30
      transition-all duration-300
      w-full min-w-0
    "
  >
    {/* Animated gradient background on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#6750A4]/0 via-[#6750A4]/0 to-[#9b87f5]/0 group-hover:from-[#6750A4]/5 group-hover:via-[#6750A4]/3 group-hover:to-[#9b87f5]/8 rounded-xl sm:rounded-2xl transition-all duration-500"></div>
    
    <div className="relative z-10">
      {/* Top row with icon and subtle indicator */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-5">
        <div className="relative">
          {/* Icon background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#6750A4]/20 to-[#9b87f5]/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div
            className={`
              relative ${bgLight}
              w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12
              rounded-lg sm:rounded-xl
              flex items-center justify-center
              shadow-sm group-hover:shadow-md
              transition-all duration-300
            `}
          >
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${textColor} group-hover:scale-110 transition-transform duration-300`} />
          </div>
        </div>
        
        {/* Subtle stat badge */}
        {/* <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50/50 border border-gray-100/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Live</span>
        </div> */}
      </div>

      {/* Title with modern accent line */}
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 sm:h-4 rounded-full bg-gradient-to-b from-[#6750A4] to-[#9b87f5]"></div>
          <h3 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-[#6750A4] transition-colors duration-300 truncate">
            {title}
          </h3>
        </div>
        
        {/* Value with modern number styling */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-800 tracking-tight group-hover:bg-gradient-to-r group-hover:from-[#6750A4] group-hover:to-[#7c63b8] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 truncate">
            {value}
          </span>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-2 right-2 sm:left-3 sm:right-3 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent group-hover:via-[#6750A4] transition-all duration-500 rounded-full"></div>
    </div>
  </div>
);