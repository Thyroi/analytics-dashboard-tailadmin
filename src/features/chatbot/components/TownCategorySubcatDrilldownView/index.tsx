/**
 * Componente para Nivel 2: Town + Categoría → Subcategorías
 *
 * Muestra el drilldown de subcategorías para un town+categoría específico
 * usando pattern <townId>.<categoriaRaw>
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import { TOWN_META } from "@/lib/taxonomy/towns";
import { useTownCategorySubcatBreakdown } from "../../hooks/useTownCategorySubcatBreakdown";
import type { TownCategorySubcatDrilldownViewProps } from "./TownCategorySubcatDrilldownView.types";
import {
  TownCategorySubcatEmptyDataState,
  TownCategorySubcatLoadingState,
} from "./TownCategorySubcatEmptyState";
import TownCategorySubcatHeader from "./TownCategorySubcatHeader";
import TownCategorySubcatInsights from "./TownCategorySubcatInsights";
import { useTownCategorySubcatData } from "./useTownCategorySubcatData";

export default function TownCategorySubcatDrilldownView({
  townId,
  categoryId,
  categoryRaw,
  startISO,
  endISO,
  windowGranularity,
  onBack,
  onSubcategoryClick,
}: TownCategorySubcatDrilldownViewProps) {
  const townLabel = TOWN_META[townId]?.label || townId;
  const categoryLabel = CATEGORY_META[categoryId]?.label || categoryId;

  // Fetch data usando el hook de nivel 2
  const { data, isLoading } = useTownCategorySubcatBreakdown({
    townId,
    categoryId,
    startISO,
    endISO,
    windowGranularity,
    enabled: true,
  });

  // Transformar datos a formato ChartPair
  const {
    donutData,
    totalInteractions,
    insights,
    groupedCategories,
    groupedSeries,
  } = useTownCategorySubcatData({
    data,
    categoryId,
    windowGranularity,
  });

  const handleDonutSlice = (label: string) => {
    onSubcategoryClick?.(label);
  };

  if (isLoading) {
    return (
      <TownCategorySubcatLoadingState
        townLabel={townLabel}
        categoryLabel={categoryLabel}
        onBack={onBack}
      />
    );
  }

  if (totalInteractions === 0) {
    return (
      <TownCategorySubcatEmptyDataState
        townLabel={townLabel}
        categoryLabel={categoryLabel}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <TownCategorySubcatHeader
        townLabel={townLabel}
        categoryLabel={categoryLabel}
        totalInteractions={totalInteractions}
        onBack={onBack}
      />

      <ChartPair
        mode="grouped"
        categories={groupedCategories}
        groupedSeries={groupedSeries}
        chartTitle="Subcategorías por intervalo"
        chartSubtitle={`${townLabel} • ${categoryLabel} • ${groupedCategories.length} intervalos`}
        chartHeight={350}
        tooltipFormatter={(val) => val.toLocaleString()}
        yAxisFormatter={(val) => val.toLocaleString()}
        donutData={donutData}
        deltaPct={null}
        onDonutSlice={handleDonutSlice}
        donutCenterLabel="Interacciones"
        showActivityButton={false}
        granularity={windowGranularity}
        legendPosition="bottom"
        className=""
      />

      <TownCategorySubcatInsights insights={insights} />
    </div>
  );
}
