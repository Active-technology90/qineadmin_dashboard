import { AlertCircle } from 'lucide-react';

interface ErrorViewProps {
  error: string;
  onRetry: () => void;
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-600 text-center">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}