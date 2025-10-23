/**
 * Main comparative top pages component (refactored to under 60 lines)
 */

"use client";

import { colorForPath } from "@/lib/analytics/colors";
import { formatNumber } from "@/lib/analytics/format";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";

// Hooks
import { useTopComparativePagesSeries } from "../hooks/useTopComparativePagesSeries";
import { useTopPagesTable } from "../hooks/useTopPagesTable";
import { useChartData } from "./hooks/useChartData";
import { usePageSelection } from "./hooks/usePageSelection";
import { useTableState } from "./hooks/useTableState";

// Components
import { ChartSection } from "./components/ChartSection";
import { DataTable } from "./components/DataTable";
import { ErrorState } from "./components/ErrorState";
import { SelectedPills } from "./components/SelectedPills";
import { TableHeader } from "./components/TableHeader";

export default function ComparativeTopPages() {
  const queryClient = useQueryClient();
  const tableRef = useRef<HTMLDivElement>(null);

  // Force invalidation of old cache on mount
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["analytics", "top-comparative-pages"],
    });
  }, [queryClient]);

  // Custom hooks for state management
  const {
    currentPage,
    searchTerm,
    debouncedSearch,
    sortBy,
    sortDir,
    handleSort,
    handleSearchChange,
    handlePageChange,
  } = useTableState();

  // Handle page change with scroll to table
  const handlePageChangeWithScroll = (page: number) => {
    handlePageChange(page);

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

  const { selectedPaths, pillColors, handleItemToggle, handlePillRemove } =
    usePageSelection();

  // Data fetching
  const {
    data: tableData,
    isLoading: tableLoading,
    error: tableError,
  } = useTopPagesTable({
    page: currentPage,
    pageSize: 15,
    search: debouncedSearch,
    sortBy,
    sortDir,
    enabled: true,
  });

  const { data: seriesData, isLoading: seriesLoading } =
    useTopComparativePagesSeries(
      selectedPaths,
      tableData?.meta?.granularity || "d",
      tableData?.meta
        ? { start: tableData.meta.start, end: tableData.meta.end }
        : undefined
    );

  // Process chart data
  const chartData = useChartData(seriesData, selectedPaths);

  // Combined data
  const data = useMemo(() => {
    if (!tableData) return null;
    return {
      meta: tableData.meta,
      items: tableData.data,
      series: seriesData?.series || [],
    };
  }, [tableData, seriesData]);

  // Error handling
  if (tableError) {
    return (
      <ErrorState error={tableError} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="overflow-hidden">
      <div
        className="
        rounded-xl p-6 space-y-6 shadow-sm border-l-4 transition-all duration-200
        bg-gradient-to-r from-white via-[#fef2f2] to-[#fff7ed]
        dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-800/90
        border-gray-200/50 dark:border-gray-700/50 ring-1 ring-black/5 dark:ring-white/10
      "
        style={{ borderLeftColor: "var(--color-huelva-primary, #E55338)" }}
      >
        <ChartSection
          selectedPaths={selectedPaths}
          chartData={chartData}
          formatNumber={formatNumber}
          isLoading={seriesLoading && selectedPaths.length > 0}
        />

        <SelectedPills
          selectedPaths={selectedPaths}
          pillColors={pillColors}
          colorForPath={colorForPath}
          onPillRemove={handlePillRemove}
        />

        <div
          ref={tableRef}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <TableHeader
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
          />

          <div className="overflow-x-auto">
            <DataTable
              data={data}
              isLoading={tableLoading}
              selectedPaths={selectedPaths}
              sortBy={sortBy}
              sortDir={sortDir}
              searchTerm={searchTerm}
              onSort={handleSort}
              onToggle={handleItemToggle}
              onPageChange={handlePageChangeWithScroll}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
