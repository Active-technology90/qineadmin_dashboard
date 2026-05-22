// src/components/shared/MobileCardSkeleton.tsx
import React from 'react';

interface MobileCardSkeletonProps {
  count?: number;
  /** Extra meta‑line groups to show */
  metaLinePairs?: number;
  /** Whether to show action buttons skeleton */
  showActions?: boolean;
}

const MobileCardSkeleton: React.FC<MobileCardSkeletonProps> = ({
  count = 3,
  metaLinePairs = 2,
  showActions = true,
}) => (
  <div className="space-y-3 xs:space-y-4 px-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-xl p-4 xs:p-5 shadow-sm border border-gray-100 animate-pulse"
      >
        {/* Header row: icon + text + status badge */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 xs:h-12 xs:w-12 rounded-xl bg-gray-200 shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-5 w-14 bg-gray-200 rounded-full shrink-0" />
        </div>
        {/* Meta data rows */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {Array.from({ length: metaLinePairs * 2 }).map((_, idx) => (
            <div key={idx} className="h-4 bg-gray-100 rounded" />
          ))}
        </div>
        {/* Action buttons */}
        {showActions && (
          <div className="mt-4 flex gap-2">
            <div className="h-10 flex-1 bg-gray-100 rounded-lg" />
            <div className="h-10 flex-1 bg-gray-100 rounded-lg" />
          </div>
        )}
      </div>
    ))}
  </div>
);

export default React.memo(MobileCardSkeleton);