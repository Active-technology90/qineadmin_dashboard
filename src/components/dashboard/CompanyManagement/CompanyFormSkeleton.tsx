// src/components/admin/CompanyManagement/CompanyFormSkeleton.tsx
import React from "react";

interface CompanyFormSkeletonProps {
  currentStep?: number;
}

const SkeletonLabel = ({ width = "w-20" }: { width?: string }) => (
  <div className={`h-3.5 bg-gray-200 rounded ${width} mb-1.5`} />
);

const SkeletonInput = ({ height = "h-11" }: { height?: string }) => (
  <div className={`w-full ${height} bg-gray-100 rounded-xl border border-gray-200`} />
);

const SkeletonTextarea = () => (
  <div className="w-full h-24 bg-gray-100 rounded-xl border border-gray-200" />
);

const SkeletonToggle = () => (
  <div className="flex items-center gap-3">
    <div className="w-11 h-6 bg-gray-200 rounded-full relative">
      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-gray-300 rounded-full" />
    </div>
    <div className="h-3.5 bg-gray-200 rounded w-24" />
  </div>
);

const SkeletonSectionHeader = ({ icon = true }: { icon?: boolean }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="h-5 w-1 rounded-full bg-gray-200" />
    <div className="h-4 bg-gray-200 rounded w-32" />
    {icon && <div className="w-4 h-4 bg-gray-200 rounded" />}
  </div>
);

const SkeletonUploadCard = ({ type }: { type: "logo" | "cover" }) => (
  <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center min-h-[180px]">
    <div className={`${type === "logo" ? "w-24 h-24 rounded-2xl" : "w-full h-32 rounded-xl"} bg-gray-200 animate-pulse`} />
    <div className="h-3.5 bg-gray-200 rounded w-24 mt-3" />
    <div className="h-3 bg-gray-200 rounded w-32 mt-2" />
  </div>
);

