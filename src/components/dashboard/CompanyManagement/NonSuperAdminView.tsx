// src/components/admin/CompanyManagement/NonSuperAdminView.tsx
import CompanyCard from "./CompanyCard";
import CompanyForm, { type CompanyFormData } from "./CompanyForm";
import type { CompanyListItem } from "../../../types";
import type { Category, SubCategory } from "../../../types";

interface NonSuperAdminViewProps {
  companies: CompanyListItem[];
  userCompanyRole: string | null;
  onEdit: (company: CompanyListItem) => void;
  // All form props
  formData: CompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>;
  formErrors: Record<string, string>;
  categories: Category[];
  subcategories: SubCategory[];
  logoPreview: string | null;
  coverPreview: string | null;
  isEditingActive: boolean;
  submitting: boolean;
  editingSlug: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCloseForm: () => void;
}

export default function NonSuperAdminView({
  companies,
  userCompanyRole,
  onEdit,
  formData,
  setFormData,
  formErrors,
  categories,
  subcategories,
  logoPreview,
  coverPreview,
  isEditingActive,
  submitting,
  editingSlug,
  onSubmit,
  onCloseForm,
}: NonSuperAdminViewProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-12 items-stretch">
      {/* Left: Company Cards */}
      <div className="flex flex-col">
        {companies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            onEdit={onEdit}
            userRole={userCompanyRole}
          />
        ))}
      </div>

      {/* Right: Inline form */}
      <div className="lg:w-2/3 w-full bg-white rounded-xl border border-gray-200 shadow-md sticky top-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={onCloseForm}
              className="text-[#6750A4] hover:text-[#5b4694] hover:bg-gray-100 p-1 rounded-md transition-colors flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="text-[14px] font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="h-4 w-0.5 bg-[#6750A4] rounded-full"></div>
              <h3 className="pr-5 text-xs font-bold text-[#6750A4] uppercase tracking-wide">
                Company Details
              </h3>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {companies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6750A4] mx-auto mb-3"></div>
            <p className="text-sm">Loading company data...</p>
          </div>
        )}

        {companies.length > 0 && (
          <CompanyForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            categories={categories}
            subcategories={subcategories}
            logoPreview={logoPreview}
            coverPreview={coverPreview}
            isEditingActive={isEditingActive}
            submitting={submitting}
            editingSlug={editingSlug}
            onSubmit={onSubmit}
            onClose={onCloseForm}
          />
        )}
      </div>
    </div>
  );
}