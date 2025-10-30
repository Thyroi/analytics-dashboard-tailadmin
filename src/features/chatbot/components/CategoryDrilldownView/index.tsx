/**
 * Componente de drilldown para mostrar detalles de una categoría específica
 * Usa ChartPair con modo "grouped" + DonutChart
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import { useCategoryDrilldown } from "../../hooks/useCategoryDrilldownReal";
import { ErrorState } from "./ErrorState";
import { InsightsGrid } from "./InsightsGrid";
import type { CategoryDrilldownViewProps } from "./types";
import { ViewHeader } from "./ViewHeader";

export default function CategoryDrilldownView({
  categoryId,
  granularity,
  startDate,
  endDate,
  onBack,
  onSubcategoryClick,
}: CategoryDrilldownViewProps) {
  const drilldownData = useCategoryDrilldown({
    categoryId,
    granularity,
    startDate,
    endDate,
  });

  const categoryLabel = CATEGORY_META[categoryId]?.label || categoryId;
  const { subcategories, donutData, totalInteractions, isLoading, error } =
    drilldownData;

  const handleDonutSlice = (label: string) => {
    onSubcategoryClick?.(label);
  };

  if (error) {
    return (
      <ErrorState
        categoryLabel={categoryLabel}
        errorMessage={error.message}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="max-w-[1560px] mx-auto w-full space-y-6">
      <ViewHeader
        categoryLabel={categoryLabel}
        totalInteractions={totalInteractions}
        onBack={onBack}
      />

      <div className="px-4">
        <ChartPair
          mode="line"
          series={{
            current: [],
            previous: [],
          }}
          donutData={donutData}
          deltaPct={null}
          onDonutSlice={handleDonutSlice}
          donutCenterLabel={categoryLabel}
          showActivityButton={true}
          actionButtonTarget={`/chatbot/category/${categoryId}/activity`}
          granularity={granularity}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        />
      </div>

      {!isLoading && (
        <InsightsGrid
          donutData={donutData}
          totalInteractions={totalInteractions}
          subcategoryCount={subcategories.length}
        />
      )}
    </div>
  );
}

export type { CategoryDrilldownViewProps } from "./types";
