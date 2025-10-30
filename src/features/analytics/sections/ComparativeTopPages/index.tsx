/**
 * Main comparative top pages component (refactored)
 */

"use client";

import { formatNumber } from "@/lib/analytics/format";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

// Hooks
import { useTopComparativePagesSeries } from "../../hooks/useTopComparativePagesSeries";
import { useTopPagesTable } from "../../hooks/useTopPagesTable";
import { useChartData } from "../hooks/useChartData";
import { usePageSelection } from "../hooks/usePageSelection";
import { useTableState } from "../hooks/useTableState";

// Components
import { ChartSection } from "../components/ChartSection";
import { ErrorState } from "../components/ErrorState";
import { TableContent } from "./TableContent";
import { TableHeader } from "./TableHeader";

// Constants
import {
  AUTO_SELECT_COUNT,
  BORDER_LEFT_COLOR,
  CHART_WRAPPER_CLASSES,
  INITIAL_PAGE_SIZE,
} from "./constants";

export default function ComparativeTopPages() {
  const queryClient = useQueryClient();
  const [isTableOpen, setIsTableOpen] = useState(true);

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

  // Data fetching
  const {
    data: tableData,
    isLoading: tableLoading,
    error: tableError,
  } = useTopPagesTable({
    page: currentPage,
    pageSize: INITIAL_PAGE_SIZE,
    search: debouncedSearch,
    sortBy,
    sortDir,
    enabled: true,
  });

  const { selectedPaths, pillColors, handleItemToggle, handlePillRemove } =
    usePageSelection({
      topItems: tableData?.data || [],
      autoSelectCount: AUTO_SELECT_COUNT,
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
        className={CHART_WRAPPER_CLASSES}
        style={{ borderLeftColor: BORDER_LEFT_COLOR }}
      >
        <ChartSection
          selectedPaths={selectedPaths}
          chartData={chartData}
          formatNumber={formatNumber}
          isLoading={seriesLoading && selectedPaths.length > 0}
        />

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <TableHeader
            isTableOpen={isTableOpen}
            onToggle={() => setIsTableOpen(!isTableOpen)}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            selectedPaths={selectedPaths}
            pillColors={pillColors}
            onPillRemove={handlePillRemove}
          />

          <TableContent
            isOpen={isTableOpen}
            data={data}
            isLoading={tableLoading}
            selectedPaths={selectedPaths}
            sortBy={sortBy}
            sortDir={sortDir}
            searchTerm={searchTerm}
            currentPage={currentPage}
            onSort={handleSort}
            onToggle={handleItemToggle}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
