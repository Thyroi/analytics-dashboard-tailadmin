/**
 * Data table component for comparative pages
 */

import { TableEmptyState } from "../ComparativeTopPages/components/TableEmptyState";
import { Pagination } from "./Pagination";
import { SortButton } from "./SortButton";
import { TableRow } from "./TableRow";
import { TableSkeleton } from "./TableSkeleton";

type SortField = "visits" | "deltaPct" | "label";
type SortDirection = "asc" | "desc";

interface DataTableProps {
  data: {
    items: Array<{
      path: string;
      label: string;
      visits: number;
      deltaPct: number | null;
    }>;
    meta: {
      page: number;
      totalPages: number;
      totalItems: number;
    };
  } | null;
  isLoading: boolean;
  selectedPaths: string[];
  sortBy: SortField;
  sortDir: SortDirection;
  searchTerm?: string;
  onSort: (field: SortField) => void;
  onToggle: (path: string) => void;
  onPageChange: (page: number) => void;
}

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
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                className="rounded border-gray-300 dark:border-gray-600"
                disabled
              />
            </th>
            <th className="px-6 py-3 text-left">
              <SortButton
                field="label"
                currentSort={sortBy}
                currentDir={sortDir}
                onSort={onSort}
              >
                Página
              </SortButton>
            </th>
            <th className="px-6 py-3 text-left">
              <SortButton
                field="visits"
                currentSort={sortBy}
                currentDir={sortDir}
                onSort={onSort}
              >
                Visitas
              </SortButton>
            </th>
            <th className="px-6 py-3 text-left">
              <SortButton
                field="deltaPct"
                currentSort={sortBy}
                currentDir={sortDir}
                onSort={onSort}
              >
                Cambio
              </SortButton>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.items.map((item) => {
            const isSelected = selectedPaths.includes(item.path);
            const isDisabled = !isSelected && selectedPaths.length >= 8;

            return (
              <TableRow
                key={item.path}
                item={item}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onToggle={onToggle}
              />
            );
          })}
        </tbody>
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
