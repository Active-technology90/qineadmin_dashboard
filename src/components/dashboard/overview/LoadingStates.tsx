// src/components/admin/overview/components/LoadingStates.tsx
import { Package } from "lucide-react";

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="w-11 h-11 rounded-xl bg-gray-200" />
      <div className="w-12 h-4 bg-gray-200 rounded" />
    </div>
    <div className="mt-3 h-3 w-20 bg-gray-200 rounded" />
    <div className="mt-2 h-7 w-28 bg-gray-200 rounded" />
  </div>
);

export const SkeletonChart = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse ${height}`}
  >
    <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
    <div className="flex-1 bg-gray-100 rounded-xl" />
  </div>
);

export const EmptyState = ({
  title,
  description,
  compact = false,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/70 ${compact ? "py-8 px-4" : "h-72 px-6"}`}
  >
    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-3">
      <Package className="h-5 w-5 text-gray-400" />
    </div>
    <p className="text-sm font-semibold text-gray-700">{title}</p>
    <p className="text-xs text-gray-500 mt-1 max-w-md">{description}</p>
  </div>
);