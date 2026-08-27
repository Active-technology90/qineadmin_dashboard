// src/components/admin/CompanyManagement/CompanyCard.tsx

import React from "react";
import {
  Building2,
  Tag,
  ChevronRight,
  MapPin,
  Star,
  Globe2,
} from "lucide-react";
import type { CompanyListItem } from "../../../types";

interface CompanyCardProps {
  company: CompanyListItem;
  onEdit: (company: CompanyListItem) => void;
  userRole?: string | null;
}

export default function CompanyCard({
  company,
  onEdit,
  userRole,
}: CompanyCardProps) {
  const isActive = company.is_active;

  const formatBusinessType = (value?: string) => {
    if (!value) return "N/A";

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <article
      className="
        group relative flex h-full min-w-0 flex-col
        overflow-hidden rounded-2xl
        border border-gray-200/80
        bg-white
        shadow-sm
        transition-all duration-300
        hover:-translate-y-0.5
        hover:border-gray-300
        hover:shadow-xl hover:shadow-gray-200/60
      "
    >
      {/* =========================================================
          COVER
      ========================================================== */}
      <div className="relative h-32 w-full overflow-hidden bg-gray-100 sm:h-36 md:h-40">
        {company.cover_image ? (
          <img
            src={company.cover_image}
            alt={`${company.name} cover`}
            className="
              h-full w-full object-cover
              transition-transform duration-700
              group-hover:scale-105
            "
          />
        ) : (
          <div
            className="
              h-full w-full
              bg-gradient-to-br
              from-secondary
              via-secondary-light
              to-[#9b87f5]
            "
          >
            {/* Decorative background */}
            <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          </div>
        )}

        {/* Cover overlay */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-t
            from-black/40 via-black/5 to-transparent
          "
        />

        {/* Top status */}
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
          {/* Profile label */}
          <span
            className="
              inline-flex items-center gap-1.5
              rounded-full
              border border-white/20
              bg-black/20
              px-2.5 py-1
              text-[10px] font-semibold
              uppercase tracking-wider
              text-white
              backdrop-blur-md
            "
          >
            <Building2 className="h-3 w-3" />
            Company
          </span>

          {/* Active status */}
          <span
            className={`
              inline-flex items-center gap-1.5
              rounded-full
              border px-2.5 py-1
              text-[10px] font-semibold
              backdrop-blur-md
              ${
                isActive
                  ? "border-emerald-300/30 bg-emerald-500/90 text-white"
                  : "border-white/20 bg-black/40 text-white"
              }
            `}
          >
            <span
              className={`
                h-1.5 w-1.5 rounded-full
                ${isActive ? "bg-white" : "bg-gray-300"}
              `}
            />

            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}
      <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
        {/* =======================================================
            COMPANY IDENTITY
        ======================================================== */}
        <div className="relative -mt-8 mb-4 flex items-end gap-3">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            {company.logo ? (
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="
                  h-16 w-16
                  rounded-2xl
                  border-4 border-white
                  bg-white
                  object-cover
                  shadow-lg
                  sm:h-[72px] sm:w-[72px]
                "
              />
            ) : (
              <div
                className="
                  flex
                  h-16 w-16
                  items-center justify-center
                  rounded-2xl
                  border-4 border-white
                  bg-gradient-to-br
                  from-secondary to-[#9b87f5]
                  shadow-lg
                  sm:h-[72px] sm:w-[72px]
                "
              >
                <Building2
                  className="h-7 w-7 text-white sm:h-8 sm:w-8"
                  strokeWidth={1.8}
                />
              </div>
            )}

            {/* Online/active dot */}
            <span
              className={`
                absolute
                bottom-0.5 right-0.5
                h-4 w-4
                rounded-full
                border-[3px] border-white
                shadow-sm
                ${isActive ? "bg-emerald-500" : "bg-gray-400"}
              `}
            />
          </div>

          {/* Name */}
          <div className="min-w-0 flex-1 pb-0.5">
            <h3
              title={company.name}
              className="
                line-clamp-2
                break-words
                text-[15px]
                font-bold
                leading-tight
                text-gray-900
                sm:text-base
              "
            >
              {company.name}
            </h3>

            {company.slug && (
              <div className="mt-1.5 flex min-w-0 items-center gap-1">
                <Globe2 className="h-3 w-3 flex-shrink-0 text-gray-400" />

                <span
                  title={company.slug}
                  className="
                    min-w-0 truncate
                    font-mono
                    text-[10px]
                    text-gray-500
                  "
                >
                  {company.slug}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* =======================================================
            BUSINESS TYPE / FEATURED
        ======================================================== */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Business Type
            </p>

            <p className="mt-0.5 truncate text-xs font-semibold text-gray-800">
              {formatBusinessType(company.business_type)}
            </p>
          </div>

          {/* Featured badge if available */}
          {"is_featured" in company && company.is_featured && (
            <span
              className="
                inline-flex flex-shrink-0
                items-center gap-1
                rounded-full
                border border-amber-200
                bg-amber-50
                px-2 py-1
                text-[9px]
                font-bold
                text-amber-700
              "
            >
              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
              Featured
            </span>
          )}
        </div>

        {/* =======================================================
            DETAILS
        ======================================================== */}
        <div
          className="
            overflow-hidden
            rounded-xl
            border border-gray-100
            bg-gray-50/60
          "
        >
          {/* Category */}
          <div
            className="
              flex min-w-0 items-center gap-3
              border-b border-gray-100
              px-3 py-2.5
              transition-colors
              group-hover:bg-white
            "
          >
            <div
              className="
                flex h-8 w-8 flex-shrink-0
                items-center justify-center
                rounded-lg
                border border-indigo-100
                bg-indigo-50
              "
            >
              <Tag className="h-3.5 w-3.5 text-indigo-600" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                Category
              </p>

              <p
                title={company.category_name}
                className="mt-0.5 truncate text-xs font-semibold text-gray-800"
              >
                {company.category_name || "Not specified"}
              </p>
            </div>
          </div>

          {/* Subcategory */}
          {company.sub_category_name && (
            <div
              className="
                flex min-w-0 items-center gap-3
                border-b border-gray-100
                bg-white/40
                px-3 py-2.5
              "
            >
              <div
                className="
                  flex h-8 w-8 flex-shrink-0
                  items-center justify-center
                  rounded-lg
                  border border-purple-100
                  bg-purple-50
                "
              >
                <Tag className="h-3.5 w-3.5 text-purple-500" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                  Subcategory
                </p>

                <p
                  title={company.sub_category_name}
                  className="mt-0.5 truncate text-xs font-medium text-gray-700"
                >
                  {company.sub_category_name}
                </p>
              </div>
            </div>
          )}

          {/* Business type */}
          <div
            className="
              flex min-w-0 items-center gap-3
              px-3 py-2.5
              transition-colors
              group-hover:bg-white
            "
          >
            <div
              className="
                flex h-8 w-8 flex-shrink-0
                items-center justify-center
                rounded-lg
                border border-secondary/10
                bg-secondary/5
              "
            >
              <Building2 className="h-3.5 w-3.5 text-secondary" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                Business Type
              </p>

              <p className="mt-0.5 truncate text-xs font-semibold text-gray-800">
                {formatBusinessType(company.business_type)}
              </p>
            </div>
          </div>
        </div>

       
      
       
      </div>
    </article>
  );
}