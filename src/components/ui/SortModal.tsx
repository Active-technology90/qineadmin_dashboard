import React from 'react';
import { ArrowUp, ArrowDown, Text, Hash, SortAsc, X } from 'lucide-react';

export interface SortOption {
  label: string;
  value: string;   // format: "field|order" e.g., "name|asc"
  icon?: React.ReactNode;
}

interface SortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentSortValue: string;
  options?: SortOption[];
}

const defaultSortOptions: SortOption[] = [
  { label: 'Name (A-Z)', value: 'name|asc', icon: <Text size={16} /> },
  { label: 'Name (Z-A)', value: 'name|desc', icon: <Text size={16} /> },
  { label: 'ID (Low to High)', value: 'id|asc', icon: <Hash size={16} /> },
  { label: 'ID (High to Low)', value: 'id|desc', icon: <Hash size={16} /> },
  { label: 'Order (Ascending)', value: 'order|asc', icon: <SortAsc size={16} /> },
  { label: 'Order (Descending)', value: 'order|desc', icon: <SortAsc size={16} /> },
];

export const SortModal: React.FC<SortModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentSortValue,
  options = defaultSortOptions,
}) => {
  if (!isOpen) return null;

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Sort by</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="p-2 space-y-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition ${
                currentSortValue === option.value
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {option.icon && (
                  <span className={currentSortValue === option.value ? 'text-indigo-600' : 'text-gray-400'}>
                    {option.icon}
                  </span>
                )}
                <span className="text-sm font-medium">{option.label}</span>
              </div>
              {currentSortValue === option.value && (
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Reset button */}
        <div className="p-3 pt-0">
          <button
            onClick={() => handleSelect('')}
            className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};