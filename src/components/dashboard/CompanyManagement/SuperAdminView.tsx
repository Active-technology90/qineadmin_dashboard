// src/components/admin/CompanyManagement/SuperAdminView.tsx
import { DataTable, type Column } from "../../ui/DataTable";
import { Pagination } from "../../ui/Pagination";
import type { CompanyListItem } from "../../../types";

interface SuperAdminViewProps {
  paginatedItems: (CompanyListItem & { rowNumber?: number })[];
  columns: Column<CompanyListItem>[];
  loading: boolean;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (company: CompanyListItem) => void;
  onDelete?: (company: CompanyListItem) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export default function SuperAdminView({
  paginatedItems,
  columns,
  loading,
  sortField,
  sortOrder,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
 
}: SuperAdminViewProps) {
  return (
    <>
      <DataTable
        data={paginatedItems}
        columns={columns}
        loading={loading}
        emptyMessage="No companies found"
        onEdit={onEdit}
        onDelete={onDelete}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={onSort}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        // pageSize={pageSize}
        // onPageSizeChange={onPageSizeChange}
      />
    </>
  );
}