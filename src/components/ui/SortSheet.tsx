// src/components/shared/SortSheet.tsx
import React from "react";
import BottomSheet from "./BottomSheet";
import type { SelectOption } from "../ui/CustomSelect";

interface SortSheetProps {
  open: boolean;
  onClose: () => void;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

const SortSheet: React.FC<SortSheetProps> = ({
  open,
  onClose,
  options,
  value,
  onChange,
  onApply,
  onReset,
}) => (
  <BottomSheet
    open={open}
    onClose={onClose}
    title="Sort"
    maxHeight="70vh"
    footer={
      <>
        <button
          onClick={onReset}
          className="flex-1 h-12 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 active:scale-[0.98] transition-all"
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="flex-1 h-12 rounded-2xl bg-secondary text-sm font-semibold text-white shadow-lg shadow-secondary/20 active:scale-[0.98] transition-all"
        >
          Apply Sort
        </button>
      </>
    }
  >
    <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 block mb-4">
      Sort By
    </label>
    <div className="grid grid-cols-1 gap-3">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-200 active:scale-[0.98]
              ${isActive ? 'bg-secondary text-white border-secondary shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-secondary/40 hover:bg-gray-50'}`}
          >
            <span className="text-sm font-semibold">{opt.label}</span>
            <span
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? "border-white" : "border-gray-300"}`}
            >
              {isActive && <span className="w-2 h-2 bg-white rounded-full" />}
            </span>
          </button>
        );
      })}
    </div>
  </BottomSheet>
);

export default React.memo(SortSheet);
