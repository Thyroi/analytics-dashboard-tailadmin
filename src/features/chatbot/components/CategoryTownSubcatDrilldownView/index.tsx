/**
 * Componente para Nivel 2: Categoría + Town → Subcategorías
 *
 * Muestra el drilldown de subcategorías para una categoría+town específico
 * usando pattern <townRaw>.<categoriaRaw>
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import { TOWN_META } from "@/lib/taxonomy/towns";
import { useCategoryTownSubcatBreakdown } from "../../hooks/useCategoryTownSubcatBreakdown";
import type { CategoryTownSubcatDrilldownViewProps } from "./CategoryTownSubcatDrilldownView.types";
import {
  CategoryTownSubcatEmptyDataState,
  CategoryTownSubcatErrorState,
  CategoryTownSubcatLoadingState,
} from "./CategoryTownSubcatEmptyState";
import CategoryTownSubcatHeader from "./CategoryTownSubcatHeader";
import CategoryTownSubcatInsights from "./CategoryTownSubcatInsights";
import { useCategoryTownSubcatData } from "./useCategoryTownSubcatData";

export default function CategoryTownSubcatDrilldownView({
  categoryId,
  townId,
  categoryRaw,
  townRaw,
  granularity,
  startDate,
  endDate,
  onBack,
  onSubcategoryClick,
}: CategoryTownSubcatDrilldownViewProps) {
  const categoryLabel = CATEGORY_META[categoryId]?.label || categoryId;
  const townLabel = TOWN_META[townId]?.label || townId;

  // Fetch data usando el hook de nivel 2
  const { data, isLoading, isError, error } = useCategoryTownSubcatBreakdown({
    categoryId,
    townId,
    startISO: startDate,
    endISO: endDate,
    windowGranularity: granularity,
    enabled: true,
  });

  // Transformar datos a formato ChartPair
  const {
    donutData,
    totalInteractions,
    insights,
    groupedCategories,
    groupedSeries,
  } = useCategoryTownSubcatData({
    data,
    categoryId,
    townId,
    granularity,
  });

  const handleDonutSlice = (label: string) => {
    onSubcategoryClick?.(label);
  };

  if (isLoading) {
    return (
      <CategoryTownSubcatLoadingState
        categoryLabel={categoryLabel}
        townLabel={townLabel}
        onBack={onBack}
      />
    );
  }

  if (isError) {
    return <CategoryTownSubcatErrorState onBack={onBack} error={error} />;
  }

  if (totalInteractions === 0) {
    return (
      <CategoryTownSubcatEmptyDataState
        categoryLabel={categoryLabel}
        townLabel={townLabel}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <CategoryTownSubcatHeader
        categoryLabel={categoryLabel}
        townLabel={townLabel}
        totalInteractions={totalInteractions}
        onBack={onBack}
      />

      <ChartPair
        mode="grouped"
        categories={groupedCategories}
        groupedSeries={groupedSeries}
        chartTitle="Subcategorías por intervalo"
        chartSubtitle={`${categoryLabel} • ${townLabel} • ${groupedCategories.length} intervalos`}
        chartHeight={350}
        tooltipFormatter={(val) => val.toLocaleString()}
        yAxisFormatter={(val) => val.toLocaleString()}
        donutData={donutData}
        deltaPct={null}
        onDonutSlice={handleDonutSlice}
        donutCenterLabel="Interacciones"
        showActivityButton={false}
        granularity={granularity}
        legendPosition="bottom"
        className=""
      />

      <CategoryTownSubcatInsights insights={insights} />
    </div>
  );
}
