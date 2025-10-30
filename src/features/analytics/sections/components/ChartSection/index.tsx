/**
 * Chart section for comparative top pages
 */

import { BarChart3 } from "lucide-react";
import { ChartSkeleton } from "../../ComparativeTopPages/components/ChartSkeleton";
import type { ChartSectionProps } from "./types";
import { EmptyState } from "./EmptyState";
import { ChartContent } from "./ChartContent";

export function ChartSection({
  selectedPaths,
  chartData,
  formatNumber,
  isLoading = false,
}: ChartSectionProps) {
  // Show skeleton while loading
  if (isLoading) {
    return <ChartSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-red-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comparativa de Páginas Top
        </h2>
      </div>

      {selectedPaths.length === 0 ? (
        <EmptyState />
      ) : (
        chartData && <ChartContent chartData={chartData} formatNumber={formatNumber} />
      )}
    </div>
  );
}
