import React from "react";

type Props = {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  children: React.ReactNode; // search + sort
};

export const TableControls: React.FC<Props> = ({
  pageSize,
  onPageSizeChange,
  children,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center">
      {/* Left side (Search) */}
      <div className="flex-1 w-full">{children}</div>

      {/* Middle (Page Size) */}
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value={5}>5 / page</option>
        <option value={15}>15 / page</option>
        <option value={30}>30 / page</option>
        <option value={60}>60 / page</option>
      </select>
    </div>
  );
};