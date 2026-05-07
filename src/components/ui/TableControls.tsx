// src/components/ui/TableControls.tsx
import React, { memo } from "react";

interface TableControlsProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  children: React.ReactNode;
}

export const TableControls = memo(function TableControls({
  pageSize,
  onPageSizeChange,
  children,
}: TableControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start bg-gray-50 p-2 rounded-xl border border-gray-200">
      <div className="flex-1 w-full">{children}</div>

      <div className="w-auto flex items-center gap-2 bg-white px-2 py-1 rounded-xl">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-[#6750A4] transition cursor-pointer"
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={15}>15 / page</option>
          <option value={30}>30 / page</option>
          <option value={60}>60 / page</option>
        </select>
      </div>
    </div>
  );
});