const SkeletonStep1 = () => (
  <div className="space-y-4">
    {/* Business Information Header */}
    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-200 rounded" />
        <div className="h-3.5 bg-blue-200 rounded w-32" />
      </div>
    </div>

    {/* Company Name & Amharic Name */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <SkeletonLabel width="w-28" />
        <SkeletonInput />
      </div>
      <div>
        <SkeletonLabel width="w-36" />
        <SkeletonInput />
      </div>
    </div>

    {/* Slug & Business Type */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <SkeletonLabel width="w-16" />
        <SkeletonInput />
      </div>
      <div>
        <SkeletonLabel width="w-24" />
        <SkeletonInput />
      </div>
    </div>

    {/* Head Company */}
    <div className="mt-4">
      <SkeletonLabel width="w-32" />
      <div className="flex items-center gap-2">
        <SkeletonInput />
        <div className="w-24 h-10 bg-gray-100 rounded-lg" />
      </div>
    </div>

    {/* Category & Subcategory */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <SkeletonLabel width="w-20" />
        <SkeletonInput />
      </div>
      <div>
        <SkeletonLabel width="w-24" />
        <SkeletonInput />
      </div>
    </div>

    {/* Description */}
    <div>
      <SkeletonLabel width="w-24" />
      <SkeletonTextarea />
    </div>

    {/* Description Amharic */}
    <div className="mt-4">
      <SkeletonLabel width="w-32" />
      <SkeletonTextarea />
    </div>

    {/* Active & Featured Toggles */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <SkeletonToggle />
      <SkeletonToggle />
    </div>

    {/* Supports Table Service Toggle */}
    <div className="mt-2">
      <SkeletonToggle />
    </div>
  </div>
);

const SkeletonStep2 = () => (
  <div className="space-y-4">
    {/* Address */}
    <div>
      <SkeletonLabel width="w-20" />
      <SkeletonInput />
    </div>

    {/* Address Amharic */}
    <div>
      <SkeletonLabel width="w-28" />
      <SkeletonInput />
    </div>

    {/* Phone & Email */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <SkeletonLabel width="w-28" />
        <SkeletonInput />
      </div>
      <div>
        <SkeletonLabel width="w-24" />
        <SkeletonInput />
      </div>
    </div>

    {/* Minimum Order & Delivery Fee */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <SkeletonLabel width="w-32" />
        <SkeletonInput />
      </div>
      <div>
        <SkeletonLabel width="w-32" />
        <SkeletonInput />
      </div>
    </div>

    {/* Chapa Sub-account ID */}
    <div>
      <SkeletonLabel width="w-36" />
      <SkeletonInput />
    </div>

    {/* Theme Colors */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <SkeletonLabel width="w-24" />
          <div className="flex items-center gap-2">
            <div className="w-14 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>

    {/* Location GPS */}
    <div>
      <SkeletonLabel width="w-36" />
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <SkeletonInput />
        </div>
        <div className="relative">
          <SkeletonInput />
        </div>
      </div>
      <div className="mt-2 w-full h-11 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50" />
    </div>
  </div>
);

const SkeletonStep3 = () => (
  <div className="space-y-6">
    {/* Logo & Cover Image Section */}
    <div>
      <SkeletonSectionHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SkeletonLabel width="w-24" />
          <SkeletonUploadCard type="logo" />
        </div>
        <div>
          <SkeletonLabel width="w-24" />
          <SkeletonUploadCard type="cover" />
        </div>
      </div>
    </div>

    {/* License & Tax Information */}
    <div>
      <SkeletonSectionHeader />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <SkeletonLabel width="w-32" />
          <div className="h-11 bg-gray-100 rounded-xl border border-gray-200" />
        </div>
        <div>
          <SkeletonLabel width="w-20" />
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 rounded" />
            <SkeletonInput />
          </div>
        </div>
        <div>
          <SkeletonLabel width="w-36" />
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 rounded" />
            <SkeletonInput />
          </div>
        </div>
      </div>

      {/* Tax Type */}
      <div className="mt-4">
        <SkeletonLabel width="w-16" />
        <SkeletonInput />
      </div>
    </div>
  </div>
);

const SkeletonStep4 = () => (
  <div className="space-y-3 max-w-3xl mx-auto">
    {/* Review Header */}
    <div className="flex items-center gap-2 mb-0.5">
      <div className="h-6 w-1 rounded-full bg-gray-200" />
      <div>
        <div className="h-4 bg-gray-200 rounded w-40 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-56" />
      </div>
    </div>

    {/* Information Card */}
    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
      <div className="flex justify-between items-center mb-1.5">
        <div className="h-3.5 bg-gray-200 rounded w-24" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i}>
            <div className="h-2.5 bg-gray-200 rounded w-20 mb-1" />
            <div className="h-3.5 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    </div>

    {/* Location & Contact Card */}
    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
      <div className="flex justify-between items-center mb-1.5">
        <div className="h-3.5 bg-gray-200 rounded w-32" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <div className="h-2.5 bg-gray-200 rounded w-16 mb-1" />
          <div className="h-3.5 bg-gray-200 rounded w-full" />
        </div>
        <div>
          <div className="h-2.5 bg-gray-200 rounded w-12 mb-1" />
          <div className="h-3.5 bg-gray-200 rounded w-full" />
        </div>
        <div>
          <div className="h-2.5 bg-gray-200 rounded w-12 mb-1" />
          <div className="h-3.5 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>

    {/* Media Card */}
    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
      <div className="flex justify-between items-center mb-1.5">
        <div className="h-3.5 bg-gray-200 rounded w-16" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-3 text-center border-2 border-dashed border-gray-200 min-h-[80px] flex flex-col items-center justify-center">
          <div className="h-2.5 bg-gray-200 rounded w-12 mb-2" />
          <div className="w-16 h-16 bg-gray-200 rounded-xl" />
        </div>
        <div className="bg-white rounded-lg p-3 text-center border-2 border-dashed border-gray-200 min-h-[80px] flex flex-col items-center justify-center">
          <div className="h-2.5 bg-gray-200 rounded w-12 mb-2" />
          <div className="w-full h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>

    {/* Ready Footer */}
    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-3.5 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    </div>
  </div>
);

export default function CompanyFormSkeleton({ currentStep = 0 }: CompanyFormSkeletonProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-gray-100 animate-pulse">
      <div className="flex-1 p-3 space-y-3">
        {currentStep === 0 && <SkeletonStep1 />}
        {currentStep === 1 && <SkeletonStep2 />}
        {currentStep === 2 && <SkeletonStep3 />}
        {currentStep === 3 && <SkeletonStep4 />}
      </div>
    </div>
  );
}