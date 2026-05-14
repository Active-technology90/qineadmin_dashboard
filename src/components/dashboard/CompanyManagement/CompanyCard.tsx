// src/components/admin/CompanyManagement/CompanyCard.tsx
import { Building2, Tag } from "lucide-react";
import type { CompanyListItem } from "../../../types";

interface CompanyCardProps {
  company: CompanyListItem;
  onEdit: (company: CompanyListItem) => void;
  userRole: string | null;
}

export default function CompanyCard({
  company,
  onEdit,
  userRole,
}: CompanyCardProps) {
  return (
    <div className="relative flex flex-col bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden group h-fit">
      {/* Cover Image Section */}
      <div className="relative h-40 w-full overflow-hidden">
        {company.cover_image ? (
          <img
            src={company.cover_image}
            alt={company.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#6750A4] via-[#7c63b8] to-[#9b87f5]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col bg-white rounded-t-3xl -mt-8 px-5 pb-3 pt-0">
        {/* Logo and Name */}
        <div className="flex items-center gap-4 -mt-12 mb-4 px-4">
          <div className="flex-shrink-0 drop-shadow-xl">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-2xl"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6750A4] to-[#9b87f5] flex items-center justify-center border-4 border-white shadow-2xl">
                <Building2 size={32} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl mb-1 truncate drop-shadow-lg text-white [text-shadow:_0_1px_4px_rgb(0_0_0_/_0.5)]">
              {company.name}
            </h3>
            <p className="text-xs font-mono px-3 py-1 rounded-full inline-block bg-black/50 backdrop-blur-sm text-white/90 border border-[#6750A4]/50 shadow-lg">
              {company.slug}
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap justify-end mb-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
              company.is_active
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            {company.is_active ? "● Active" : "○ Inactive"}
          </span>
        </div>

        {/* Category */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white rounded-md shadow-sm">
              <Tag size={14} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Category
              </p>
              <p className="font-semibold text-gray-900 text-sm">
                {company.category_name}
              </p>
            </div>
          </div>
        </div>

        {/* Subcategory */}
        {company.sub_category_name && (
          <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-lg p-3 mb-2 border border-indigo-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <Tag size={14} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                  Subcategory
                </p>
                <p className="font-medium text-gray-700 text-sm">
                  {company.sub_category_name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Business Type */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white rounded-md shadow-sm">
              <Building2 size={14} className="text-[#6750A4]" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Business Type
              </p>
              <p className="font-bold text-gray-900 text-sm">
                {company.business_type?.toUpperCase() || "N/A"}
              </p>
            </div>
          </div>
        </div>

         {/* Edit Button - Removed, now located at top of form */}
      </div>
    </div>
  );
}