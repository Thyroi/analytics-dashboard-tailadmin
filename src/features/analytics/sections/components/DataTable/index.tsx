/**
 * Data table component for comparative pages
 */

import { TableEmptyState } from "../../ComparativeTopPages/components/TableEmptyState";
import { Pagination } from "../Pagination";
import { TableSkeleton } from "../TableSkeleton";
import { TableBody } from "./TableBody";
import { TableHeader } from "./TableHeader";
import type { DataTableProps } from "./types";

export function DataTable({
  data,
  isLoading,
  selectedPaths,
  sortBy,
  sortDir,
  searchTerm,
  onSort,
  onToggle,
  onPageChange,
}: DataTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!data?.items?.length) {
    return (
      <TableEmptyState hasSearchTerm={!!searchTerm} searchTerm={searchTerm} />
    );
  }

  return (
    <>
      <table className="w-full">
        <TableHeader sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
        <TableBody
          items={data.items}
          selectedPaths={selectedPaths}
          onToggle={onToggle}
        />
      </table>

      {/* Pagination */}
      {data.meta.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            currentPage={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}

export type { DataTableProps, SortDirection, SortField } from "./types";
