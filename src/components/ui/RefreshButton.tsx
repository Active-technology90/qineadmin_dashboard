import { RefreshCw } from "lucide-react";

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  className?: string;
}

export function RefreshButton({
  onRefresh,
  isLoading = false,
  className = "",
}: RefreshButtonProps) {
  return (
    <button
      onClick={onRefresh}
      disabled={isLoading}
      className={`px-4 py-2 rounded-xl border-gray-400 border text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
      title="Refresh data"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      
    </button>
  );
}