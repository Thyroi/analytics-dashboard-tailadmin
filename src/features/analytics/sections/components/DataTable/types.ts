export type SortField = "visits" | "deltaPct" | "label";
export type SortDirection = "asc" | "desc";

export interface TableItem {
  path: string;
  label: string;
  visits: number;
  deltaPct: number | null;
}

export interface TableData {
  items: TableItem[];
  meta: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface DataTableProps {
  data: TableData | null;
  isLoading: boolean;
  selectedPaths: string[];
  sortBy: SortField;
  sortDir: SortDirection;
  searchTerm?: string;
  onSort: (field: SortField) => void;
  onToggle: (path: string) => void;
  onPageChange: (page: number) => void;
}
