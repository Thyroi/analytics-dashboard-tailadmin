import { useRef } from "react";
import { DataTable } from "../components/DataTable";
import type { SortDirection, SortField } from "../hooks/useTableState";

interface TableData {
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
}

interface TableContentProps {
  isOpen: boolean;
  data: TableData | null;
  isLoading: boolean;
  selectedPaths: string[];
  sortBy: SortField;
  sortDir: SortDirection;
  searchTerm: string;
  currentPage: number;
  onSort: (col: SortField) => void;
  onToggle: (path: string) => void;
  onPageChange: (page: number) => void;
}

export function TableContent({
  isOpen,
  data,
  isLoading,
  selectedPaths,
  sortBy,
  sortDir,
  searchTerm,
  onSort,
  onToggle,
  onPageChange,
}: TableContentProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  // Handle page change with scroll to table
  const handlePageChangeWithScroll = (page: number) => {
    onPageChange(page);

    // Scroll to table after a short delay to ensure content is updated
    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div ref={tableRef} className="overflow-x-auto">
      <DataTable
        data={data}
        isLoading={isLoading}
        selectedPaths={selectedPaths}
        sortBy={sortBy}
        sortDir={sortDir}
        searchTerm={searchTerm}
        onSort={onSort}
        onToggle={onToggle}
        onPageChange={handlePageChangeWithScroll}
      />
    </div>
  );
}
