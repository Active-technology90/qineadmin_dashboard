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
      w-full min-w-0

      min-h-[120px]
      xs:min-h-[130px]
      sm:min-h-[145px]
      lg:min-h-[165px]

      overflow-hidden

      bg-gradient-to-br
      from-white
      to-gray-50/80

      backdrop-blur-sm

      rounded-2xl
      sm:rounded-3xl

      p-2.5
      xs:p-3
      sm:p-4
      lg:p-5

      shadow-md
      border border-white/60

      hover:shadow-xl
      hover:border-[#6750A4]/30

      active:scale-[0.98]

      transition-all duration-300
    "
  >
    {/* Animated Gradient Hover Layer */}
    <div
      className="
        absolute inset-0

        bg-gradient-to-br
        from-[#6750A4]/0
        via-[#6750A4]/0
        to-[#9b87f5]/0

        group-hover:from-[#6750A4]/5
        group-hover:via-[#6750A4]/3
        group-hover:to-[#9b87f5]/8

        rounded-2xl
        sm:rounded-3xl

        transition-all duration-500
      "
    />

    {/* Decorative Glow */}
    <div
      className="
        absolute -top-10 -right-10
        h-24 w-24
        rounded-full
        bg-purple-200/20
        blur-3xl
        opacity-0
        group-hover:opacity-100
        transition-opacity duration-500
      "
    />

    <div className="relative z-10 h-full flex flex-col justify-between">
      {/* TOP */}
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
        {/* ICON */}
        <div className="relative shrink-0">
          {/* Glow */}
          <div
            className="
              absolute -inset-1
              rounded-2xl
              blur-md
              opacity-0
              group-hover:opacity-100
              bg-gradient-to-r
              from-[#6750A4]/20
              to-[#9b87f5]/20
              transition-all duration-300
            "
          />

          <div
            className={`
              relative ${bgLight}

              w-8 h-8
              xs:w-9 xs:h-9
              sm:w-10 sm:h-10
              lg:w-12 lg:h-12

              rounded-xl
              sm:rounded-2xl

              flex items-center justify-center

              shadow-sm
              group-hover:shadow-md

              transition-all duration-300
            `}
          >
            <Icon
              className={`
                h-4 w-4
                xs:h-[18px] xs:w-[18px]
                sm:h-5 sm:w-5
                lg:h-6 lg:w-6

                ${textColor}

                group-hover:scale-110
                transition-transform duration-300
              `}
            />
          </div>
        </div>

        {/* Live Badge Optional */}
        <div
          className="
            hidden sm:flex
            items-center gap-1
            px-2 py-1
            rounded-full
            bg-white/70
            border border-gray-100
            opacity-0
            group-hover:opacity-100
            transition-all duration-300
          "
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />

          <span
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-wider
              text-gray-500
            "
          >
            Live
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="space-y-1 sm:space-y-2 min-w-0">
        {/* TITLE */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="
              w-1
              h-3
              sm:h-4
              rounded-full
              bg-gradient-to-b
              from-[#6750A4]
              to-[#9b87f5]
              shrink-0
            "
          />

          <h3
            className="
              text-[9px]
              xs:text-[10px]
              sm:text-[11px]

              font-bold
              uppercase
              tracking-[0.12em]

              text-gray-400
              group-hover:text-[#6750A4]

              transition-colors duration-300

              truncate
            "
          >
            {title}
          </h3>
        </div>

        {/* VALUE */}
        <div className="flex items-end gap-1 min-w-0">
          <span
            className="
              text-lg
              xs:text-xl
              sm:text-2xl
              lg:text-3xl

              font-black
              tracking-tight

              text-gray-800

              truncate

              group-hover:bg-gradient-to-r
              group-hover:from-[#6750A4]
              group-hover:to-[#7c63b8]

              group-hover:bg-clip-text
              group-hover:text-transparent

              transition-all duration-500
            "
          >
            {value}
          </span>
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div
        className="
          absolute
          bottom-0
          left-2 right-2
          sm:left-3 sm:right-3

          h-0.5

          rounded-full

          bg-gradient-to-r
          from-transparent
          via-gray-200
          to-transparent

          group-hover:via-[#6750A4]

          transition-all duration-500
        "
      />
    </div>
  </div>
);