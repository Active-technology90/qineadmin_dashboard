// src/components/admin/CompanyManagement/NonSuperAdminView.tsx
import CompanyCard from "./CompanyCard";
import CompanyForm, { type CompanyFormData } from "./CompanyForm";
import type { CompanyListItem } from "../../../types";
import type { Category, SubCategory } from "../../../types";
// ========== LOADING SKELETON ==========
const SkeletonCard = () => (
  <div className="relative flex flex-col bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden w-full min-w-0 sm:min-w-[360px] max-w-full sm:max-w-md animate-pulse">
    {/* Cover Image Skeleton */}
    <div className="relative h-40 w-full overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300" />
    
    {/* Content Container */}
    <div className="relative z-10 flex flex-col bg-white rounded-t-3xl -mt-8 px-5 pb-3 pt-0">
      {/* Logo and Name Skeleton */}
      <div className="flex items-center gap-4 -mt-12 mb-4 px-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-200 border-4 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-6 bg-gray-200 rounded w-32 mb-1" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      </div>

      {/* Status Badge Skeleton */}
      <div className="flex justify-end mb-3">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>

      {/* Category Skeleton */}
      <div className="bg-gray-100 rounded-lg p-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gray-200 rounded-md">
            <div className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-16 mb-1" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </div>

      {/* Subcategory Skeleton */}
      <div className="bg-gray-100 rounded-lg p-3 mb-2 border border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gray-200 rounded-md">
            <div className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-20 mb-1" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </div>
      </div>

      {/* Business Type Skeleton */}
      <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gray-200 rounded-md">
            <div className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-20 mb-1" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SkeletonForm = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden animate-pulse">
    <div className="flex flex-col lg:flex-row">
      {/* Left Column */}
      <div className="flex-1 p-3 space-y-3">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
        <div className="h-32 bg-gray-200 rounded w-full" />
      </div>

      {/* Right Column */}
      <div className="flex-1 p-3 space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-20 bg-gray-200 rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 bg-gray-200 rounded w-full" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="flex gap-2">
          <div className="h-5 w-5 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-5 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-40 bg-gray-200 rounded w-full" />
      </div>
    </div>
  </div>
);

interface NonSuperAdminViewProps {
  companies: CompanyListItem[];
  userCompanyRole: string | null;
  onEdit: (company: CompanyListItem) => void;
    loading?: boolean; 
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
  headCompanyName?: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCloseForm: () => void;
}

export default function NonSuperAdminView({
  companies,
  userCompanyRole,
  onEdit,
   loading = false,
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
  headCompanyName,
  onSubmit,
  onCloseForm,
}: NonSuperAdminViewProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
      {/* Left: Company Cards */}
      <div className="flex flex-col">
        {loading ? (
          <>
            <SkeletonCard />
            <div className="mt-4" />
          </>
        ) : (
          companies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            onEdit={onEdit}
            userRole={userCompanyRole}
          />
          ))
        )}
      </div>

      {/* Right: Inline form */}
      <div className="lg:w-4/5 w-full flex flex-col gap-4 lg:sticky lg:top-6">
        {/* Action Buttons - Edit, Update, Cancel on same line */}
        {loading ? (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 animate-pulse">
            {/* View Only Badge Skeleton */}
            <div className="p-4 flex items-center gap-3 flex-wrap">
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-200 rounded w-40" />
            </div>
            {/* Edit Button Skeleton */}
            <div className="h-11 w-36 bg-gray-200 rounded-xl" />
          </div>
        ) : companies.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Update & Cancel Buttons - only show when editing is active */}
            {isEditingActive ? (
              <div className="flex gap-3 flex-wrap">
                <button
                  type="submit"
                  onClick={onSubmit}
                  disabled={submitting}
                  className="cursor-pointer bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
                    <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
                  </svg>
                  {submitting ? "Saving..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={onCloseForm}
                  className="cursor-pointer bg-white border-2 border-gray-300 rounded-xl px-6 py-2.5 text-sm font-extrabold text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Cancel
                </button>
              </div>
            ) : (
              /* View Only Badge - clean text-only with lock icon */
              <div className="p-4 flex items-center gap-3 flex-wrap">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-500"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-sm font-medium text-amber-600">
                  View Only Mode
                </span>
                <span className="text-xs text-gray-400 italic">
                  • Click "Edit Company" to make changes
                </span>
              </div>
            )}

            {/* Edit Button */}
            <button
              onClick={() => {
                if (
                  userCompanyRole === "owner" ||
                  userCompanyRole === "admin" ||
                  userCompanyRole === "super_admin"
                ) {
                  onEdit(companies[0]);
                }
              }}
              disabled={
                userCompanyRole !== "owner" &&
                userCompanyRole !== "admin" &&
                userCompanyRole !== "super_admin"
              }
              title={
                userCompanyRole !== "owner" &&
                userCompanyRole !== "admin" &&
                userCompanyRole !== "super_admin"
                  ? "You don't have permission to edit this company"
                  : "Edit Company"
              }
              className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-extrabold tracking-wide transition-all duration-300 shadow-md
                ${
                  userCompanyRole === "owner" ||
                  userCompanyRole === "admin" ||
                  userCompanyRole === "super_admin"
                     ? "bg-gradient-to-r from-secondary to-secondary-light hover:from-[#5b4694] hover:to-[#6b55a8] text-white shadow-lg cursor-pointer hover:scale-[1.02]"
                      : "bg-gray-300 text-gray-400 cursor-not-allowed shadow-none"
                }
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                <path d="M4 20h16" />
              </svg>
              Edit Company
            </button>
          </div>
        )}

        {/* Form Container - Header removed */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
         
        {/* Loading state */}
        {loading ? (
          <SkeletonForm />
        ) : companies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto mb-3"></div>
            <p className="text-sm">Loading company data...</p>
          </div>
        ) : companies.length > 0 && (
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
            headCompanyName={headCompanyName}
            onSubmit={onSubmit}
            onClose={onCloseForm}
          />
                 )}
          </div>

        </div>
      </div>
  );
}
