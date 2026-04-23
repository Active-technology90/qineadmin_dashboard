import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface SortableHeaderProps {
  field: string;
  currentSort: { field: string; order: 'asc' | 'desc' };
  onSort: (field: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  currentSort,
  onSort,
  children,
  className = '',
}) => {
  const isActive = currentSort.field === field;
  const order = currentSort.order;

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 group ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive ? (
          order === 'asc' ? (
            <ArrowUp size={12} className="text-indigo-600" />
          ) : (
            <ArrowDown size={12} className="text-indigo-600" />
          )
        ) : (
          <div className="opacity-0 group-hover:opacity-50 transition">
            <ArrowUp size={12} />
          </div>
        )}
      </div>
    </th>
  );
};