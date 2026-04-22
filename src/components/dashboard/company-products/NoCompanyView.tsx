import { Building2 } from 'lucide-react';

interface NoCompanyViewProps {
  onSelectCompany: () => void;
}

export function NoCompanyView({ onSelectCompany }: NoCompanyViewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Building2 className="h-12 w-12 text-gray-400" />
        <p className="text-gray-600">No company selected</p>
        <button
          onClick={onSelectCompany}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Select Company
        </button>
      </div>
    </div>
  );
}