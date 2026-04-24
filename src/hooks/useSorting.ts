import { useState, useMemo } from 'react';

export function useSorting<T>(items: T[], defaultField: keyof T | string, defaultOrder: 'asc' | 'desc' = 'asc') {
  const [sortField, setSortField] = useState<string>(defaultField as string);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultOrder);

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let aVal: any = a[sortField as keyof T];
      let bVal: any = b[sortField as keyof T];

      // Handle nested fields (e.g., 'category.name')
      if (sortField.includes('.')) {
        const parts = sortField.split('.');
        aVal = (a as any)[parts[0]]?.[parts[1]];
        bVal = (b as any)[parts[0]]?.[parts[1]];
      }

      // Detect if the values are numeric (and not NaN)
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      const isNumeric = !isNaN(aNum) && !isNaN(bNum);

      let comparison: number;
      if (isNumeric) {
        comparison = aNum - bNum;
      } else {
        const aStr = String(aVal ?? '').toLowerCase();
        const bStr = String(bVal ?? '').toLowerCase();
        if (aStr < bStr) comparison = -1;
        else if (aStr > bStr) comparison = 1;
        else comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [items, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return {
    sortField,
    sortOrder,
    sortedItems,
    handleSort,
  };
}