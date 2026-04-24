import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export const useToast = () => {
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
    // Optional: auto-hide after 5 seconds
    setTimeout(() => setToast(null), 5000);
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
};