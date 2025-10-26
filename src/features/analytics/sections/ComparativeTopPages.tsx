/**
 * Main comparative top pages component (refactored to under 60 lines)
 */

"use client";

import { colorForPath } from "@/lib/analytics/colors";
import { formatNumber } from "@/lib/analytics/format";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

// Hooks
import { useTopComparativePagesSeries } from "../hooks/useTopComparativePagesSeries";
import { useTopPagesTable } from "../hooks/useTopPagesTable";
import { useChartData } from "./hooks/useChartData";
import { usePageSelection } from "./hooks/usePageSelection";
import { useTableState } from "./hooks/useTableState";

// Components
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ChartSection } from "./components/ChartSection";
import { DataTable } from "./components/DataTable";
import { ErrorState } from "./components/ErrorState";
import { SelectedPills } from "./components/SelectedPills";

export default function ComparativeTopPages() {
  const queryClient = useQueryClient();
  const tableRef = useRef<HTMLDivElement>(null);
  const [isTableOpen, setIsTableOpen] = useState(false);

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

  const { selectedPaths, pillColors, handleItemToggle, handlePillRemove } =
    usePageSelection({
      topItems: tableData?.data || [],
      autoSelectCount: 5,
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

        <div
          ref={tableRef}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Accordion Header with Pills */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            {/* Row 1: Title + Toggle Button */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Páginas Top
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Selecciona páginas para comparar (máximo 8)
                </p>
              </div>

              {/* Toggle Button */}
              <button
                onClick={() => setIsTableOpen(!isTableOpen)}
                className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-expanded={isTableOpen}
                aria-label={isTableOpen ? "Colapsar tabla" : "Expandir tabla"}
              >
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                    isTableOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Row 2: Search Bar */}
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar páginas..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent w-full"
              />
            </div>

            {/* Row 3: Selected Pills */}
            {selectedPaths.length > 0 && (
              <SelectedPills
                selectedPaths={selectedPaths}
                pillColors={pillColors}
                colorForPath={colorForPath}
                onPillRemove={handlePillRemove}
              />
            )}
          </div>

          {/* Accordion Content - Collapsible */}
          {isTableOpen && (
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
          )}
        </div>
      </div>
    </div>
  );
}
