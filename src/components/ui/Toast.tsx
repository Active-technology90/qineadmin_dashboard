import { Package, AlertCircle } from 'lucide-react';
import type { ToastType } from '../../hooks/useToast';


interface ToastProps {
  toast: { type: ToastType; message: string } | null;
  zIndex?: number;
}

export function Toast({ toast, zIndex = 50 }: ToastProps) {
  if (!toast) return null;

  return (
    <div 
      className="fixed top-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all animate-in slide-in-from-top-2"
      style={{ zIndex: zIndex }}
    >
      <div
        className={`flex items-center gap-2 ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        } px-4 py-2 rounded-lg`}
      >
        {toast.type === 'success' ? (
          <Package className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}