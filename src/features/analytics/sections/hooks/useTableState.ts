/**
 * Hook for managing table state (pagination, search, sorting)
 */

import { useCallback, useMemo, useState } from "react";

type SortField = "visits" | "deltaPct" | "label";
type SortDirection = "asc" | "desc";

export type { SortField, SortDirection };

export function useTableState() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("visits");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle sorting
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortBy === field) {
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortDir("desc");
      }
      setCurrentPage(1);
    },
    [sortBy]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return {
    currentPage,
    searchTerm,
    debouncedSearch,
    sortBy,
    sortDir,
    handleSort,
    handleSearchChange,
    handlePageChange,
  };
}
